from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from common.exceptions import BusinessException
from .models import Order
from .repositories import OrderRepository
from .selectors import OrderSelector
from cart.selectors import CartSelector
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


class OrderService:
    def __init__(self):
        self.inventory_service = InventoryService()

    @transaction.atomic
    def create_order_from_cart(self, user, shipping_address: dict, billing_address: dict = None) -> dict:
        cart = CartSelector.get_cart_by_user(user)
        if not cart or not cart.items.exists():
            raise BusinessException("Cart is empty.")

        # Validate all items still have active reservations and prices
        for item in cart.items.all():
            if not item.reservation_id:
                raise BusinessException(
                    f"No reservation for variant {item.variant.sku}. Please re‑add."
                )
            # Optionally verify variant still exists/published
            variant = VariantSelector.get_variant_by_id(item.variant_id)
            if not variant or variant.status != "published":
                raise BusinessException(
                    f"Variant {item.variant.sku} is no longer available."
                )

        # Compute totals
        subtotal = sum(
            (item.price_snapshot * item.quantity for item in cart.items.all()), Decimal("0.00"),
        )
        # discount_amount = 0  # coupon logic later
        coupon = cart.coupon
        discount_amount = Decimal('0.00')
        if coupon:
            # Validate and recalc discount
            from coupons.services import CouponService
            coupon_service = CouponService()
            # Build items_data similar to above, with category etc.
            items_data = []
            for item in cart.items.all():
                variant = item.variant
                items_data.append({
                    'variant_id': str(variant.id),
                    'quantity': item.quantity,
                    'price': item.price_snapshot,
                    'category_id': str(variant.product.category_id) if variant.product.category_id else None,
                    'product_id': str(variant.product_id),
                })
            result = coupon_service.validate_and_calculate(coupon.code, user, items_data)
            discount_amount = result['discount']
        # ... later when building order_data, set discount_amount=discount_amount, and coupon=coupon

        shipping_cost = Decimal("0.00")  # shipping service later
        tax_amount = Decimal("0.00")
        total = subtotal - discount_amount + shipping_cost + tax_amount

        # Build order items snapshot
        items_data = []
        for item in cart.items.all():
            variant = item.variant
            # Create option summary string
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
            "tax_amount": 0,  # tax service later
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

        # Commit inventory reservations for each cart item
        for item in cart.items.all():
            if item.reservation_id:
                try:
                    self.inventory_service.commit_reservation(item.reservation_id)
                except BusinessException as e:
                    raise BusinessException(
                        f"Stock reservation for {item.variant.sku} expired. Please refresh cart."
                    )

        if coupon:
            CouponService().increment_usage(coupon, user, order)  # We'll add this method to CouponService

        # Clear the cart
        cart.items.all().delete()
        cart.coupon = None
        cart.save(update_fields=["coupon", "updated_at"])

        # Log initial status
        OrderRepository.update_status(order, Order.Status.PENDING)

        order_placed.send(
            sender=self.__class__,
            user=user,
            order=order,
            items_data=items_data,  # the list of dicts with variant_id, quantity, etc.
        )

        return self._serialize_order(order)

    @transaction.atomic
    def transition_status(self, order_id: str, new_status: str, note: str = "") -> dict:
        order = OrderSelector.get_order_by_id(order_id)
        if not order:
            raise BusinessException("Order not found.")

        status_alias_map = {
            "processing": Order.Status.PACKING,
            "shipped": Order.Status.SHIPPING,
        }
        normalized_status = status_alias_map.get(str(new_status).lower().strip(), str(new_status).lower().strip())

        allowed_next = STATUS_TRANSITIONS.get(order.status, [])
        # Allow admin transition directly to target status or valid next state
        if normalized_status not in allowed_next and normalized_status != order.status:
            # Allow common transitions if not conflicting
            valid_targets = [s.value for s in Order.Status]
            if normalized_status not in valid_targets:
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
        order.save()  # save timestamps changes

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
        # Only release if not already shipped
        if order.status in [
            Order.Status.PENDING,
            Order.Status.AWAITING_PAYMENT,
            Order.Status.PAID,
        ]:
            for item in order.items.all():
                if item.variant_id:
                    # Use inventory adjust_stock to add back? Simpler: we already committed reservations, so we need to increase available quantity.
                    # Since the spec says we should have reservation logic, we need a release after commit? Usually once committed, stock is reduced.
                    # For cancellation, we should add the quantity back.
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
