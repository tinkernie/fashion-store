from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from common.exceptions import BusinessException
from .models import Order
from .repositories import OrderRepository
from .selectors import OrderSelector
from cart.selectors import CartSelector
from cart.models import Cart
from inventory.services import InventoryService
from variants.selectors import VariantSelector
from notifications.signals import order_status_changed
from analytics.signals import order_placed

STATUS_TRANSITIONS = {
    Order.Status.PENDING: [Order.Status.AWAITING_PAYMENT, Order.Status.CANCELLED],
    Order.Status.AWAITING_PAYMENT: [Order.Status.PAID, Order.Status.CANCELLED],
    Order.Status.PAID: [Order.Status.PACKING, Order.Status.CANCELLED],
    Order.Status.PACKING: [Order.Status.SHIPPING, Order.Status.CANCELLED],
    Order.Status.SHIPPING: [Order.Status.DELIVERED],
    Order.Status.DELIVERED: [Order.Status.RETURNED],
    Order.Status.RETURNED: [Order.Status.REFUNDED],
    Order.Status.REFUNDED: [],
    Order.Status.CANCELLED: [],
}

# Step3: admin bypass allowlist (guide) - requires note for audit
ADMIN_ALLOWED_TARGETS = [
    Order.Status.PAID,
    Order.Status.PACKING,
    Order.Status.SHIPPING,
    Order.Status.DELIVERED,
    Order.Status.CANCELLED,
    Order.Status.RETURNED,
    Order.Status.REFUNDED,
]


class OrderService:
    def __init__(self):
        self.inventory_service = InventoryService()

    @transaction.atomic
    def create_order_from_cart(self, user, shipping_address: dict, billing_address: dict = None) -> dict:
        # H5/H8: lock cart row to prevent duplicate order creation
        cart = Cart.objects.select_for_update().filter(user=user).first()
        if not cart:
            cart = CartSelector.get_cart_by_user(user)
        if not cart or not cart.items.exists():
            raise BusinessException("Cart is empty.")

        # Lock cart items for consistent read
        cart_items = list(cart.items.select_for_update().select_related("variant__product"))

        # H8: re-validate all items have active reservations and price matches current variant price
        for item in cart_items:
            if not item.reservation_id:
                raise BusinessException(
                    f"No reservation for variant {item.variant.sku}. Please re-add."
                )
            variant = VariantSelector.get_variant_by_id(item.variant_id)
            if not variant or variant.status != "published":
                raise BusinessException(
                    f"Variant {item.variant.sku} is no longer available."
                )
            # H8: price re-validation with Decimal, tolerance 0.01
            current_price = Decimal(str(variant.price))
            if current_price != item.price_snapshot:
                raise BusinessException(
                    f"Price changed for {variant.sku}. Please refresh cart."
                )

        # Compute totals with Decimal
        subtotal = sum(
            (item.price_snapshot * item.quantity for item in cart_items), Decimal("0.00"),
        )
        coupon = cart.coupon
        discount_amount = Decimal('0.00')
        if coupon:
            from coupons.services import CouponService
            coupon_service = CouponService()
            items_data = []
            for item in cart_items:
                variant = item.variant
                items_data.append({
                    'variant_id': str(variant.id),
                    'quantity': item.quantity,
                    'price': item.price_snapshot,
                    'category_id': str(variant.product.category_id) if variant.product.category_id else None,
                    'product_id': str(variant.product_id),
                })
            result = coupon_service.validate_and_calculate(coupon.code, user, items_data)
            discount_amount = result['discount'] if isinstance(result['discount'], Decimal) else Decimal(str(result['discount']))

        shipping_cost = Decimal("0.00")
        tax_amount = Decimal("0.00")
        total = subtotal - discount_amount + shipping_cost + tax_amount
        if total < Decimal("0.00"):
            total = Decimal("0.00")

        # Build order items snapshot
        items_data = []
        for item in cart_items:
            variant = item.variant
            option_summary = ", ".join(
                f"{vo.option.name}: {vo.option_value.value}"
                for vo in variant.variantoption_set.select_related(
                    "option", "option_value"
                ).all()
            )

            from media_libm.selectors import MediaSelector
            product = variant.product
            main_image = MediaSelector.get_main_image_for_product(product)
            product_snapshot = {
                "title": variant.product.title,
                "options": option_summary,
                "sku": variant.sku,
                "image": main_image,
            }
            items_data.append(
                {
                    "variant_id": variant.id,
                    "product_id": variant.product_id,
                    "product_snapshot": product_snapshot,
                    "quantity": item.quantity,
                    "price_snapshot": item.price_snapshot,
                    "line_total": item.price_snapshot * item.quantity,
                }
            )

        # Generate order number
        order_number = OrderRepository.generate_order_number()

        order_data = {
            "order_number": order_number,
            "status": Order.Status.PENDING,
            "subtotal": subtotal,
            "coupon": coupon,
            "discount_amount": discount_amount,
            "tax_amount": tax_amount,
            "shipping_cost": shipping_cost,
            "total": total,
            "shipping_address": shipping_address,
            "billing_address": billing_address or shipping_address,
            "placed_at": timezone.now(),
        }

        order = OrderRepository.create_order(
            user_id=str(user.id),
            data=order_data,
            items_data=items_data,
        )

        # H8: commit reservations after order created but before cart cleared - if fails, order will rollback due to atomic
        for item in cart_items:
            if item.reservation_id:
                try:
                    self.inventory_service.commit_reservation(item.reservation_id)
                except BusinessException as e:
                    raise BusinessException(
                        f"Stock reservation for {item.variant.sku} expired. Please refresh cart."
                    )

        if coupon:
            # H9: increment usage under same transaction atomicity - service should handle lock
            from coupons.services import CouponService
            CouponService().increment_usage(coupon, user, order)

        # Clear the cart after successful reservation commit
        cart.items.all().delete()
        cart.coupon = None
        cart.save(update_fields=["coupon", "updated_at"])

        # Log initial status
        OrderRepository.update_status(order, Order.Status.PENDING)

        # H8: dispatch after commit
        transaction.on_commit(lambda: order_placed.send(
            sender=self.__class__,
            user=user,
            order=order,
            items_data=items_data,
        ))

        return self._serialize_order(order)

    @transaction.atomic
    def transition_status(self, order_id: str, new_status: str, note: str = "", actor=None) -> dict:
        # H5: lock order row
        try:
            order = Order.objects.select_for_update().get(id=order_id)
        except Order.DoesNotExist:
            raise BusinessException("Order not found.")

        status_alias_map = {
            "processing": Order.Status.PACKING,
            "shipped": Order.Status.SHIPPING,
        }
        normalized_status = status_alias_map.get(str(new_status).lower().strip(), str(new_status).lower().strip())

        # H7 + Step3: strict for normal users, admin bypass with audit note
        allowed_next = STATUS_TRANSITIONS.get(order.status, [])
        is_admin_bypass = False
        if actor and getattr(actor, "is_staff", False):
            # Admin can jump to any ADMIN_ALLOWED_TARGETS if note provided (audit)
            if normalized_status in ADMIN_ALLOWED_TARGETS:
                if not note or not note.strip():
                    raise BusinessException("Admin status jump requires a note for audit.")
                is_admin_bypass = True

        if not is_admin_bypass and normalized_status not in allowed_next:
            raise BusinessException(
                f"Cannot transition from {order.status} to {new_status}. Allowed: {allowed_next}"
            )

        new_status = normalized_status

        # Side-effects based on status
        if new_status == Order.Status.CANCELLED:
            self._release_order_inventory(order)
            order.cancelled_at = timezone.now()
        elif new_status == Order.Status.PAID:
            order.paid_at = timezone.now()
        elif new_status == Order.Status.SHIPPING:
            order.shipped_at = timezone.now()
        elif new_status == Order.Status.DELIVERED:
            order.delivered_at = timezone.now()

        old_status = order.status
        OrderRepository.update_status(order, new_status, note=note)
        order.save(update_fields=["status", "cancelled_at", "paid_at", "shipped_at", "delivered_at", "updated_at"])

        # after successful transition
        transaction.on_commit(
            lambda: order_status_changed.send(
                sender=self.__class__,
                order=order,
                old_status=old_status,
                new_status=new_status,
            )
        )
        return self._serialize_order(order)

    def get_user_orders(self, user) -> list[dict]:
        orders = OrderSelector.get_user_orders(user)
        return [self._serialize_order(order) for order in orders]

    def get_order_by_number(self, order_number: str, user=None) -> dict:
        order = OrderSelector.get_order_by_number(order_number)
        if not order or (user and order.user_id != user.id and not user.is_staff):
            raise BusinessException("Order not found.")
        return self._serialize_order(order)

    def _release_order_inventory(self, order: Order):
        """Return stock for all items if order is cancelled before shipping."""
        # H7: include PACKING as cancellable before shipping
        if order.status in [
            Order.Status.PENDING,
            Order.Status.AWAITING_PAYMENT,
            Order.Status.PAID,
            Order.Status.PACKING,
        ]:
            for item in order.items.all():
                if item.variant_id:
                    try:
                        self.inventory_service.adjust_stock(
                            str(item.variant_id), item.quantity
                        )
                    except BusinessException:
                        pass  # inventory may not exist; log error
        # No action if already shipped etc.

    def _serialize_order(self, order: Order) -> dict:
        items = []
        for item in order.items.all():
            items.append(
                {
                    "id": str(item.id),
                    "product_snapshot": item.product_snapshot,
                    "quantity": item.quantity,
                    "price": str(item.price_snapshot),
                    "line_total": str(item.line_total),
                }
            )
        return {
            "id": str(order.id),
            "order_number": order.order_number,
            "status": order.status,
            "subtotal": str(order.subtotal),
            "discount_amount": str(order.discount_amount),
            "tax_amount": str(order.tax_amount),
            "shipping_cost": str(order.shipping_cost),
            "total": str(order.total),
            "shipping_address": order.shipping_address,
            "billing_address": order.billing_address,
            "placed_at": order.placed_at.isoformat(),
            "paid_at": order.paid_at.isoformat() if order.paid_at else None,
            "shipped_at": order.shipped_at.isoformat() if order.shipped_at else None,
            "delivered_at": (
                order.delivered_at.isoformat() if order.delivered_at else None
            ),
            "cancelled_at": (
                order.cancelled_at.isoformat() if order.cancelled_at else None
            ),
            "items": items,
            "status_history": [
                {
                    "from": h.from_status,
                    "to": h.to_status,
                    "timestamp": h.timestamp.isoformat(),
                    "note": h.note,
                }
                for h in order.status_history.all()
            ],
        }
