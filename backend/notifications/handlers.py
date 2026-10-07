import logging

from django.conf import settings

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
    from .constants import get_persian_status
    service = NotificationService()
    user = order.user
    type = 'order_status_change'
    new_status_fa = get_persian_status(new_status)
    old_status_fa = get_persian_status(old_status)
    context = {
        'order_number': order.order_number,
        'old_status': old_status,
        'new_status': new_status,
        'old_status_fa': old_status_fa,
        'new_status_fa': new_status_fa,
        'user_name': _display_name(user),
        'phone_number': getattr(user, "phone_number", ""),
        'frontend_url': settings.FRONTEND_URL,
    }
    service.send_notification(user, type, context, send_sms_flag=True)


def order_placed_handler(sender, user, order, items_data, **kwargs):
    """In-app + SMS order confirmation with invoice link (no email)."""
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
    result = service.send_notification(user, "order_confirmation", context, send_sms_flag=True)
    logger.info("order_placed_handler sent order_confirmation %s for order %s", result, order.order_number)
