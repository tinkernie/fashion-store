from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from common.exceptions import BusinessException
from .models import Cart, CartItem
from .repositories import CartRepository, CartItemRepository
from .selectors import CartSelector
from inventory.services import InventoryService
from variants.selectors import VariantSelector
from analytics.signals import cart_changed


class CartService:
    def __init__(self):
        self.inventory_service = InventoryService()

    def get_cart(self, user=None, session_key: str = None) -> dict:
        cart = None
        if user and user.is_authenticated:
            cart = CartSelector.get_cart_by_user(user)
            if not cart:
                cart = CartRepository.get_or_create_cart_for_user(user)
        elif session_key:
            cart = CartSelector.get_cart_by_session(session_key)
            if not cart:
                cart = CartRepository.get_or_create_cart_by_session(session_key)
        if not cart:
            raise BusinessException("Cart not found.")
        return self._serialize_cart(cart)

    @transaction.atomic
    def add_item(self, user, session_key: str, variant_id: str, quantity: int) -> dict:
        from inventory.models import Inventory

        if quantity <= 0:
            raise BusinessException("Quantity must be positive.")

        variant = VariantSelector.get_variant_by_id(variant_id)
        if not variant:
            raise BusinessException("Variant not available.")

        # H4: do not auto-publish draft variants - enforce published check
        if variant.status != variant.Status.PUBLISHED:
            raise BusinessException("Variant not available.")

        actual_variant_id = str(variant.id)

        # H4: do not auto-create inventory with 50 nor inflate - require real stock
        try:
            inv = Inventory.objects.select_for_update().get(variant_id=actual_variant_id)
        except Inventory.DoesNotExist:
            raise BusinessException("Out of stock.")

        # Validate stock before any reservation - no auto-inflate
        sellable = inv.available_quantity - inv.reserved_quantity
        if sellable < quantity:
            raise BusinessException(f"Only {max(0, sellable)} units available.")

        # H5: lock cart row
        cart = self._resolve_cart_locked(user, session_key)
        # H5: lock item if exists
        item = CartItem.objects.select_for_update().filter(cart=cart, variant_id=actual_variant_id).first()
        new_quantity = quantity + (item.quantity if item else 0)

        if item and item.reservation_id:
            try:
                self.inventory_service.release_reservation(item.reservation_id)
            except BusinessException:
                pass

        # H4: reserve the total new_quantity, not just delta, after releasing old
        # If item exists, we released old, so we need to reserve new_quantity
        reserve_qty = new_quantity if item else quantity
        user_id = str(user.id) if user and user.is_authenticated else None
        try:
            reservation = self.inventory_service.reserve_stock(
                actual_variant_id, reserve_qty, user_id=user_id, expires_in_minutes=15
            )
        except BusinessException as e:
            raise BusinessException(f"Cannot reserve stock: {e}")

        # Add or update item
        if item:
            CartRepository.update_item(
                item, quantity=new_quantity, reservation_id=reservation["reservation_id"]
            )
        else:
            CartRepository.add_item(
                cart, actual_variant_id, new_quantity, str(variant.price),
                reservation_id=reservation["reservation_id"],
            )
        # H5/H8: dispatch signal after commit
        transaction.on_commit(lambda: cart_changed.send(
            sender=self.__class__,
            user=user,
            session_key=session_key,
            action='add',
            variant_id=actual_variant_id,
            quantity=quantity
        ))
        return self._serialize_cart(cart)

    @transaction.atomic
    def remove_item(self, user, session_key: str, variant_id: str) -> dict:
        cart = self._resolve_cart_locked(user, session_key)
        item = CartItem.objects.select_for_update().filter(cart=cart, variant_id=variant_id).first()
        if not item:
            item = CartItem.objects.select_for_update().filter(cart=cart, variant__product_id=variant_id).first()
        if not item:
            raise BusinessException("Item not in cart.")
        
        actual_variant_id = str(item.variant_id)
        # Release reservation
        if item.reservation_id:
            try:
                self.inventory_service.release_reservation(item.reservation_id)
            except BusinessException:
                pass  # reservation may already be expired
        CartRepository.remove_item(item)

        transaction.on_commit(lambda: cart_changed.send(
            sender=self.__class__,
            user=user,
            session_key=session_key,
            action='remove',
            variant_id=actual_variant_id,
            quantity=item.quantity
        ))

        return self._serialize_cart(cart)

    @transaction.atomic
    def update_quantity(
            self, user, session_key: str, variant_id: str, quantity: int
    ) -> dict:
        if quantity <= 0:
            return self.remove_item(user, session_key, variant_id)
        cart = self._resolve_cart_locked(user, session_key)
        item = CartItem.objects.select_for_update().filter(cart=cart, variant_id=variant_id).first()
        if not item:
            item = CartItem.objects.select_for_update().filter(cart=cart, variant__product_id=variant_id).first()
        if not item:
            raise BusinessException("Item not in cart.")
        
        actual_variant_id = str(item.variant_id)
        # Adjust reservation: release old, reserve new
        if item.reservation_id:
            try:
                self.inventory_service.release_reservation(item.reservation_id)
            except BusinessException:
                pass
        user_id = str(user.id) if user and user.is_authenticated else None
        try:
            reservation = self.inventory_service.reserve_stock(
                actual_variant_id, quantity, user_id=user_id
            )
        except BusinessException as e:
            raise BusinessException(f"Cannot adjust reservation: {e}")
        CartRepository.update_item(
            item, quantity=quantity, reservation_id=reservation["reservation_id"]
        )

        transaction.on_commit(lambda: cart_changed.send(
            sender=self.__class__,
            user=user,
            session_key=session_key,
            action='update',
            variant_id=actual_variant_id,
            quantity=quantity
        ))

        return self._serialize_cart(cart)

    @transaction.atomic
    def clear_cart(self, user, session_key: str):
        cart = self._resolve_cart_locked(user, session_key)
        # Release all reservations
        for item in CartItem.objects.select_for_update().filter(cart=cart):
            if item.reservation_id:
                try:
                    self.inventory_service.release_reservation(item.reservation_id)
                except BusinessException:
                    pass
        CartRepository.clear_cart(cart)

    @transaction.atomic
    def merge_carts(self, user, session_key: str):
        """Merge guest cart into authenticated user's cart."""
        guest_cart = Cart.objects.select_for_update().filter(session_key=session_key).first()
        if not guest_cart or not guest_cart.items.exists():
            return
        user_cart = CartRepository.get_or_create_cart_for_user(user)
        # Lock user_cart
        user_cart = Cart.objects.select_for_update().get(id=user_cart.id)
        # Combine items - locked guest items
        for item in CartItem.objects.select_for_update().filter(cart=guest_cart):
            existing = CartItem.objects.select_for_update().filter(cart=user_cart, variant_id=item.variant_id).first()
            if existing:
                new_qty = existing.quantity + item.quantity
                if existing.reservation_id:
                    try:
                        self.inventory_service.release_reservation(existing.reservation_id)
                    except BusinessException:
                        pass
                if item.reservation_id:
                    try:
                        self.inventory_service.release_reservation(item.reservation_id)
                    except BusinessException:
                        pass
                user_id = str(user.id)
                try:
                    reservation = self.inventory_service.reserve_stock(
                        str(item.variant_id), new_qty, user_id=user_id
                    )
                    reservation_id = reservation["reservation_id"]
                except BusinessException as e:
                    # H4: do not create orphan without reservation - skip merge for this item
                    raise BusinessException(f"Cannot merge item {item.variant_id}: {e}")
                existing.quantity = new_qty
                existing.reservation_id = reservation_id
                existing.save(update_fields=["quantity", "reservation_id", "updated_at"])
            else:
                if item.reservation_id:
                    try:
                        self.inventory_service.release_reservation(item.reservation_id)
                    except BusinessException:
                        pass
                user_id = str(user.id)
                try:
                    reservation = self.inventory_service.reserve_stock(
                        str(item.variant_id), item.quantity, user_id=user_id
                    )
                    reservation_id = reservation["reservation_id"]
                except BusinessException as e:
                    raise BusinessException(f"Cannot merge item {item.variant_id}: {e}")
                CartItem.objects.create(
                    cart=user_cart,
                    variant_id=item.variant_id,
                    quantity=item.quantity,
                    price_snapshot=item.price_snapshot,
                    reservation_id=reservation_id,
                )
        # Delete guest cart
        guest_cart.delete()

    def _resolve_cart(self, user, session_key: str) -> Cart:
        if user and user.is_authenticated:
            cart = CartSelector.get_cart_by_user(user)
            if not cart:
                cart = CartRepository.get_or_create_cart_for_user(user)
        elif session_key:
            cart = CartSelector.get_cart_by_session(session_key)
            if not cart:
                cart = CartRepository.get_or_create_cart_by_session(session_key)
        else:
            raise BusinessException("No user or session provided.")
        return cart

    def _resolve_cart_locked(self, user, session_key: str) -> Cart:
        """H5: locked version for atomic operations."""
        if user and user.is_authenticated:
            cart = Cart.objects.select_for_update().filter(user=user).first()
            if not cart:
                cart = CartRepository.get_or_create_cart_for_user(user)
                cart = Cart.objects.select_for_update().get(id=cart.id)
            return cart
        elif session_key:
            cart = Cart.objects.select_for_update().filter(session_key=session_key).first()
            if not cart:
                cart = CartRepository.get_or_create_cart_by_session(session_key)
                cart = Cart.objects.select_for_update().get(id=cart.id)
            return cart
        else:
            raise BusinessException("No user or session provided.")

    def _serialize_cart(self, cart: Cart) -> dict:
        items = []
        from media_libm.selectors import MediaSelector
        cart_items = list(CartItem.objects.filter(cart_id=cart.id).select_related("variant__product"))
        for item in cart_items:
            img = ""
            if item.variant.product.metadata and "image_url" in item.variant.product.metadata:
                img = item.variant.product.metadata["image_url"]
            elif item.variant.product.metadata and "imageUrl" in item.variant.product.metadata:
                img = item.variant.product.metadata["imageUrl"]
            else:
                try:
                    main_img = MediaSelector.get_main_image_for_product(item.variant.product)
                    if main_img and main_img.get("url"):
                        img = main_img["url"]
                except Exception:
                    pass

            items.append(
                {
                    "id": str(item.id),
                    "variant_id": str(item.variant_id),
                    "sku": item.variant.sku,
                    "product_title": item.variant.product.title,
                    "option_details": self._get_option_summary(item.variant),
                    "quantity": item.quantity,
                    "price": str(item.price_snapshot),
                    "image": img,
                    "imageUrl": img,
                    "reservation_id": item.reservation_id,
                }
            )

        # H8: use Decimal not float for money
        subtotal = sum((item.price_snapshot * item.quantity for item in cart_items), Decimal("0.00"))
        discount_amount = Decimal("0.00")
        coupon_code = None
        coupon_data = None
        if cart.coupon:
            coupon_code = cart.coupon.code
            try:
                from coupons.services import CouponService
                coupon_service = CouponService()
                coupon_items = [
                    {
                        "variant_id": str(item.variant_id),
                        "quantity": item.quantity,
                        "price": item.price_snapshot,
                        "category_id": str(item.variant.product.category_id) if item.variant.product.category_id else None,
                        "product_id": str(item.variant.product_id),
                    }
                    for item in cart_items
                ]
                result = coupon_service.validate_and_calculate(coupon_code, cart.user or None, coupon_items)
                discount_amount = result['discount'] if isinstance(result['discount'], Decimal) else Decimal(str(result['discount']))
                coupon_data = {
                    "code": cart.coupon.code,
                    "discount_type": cart.coupon.discount_type,
                    "discount_value": str(cart.coupon.discount_value),
                }
            except BusinessException:
                cart.coupon = None
                cart.save(update_fields=['coupon', 'updated_at'])
                coupon_code = None
        total = max(Decimal("0.00"), subtotal - discount_amount)

        return {
            "id": str(cart.id),
            "user_id": str(cart.user_id) if cart.user_id else None,
            "session_key": str(cart.session_key),
            "coupon_code": coupon_code,
            "coupon": coupon_data,
            "discount_amount": str(discount_amount),
            "discount_type": coupon_data["discount_type"] if coupon_data else None,
            "discount_value": coupon_data["discount_value"] if coupon_data else "0.00",
            "items": items,
            "subtotal": str(subtotal),
            "total": str(total),
        }

    def _get_option_summary(self, variant):
        return ", ".join(
            f"{vo.option.name}: {vo.option_value.value}"
            for vo in variant.variantoption_set.select_related(
                "option", "option_value"
            ).all()
        )

    @transaction.atomic
    def apply_coupon(self, user, session_key: str, code: str) -> dict:
        cart = self._resolve_cart_locked(user, session_key)
        # Collect cart items for validation
        items_data = []
        for item in CartItem.objects.select_for_update().filter(cart=cart).select_related("variant__product"):
            items_data.append({
                'variant_id': str(item.variant_id),
                'quantity': item.quantity,
                'price': item.price_snapshot,
                'category_id': str(item.variant.product.category_id) if item.variant.product.category_id else None,
                'product_id': str(item.variant.product_id),
            })
        from coupons.services import CouponService
        coupon_service = CouponService()
        result = coupon_service.validate_and_calculate(code, user or cart.user, items_data)
        # Store coupon FK on cart
        cart.coupon_id = result['coupon_id']
        cart.save(update_fields=['coupon', 'updated_at'])
        # Return updated cart with discount
        return self.get_cart(user, session_key)

    def remove_coupon(self, user, session_key: str) -> dict:
        cart = self._resolve_cart_locked(user, session_key)
        cart.coupon = None
        cart.save(update_fields=['coupon', 'updated_at'])
        return self.get_cart(user, session_key)
