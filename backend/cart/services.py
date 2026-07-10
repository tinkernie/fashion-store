from django.db import transaction
from django.utils import timezone
from common.exceptions import BusinessException
from .models import Cart, CartItem
from .repositories import CartRepository, CartItemRepository
from .selectors import CartSelector
from inventory.services import InventoryService
from variants.selectors import VariantSelector

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
        variant = VariantSelector.get_variant_by_id(variant_id)
        if not variant or variant.status != 'published':
            raise BusinessException("Variant not available.")
        cart = self._resolve_cart(user, session_key)

        # Reserve stock
        user_id = str(user.id) if user and user.is_authenticated else None
        try:
            reservation = self.inventory_service.reserve_stock(
                variant_id, quantity, user_id=user_id,
                expires_in_minutes=15  # default
            )
        except BusinessException as e:
            raise BusinessException(f"Cannot reserve stock: {e}")

        # Add or update item
        item = CartRepository.add_item(
            cart,
            variant_id,
            quantity,
            str(variant.price),
            reservation_id=reservation['reservation_id']
        )
        return self._serialize_cart(cart)

    @transaction.atomic
    def remove_item(self, user, session_key: str, variant_id: str) -> dict:
        cart = self._resolve_cart(user, session_key)
        item = CartItemRepository.get_item(cart, variant_id)
        if not item:
            raise BusinessException("Item not in cart.")
        # Release reservation
        if item.reservation_id:
            try:
                self.inventory_service.release_reservation(item.reservation_id)
            except BusinessException:
                pass  # reservation may already be expired
        CartRepository.remove_item(item)
        return self._serialize_cart(cart)

    @transaction.atomic
    def update_quantity(self, user, session_key: str, variant_id: str, quantity: int) -> dict:
        if quantity <= 0:
            return self.remove_item(user, session_key, variant_id)
        cart = self._resolve_cart(user, session_key)
        item = CartItemRepository.get_item(cart, variant_id)
        if not item:
            raise BusinessException("Item not in cart.")
        # Adjust reservation: release old, reserve new
        if item.reservation_id:
            try:
                self.inventory_service.release_reservation(item.reservation_id)
            except BusinessException:
                pass
        user_id = str(user.id) if user and user.is_authenticated else None
        try:
            reservation = self.inventory_service.reserve_stock(
                variant_id, quantity, user_id=user_id
            )
        except BusinessException as e:
            raise BusinessException(f"Cannot adjust reservation: {e}")
        CartRepository.update_item(item, quantity=quantity, reservation_id=reservation['reservation_id'])
        return self._serialize_cart(cart)

    @transaction.atomic
    def clear_cart(self, user, session_key: str):
        cart = self._resolve_cart(user, session_key)
        # Release all reservations
        for item in cart.items.all():
            if item.reservation_id:
                try:
                    self.inventory_service.release_reservation(item.reservation_id)
                except BusinessException:
                    pass
        CartRepository.clear_cart(cart)

    @transaction.atomic
    def merge_carts(self, user, session_key: str):
        """Merge guest cart into authenticated user's cart."""
        guest_cart = CartSelector.get_cart_by_session(session_key)
        if not guest_cart or not guest_cart.items.exists():
            return
        user_cart = CartRepository.get_or_create_cart_for_user(user)
        # Combine items
        for item in guest_cart.items.all():
            existing = CartItemRepository.get_item(user_cart, item.variant_id)
            if existing:
                # Sum quantities, keep latest reservation (maybe release guest's)
                new_qty = existing.quantity + item.quantity
                # Release existing reservation? Complex: we'll release both and re-reserve the total.
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
                # Re‑reserve total quantity for user
                user_id = str(user.id)
                try:
                    reservation = self.inventory_service.reserve_stock(
                        item.variant_id, new_qty, user_id=user_id
                    )
                except BusinessException:
                    # If reservation fails, set quantity to available? We'll add item with quantity and no reservation for now.
                    reservation = None
                existing.quantity = new_qty
                existing.reservation_id = reservation['reservation_id'] if reservation else None
                existing.save()
            else:
                # Move guest item to user cart
                # Re‑reserve with user ID
                if item.reservation_id:
                    try:
                        self.inventory_service.release_reservation(item.reservation_id)
                    except BusinessException:
                        pass
                user_id = str(user.id)
                try:
                    reservation = self.inventory_service.reserve_stock(
                        item.variant_id, item.quantity, user_id=user_id
                    )
                    reservation_id = reservation['reservation_id']
                except BusinessException:
                    reservation_id = None
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

    def _serialize_cart(self, cart: Cart) -> dict:
        items = []
        for item in cart.items.all():
            items.append({
                'id': str(item.id),
                'variant_id': str(item.variant_id),
                'sku': item.variant.sku,
                'product_title': item.variant.product.title,
                'option_details': self._get_option_summary(item.variant),
                'quantity': item.quantity,
                'price': str(item.price_snapshot),
                'image': None,  # to be filled by media domain later
                'reservation_id': item.reservation_id,
            })
        return {
            'id': str(cart.id),
            'user_id': str(cart.user_id) if cart.user_id else None,
            'session_key': str(cart.session_key),
            'coupon_code': cart.coupon.code if cart.coupon else None,
            'items': items,
            'total': str(sum(float(item.price_snapshot) * item.quantity for item in cart.items.all())),
        }

    def _get_option_summary(self, variant):
        return ', '.join(
            f"{vo.option.name}: {vo.option_value.value}"
            for vo in variant.variantoption_set.select_related('option', 'option_value').all()
        )