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
    Order.Status.PENDING: [Order.Status.AWAITING_PAYMENT, Order.Status.PAID, Order.Status.CANCELLED],
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

    @staticmethod
    def _snapshot_from_address(address) -> dict:
        """Build the legacy-shaped address snapshot from an address-book row."""
        return {
            "full_name": address.recipient_name,
            "phone": address.recipient_phone,
            "province": address.province_name,
            "province_id": address.province_id,
            "city": address.city_name,
            "city_id": address.city_id,
            "address": address.street,
            "building_no": address.building_no,
            "postal_code": address.postal_code,
        }

    @transaction.atomic
    def create_order_from_cart(
        self, user, shipping_address: dict = None, billing_address: dict = None,
        session_key: str = None, address_id: str = None,
        shipping_method: str = "pishtaz",
    ) -> dict:
        is_pickup = shipping_method == "pickup"
        address = None
        if is_pickup:
            # In-person store pickup: no customer address needed; zero shipping fee
            cust_name = f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip() or "مشتری گرامی"
            shipping_address = {
                "type": "pickup",
                "title": "تحویل حضوری در فروشگاه",
                "full_name": cust_name,
                "phone": getattr(user, "phone_number", "") or "",
                "province": "زنجان",
                "city": "قیدار",
                "address": "زنجان - قیدار - خیابان امام - روبروی تالار صدف - پوشاک ماوی",
                "postal_code": "",
            }
            billing_address = billing_address or dict(shipping_address)
        else:
            if address_id:
                from users.selectors import UserSelector as _US

                address = _US.get_address_by_id(user, address_id)
                if not address:
                    raise BusinessException(
                        "Address not found in your address book.", code="address_not_found"
                    )
                shipping_address = self._snapshot_from_address(address)
                billing_address = billing_address or dict(shipping_address)
            if not shipping_address:
                raise BusinessException(
                    "address_id or shipping_address is required.", code="address_required"
                )
        # H5/H8: lock cart row to prevent duplicate order creation
        cart = Cart.objects.select_for_update().filter(user=user).first()
        
        # If user cart is empty or missing, check if guest cart with session_key exists and merge it
        if (not cart or not cart.items.exists()) and session_key:
            from cart.services import CartService
            cart_service = CartService()
            try:
                cart_service.merge_carts(user, str(session_key))
                cart = Cart.objects.select_for_update().filter(user=user).first()
            except Exception:
                pass

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
            try:
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
            except BusinessException:
                # If attached coupon is expired or invalid, gracefully drop it
                cart.coupon = None
                cart.save(update_fields=['coupon', 'updated_at'])
                coupon = None
                discount_amount = Decimal('0.00')

        # Server-side shipping: never trust client totals. Priced from the
        # destination province + weighed cart via the Post tariff engine.
        from shipping import services as shipping_services

        if is_pickup:
            ship_quote = {
                "method": "pickup",
                "name": "تحویل به صورت حضوری",
                "name_en": "Store Pickup",
                "eta_days": 0,
                "zone": "store",
                "base_fare": 0,
                "surcharge": 0,
                "surcharge_percent": 0,
                "insurance": 0,
                "total": 0,
                "currency": "Toman",
            }
            shipping_cost = Decimal("0.00")
        else:
            ship_quote = shipping_services.quote(
                province_name=(shipping_address or {}).get("province"),
                weight_grams=sum(
                    int(getattr(item.variant, "weight", 0) or 0) * int(item.quantity)
                    for item in cart_items
                ),
                subtotal_tomans=subtotal,
                method_code=shipping_method or "pishtaz",
            )["selected"]
            shipping_cost = Decimal(str(ship_quote["total"]))
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
            main_image = None
            if product.metadata and isinstance(product.metadata, dict):
                main_image = product.metadata.get("image_url") or product.metadata.get("imageUrl") or product.metadata.get("image")
            if not main_image:
                try:
                    img_data = MediaSelector.get_main_image_for_product(product)
                    if img_data and isinstance(img_data, dict) and img_data.get("url"):
                        main_image = img_data.get("url")
                    if not main_image:
                        media = MediaSelector.get_media_for_object(product)
                        if media:
                            main_image = media[0].file.url
                except Exception:
                    pass

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
            "address": address,
            "shipping_method": ship_quote["method"],
            "shipping_detail": ship_quote,
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

        # Buyer got the item: drop their back-in-stock alerts for it.
        try:
            from notifications.models import BackInStockAlert

            BackInStockAlert.objects.filter(
                user=user,
                variant_id__in=[i["variant_id"] for i in items_data],
                deleted_at__isnull=True,
            ).update(deleted_at=timezone.now(), updated_at=timezone.now())
        except Exception:
            pass

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
            import uuid
            is_uuid = False
            try:
                uuid.UUID(str(order_id))
                is_uuid = True
            except Exception:
                pass

            if is_uuid:
                order = Order.objects.select_for_update().get(id=order_id)
            else:
                order = Order.objects.select_for_update().get(order_number=order_id)
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

    def serialize_order(self, order: Order) -> dict:
        """Public wrapper used by POS (and anything else outside this service)."""
        return self._serialize_order(order)

    def get_user_orders(self, user) -> list[dict]:
        orders = OrderSelector.get_user_orders(user)
        return [self._serialize_order(order) for order in orders]

    def get_order_by_number(self, order_number: str, user=None) -> dict:
        order = OrderSelector.get_order_by_id(order_number) or OrderSelector.get_order_by_number(order_number)
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
            snap = dict(item.product_snapshot) if isinstance(item.product_snapshot, dict) else {}
            if not snap.get("image") or not snap.get("title"):
                product = None
                if item.variant and item.variant.product:
                    product = item.variant.product
                elif item.product_id:
                    from products.models import Product
                    product = Product.objects.filter(id=item.product_id).first()

                if product:
                    if not snap.get("title"):
                        snap["title"] = product.title
                    if not snap.get("image"):
                        img = ""
                        if product.metadata and isinstance(product.metadata, dict):
                            img = product.metadata.get("image_url") or product.metadata.get("imageUrl") or product.metadata.get("image") or ""
                        if not img:
                            try:
                                from media_libm.selectors import MediaSelector
                                m = MediaSelector.get_main_image_for_product(product)
                                if m and isinstance(m, dict) and m.get("url"):
                                    img = m["url"]
                                if not img:
                                    media = MediaSelector.get_media_for_object(product)
                                    if media:
                                        img = media[0].file.url
                            except Exception:
                                pass
                        snap["image"] = img

            items.append(
                {
                    "id": str(item.id),
                    "product_snapshot": snap,
                    "quantity": item.quantity,
                    "price": int(round(float(item.price_snapshot))) if item.price_snapshot is not None else 0,
                    "line_total": int(round(float(item.line_total))) if item.line_total is not None else 0,
                }
            )

        payments_data = []
        try:
            for p in order.payments.all().order_by("-created_at"):
                payments_data.append(
                    {
                        "id": str(p.id),
                        "amount": int(round(float(p.amount))) if p.amount is not None else 0,
                        "gateway": p.gateway,
                        "status": p.status,
                        "gateway_reference": p.gateway_reference,
                        "authority": p.authority,
                        "created_at": p.created_at.isoformat() if p.created_at else None,
                    }
                )
        except Exception:
            payments_data = []

        successful_payment = next((p for p in payments_data if p["status"] == "succeeded"), None)
        active_payment = successful_payment or (payments_data[0] if payments_data else None)

        payment_info = None
        if active_payment:
            gw = active_payment["gateway"]
            gw_display = "زرین‌پال" if gw == "zarinpal" else gw
            payment_info = {
                "id": active_payment["id"],
                "status": active_payment["status"],
                "gateway": active_payment["gateway"],
                "gateway_name": gw_display,
                "tracking_code": active_payment["gateway_reference"] or "",
                "amount": active_payment["amount"],
                "authority": active_payment["authority"] or "",
                "paid_at": active_payment["created_at"],
            }

        user_full_name = ""
        user_phone = ""
        user_email = ""
        user_id_str = None
        if order.user:
            user_id_str = str(order.user.id)
            user_full_name = f"{getattr(order.user, 'first_name', '')} {getattr(order.user, 'last_name', '')}".strip()
            user_phone = getattr(order.user, "phone_number", "") or ""
            user_email = getattr(order.user, "email", "") or ""
        # Counter sales may carry a phone typed by the cashier, no account.
        user_phone = getattr(order, "customer_phone", "") or user_phone

        is_pos = getattr(order, "channel", "online") == "pos"
        anonymous_name = "مشتری حضوری" if is_pos else "کاربر سایت"
        customer_info = {
            "id": user_id_str,
            "first_name": getattr(order.user, "first_name", "") if order.user else "",
            "last_name": getattr(order.user, "last_name", "") if order.user else "",
            "full_name": user_full_name or anonymous_name,
            "phone": user_phone,
            "email": user_email,
        }

        # Enrich shipping_address if it's missing recipient details
        shipping_addr = dict(order.shipping_address) if isinstance(order.shipping_address, dict) else {}
        if not shipping_addr.get("full_name") and user_full_name:
            shipping_addr["full_name"] = user_full_name
        if not shipping_addr.get("phone") and user_phone:
            shipping_addr["phone"] = user_phone

        # Fallback to order.address or user default address if street/address missing
        if not shipping_addr.get("address"):
            linked_addr = order.address
            if not linked_addr and order.user:
                try:
                    linked_addr = order.user.addresses.filter(is_default=True).first() or order.user.addresses.first()
                except Exception:
                    linked_addr = None
            if linked_addr:
                if not shipping_addr.get("full_name"):
                    shipping_addr["full_name"] = linked_addr.recipient_name or user_full_name
                if not shipping_addr.get("phone"):
                    shipping_addr["phone"] = linked_addr.recipient_phone or user_phone
                shipping_addr.setdefault("province", linked_addr.province_name)
                shipping_addr.setdefault("city", linked_addr.city_name)
                shipping_addr.setdefault("address", f"{linked_addr.street} {linked_addr.building_no}".strip())
                shipping_addr.setdefault("postal_code", linked_addr.postal_code)

        customer_display_name = (
            shipping_addr.get("full_name") or user_full_name or anonymous_name
        )
        customer_display_phone = shipping_addr.get("phone") or user_phone

        return {
            "id": str(order.id),
            "order_number": order.order_number,
            "status": order.status,
            "channel": getattr(order, "channel", "online"),
            "pos_terminal": getattr(order, "pos_terminal", ""),
            "client_reference": getattr(order, "client_reference", None),
            "cashier": (
                {
                    "id": str(order.cashier_id),
                    "name": (
                        f"{getattr(order.cashier, 'first_name', '')} "
                        f"{getattr(order.cashier, 'last_name', '')}"
                    ).strip()
                    or getattr(order.cashier, "phone_number", ""),
                }
                if order.cashier_id and order.cashier
                else None
            ),
            "subtotal": int(round(float(order.subtotal))) if order.subtotal is not None else 0,
            "discount_amount": int(round(float(order.discount_amount))) if order.discount_amount is not None else 0,
            "tax_amount": int(round(float(order.tax_amount))) if order.tax_amount is not None else 0,
            "shipping_cost": int(round(float(order.shipping_cost))) if order.shipping_cost is not None else 0,
            "total": int(round(float(order.total))) if order.total is not None else 0,
            "shipping_address": shipping_addr,
            "billing_address": order.billing_address or shipping_addr,
            "customer": customer_info,
            "customer_name": customer_display_name,
            "customer_phone": customer_display_phone,
            "address_id": str(order.address_id) if order.address_id else None,
            "shipping_method": order.shipping_method,
            "shipping_detail": order.shipping_detail,
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
            "payments": payments_data,
            "payment_info": payment_info,
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
