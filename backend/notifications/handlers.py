import logging

from django.conf import settings
from django.db import transaction

from .services import NotificationService

logger = logging.getLogger(__name__)


def _display_name(user) -> str:
    name = f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()
    if name:
        return name
    phone = getattr(user, "phone_number", "")
    if phone and len(phone) >= 4:
        return f"کاربر {phone[-4:]}"
    return "مشتری عزیز"


def order_status_changed_handler(sender, order, old_status, new_status, **kwargs):
    """SMS hooks on the PAID transition (encrypted-connection payment flow):

    - Customer: purchase-confirmation template 321934 (#ORDERID#, #TRACKING#,
      #URL#) â€” TRACKING is the Zarinpal payment-tracking code (ref_id).
    - Owner: new-order template 551115 (#ORDERID#, #AMOUNT# as "<total> طھظˆظ…ط§ظ†")
      to ORDER_OWNER_PHONE.
    Both are skipped when the order never went through the payment gateway
    (zero-total / admin-jumped orders) and fired exactly once (PAID is a
    one-time transition). In-app + preference gating are untouched."""
    from orders.models import Order

    if new_status != Order.Status.PAID or old_status == Order.Status.PAID:
        return

    from payments.models import Payment
    from .tasks import send_template_sms

    paid = (
        Payment.objects.filter(order_id=order.id, status=Payment.Status.SUCCEEDED)
        .select_related("user")
        .order_by("-created_at")
        .first()
    )
    if not paid:
        logger.info("order_status_changed_handler: no successful payment for %s - SMS skipped",
                    order.order_number)
        return

    

    tracking = paid.gateway_reference or order.order_number
    frontend_url = settings.FRONTEND_URL

    customer_phone = getattr(order.user, "phone_number", "")
    customer_params = [
        {"name": "ORDERID", "value": order.order_number},
        {"name": "TRACKING", "value": tracking},
        {"name": "URL", "value": f"{frontend_url}/orders/{order.order_number}"},
    ]
    sms_updates_pref = True
    try:
        from .repositories import PreferenceRepository

        sms_updates_pref = PreferenceRepository.get_or_create_preferences(
            order.user
        ).sms_order_updates
    except Exception:
        pass
    if customer_phone and sms_updates_pref:
        transaction.on_commit(
            lambda: send_template_sms.delay(
                customer_phone,
                settings.SMS_IR_TEMPLATE_ORDER_CONFIRMED,
                customer_params,
            )
        )
    elif customer_phone:
        logger.info("order_status_changed_handler: customer %s opted out of order SMS",
                    order.user_id)
    else:
        logger.warning("order_status_changed_handler: customer %s has no phone - SMS skipped",
                       order.user_id)

    owner_phone = getattr(settings, "ORDER_OWNER_PHONE", "")
    owner_params = [
        {"name": "ORDERID", "value": order.order_number},
        {"name": "AMOUNT", "value": f"{int(order.total)} تومان"},
    ]
    if owner_phone:
        transaction.on_commit(
            lambda: send_template_sms.delay(
                owner_phone,
                settings.SMS_IR_TEMPLATE_OWNER_NEW_ORDER,
                owner_params,
            )
        )


def order_placed_handler(sender, user, order, items_data, **kwargs):
    """In-app order confirmation at checkout (no SMS, no email).

    SMS moved to the PAID transition (order_status_changed_handler), which
    uses the owner-approved sms.ir template 321934."""
    service = NotificationService()
    normalized_items = []
    for item in (items_data or []):
        snapshot = item.get("product_snapshot", {}) or {}
        normalized_items.append(
            {
                "title": snapshot.get("title") or item.get("title") or "Item",
                "sku": snapshot.get("sku") or item.get("sku") or "",
                "quantity": item.get("quantity"),
                "price_snapshot": str(item.get("price_snapshot", "")),
                "line_total": str(item.get("line_total", "")),
                "product_snapshot": snapshot,
            }
        )

    invoice_url = f"{settings.FRONTEND_URL}/orders/{order.order_number}"
    context = {
        "order_number": order.order_number,
        "user_name": _display_name(user),
        "phone_number": getattr(user, "phone_number", ""),
        "frontend_url": settings.FRONTEND_URL,
        "invoice_url": invoice_url,
        "items": normalized_items,
        "subtotal": str(order.subtotal),
        "discount_amount": str(order.discount_amount),
        "tax_amount": str(order.tax_amount),
        "shipping_cost": str(order.shipping_cost),
        "total": str(order.total),
        "shipping_address": order.shipping_address,
        "billing_address": order.billing_address,
        "placed_at": order.placed_at.isoformat() if order.placed_at else "",
        "status": order.status,
        "preheader": f"Order {order.order_number} confirmed - {order.total}",
    }
    result = service.send_notification(user, "order_confirmation", context, send_sms_flag=False)
    logger.info("order_placed_handler sent order_confirmation (in-app only) %s for order %s", result, order.order_number)
