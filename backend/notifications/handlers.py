import logging

from django.conf import settings
from django.db import transaction

from .services import NotificationService

logger = logging.getLogger(__name__)


def order_status_changed_handler(sender, order, old_status, new_status, **kwargs):
    service = NotificationService()
    user = order.user
    type = 'order_status_change'
    context = {
        'order_number': order.order_number,
        'old_status': old_status,
        'new_status': new_status,
        'user_name': user.first_name or user.email.split("@")[0],
        'email': user.email,
        'frontend_url': settings.FRONTEND_URL,
    }
    service.send_notification(user, type, context, send_email=True)


def order_placed_handler(sender, user, order, items_data, **kwargs):
    """
    Sends order confirmation email (HTML invoice) + optional SMS with invoice link.
    Wired to analytics.signals.order_placed (dispatched in orders/services.py:157).
    Uses NotificationService for in-app + email, and send_sms task for SMS.
    """
    service = NotificationService()
    # Build rich context for HTML invoice template email/order_confirmation.html & email/invoice.html
    # items_data from orders/services.py contains product_snapshot, quantity etc.
    # Normalize items for template (title, sku, quantity, price_snapshot, line_total, product_snapshot)
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
    # For SMS short link, frontend may have short invoice path
    context = {
        "order_number": order.order_number,
        "user_name": user.first_name or user.email.split("@")[0],
        "user_email": user.email,
        "email": user.email,
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
    # 1) In-app + Email via NotificationService (creates Notification, dispatches email via Celery)
    result = service.send_notification(user, "order_confirmation", context, send_email=True)
    logger.info("order_placed_handler sent order_confirmation notification %s for order %s", result, order.order_number)

    # 2) Optional SMS: only if user has phone_number and SMS_ENABLED
    phone = getattr(user, "phone_number", None) or getattr(user, "phone", None)
    # Try to get phone from profile if exists
    if not phone:
        # Future: try UserProfile or common User model after phone migration
        try:
            # If User has related profile with phone
            if hasattr(user, "profile") and getattr(user.profile, "phone_number", None):
                phone = user.profile.phone_number
        except Exception:
            pass

    if phone and settings.SMS_ENABLED:
        try:
            from .tasks import send_sms

            sms_message = f"Luxe: Order {order.order_number} confirmed. Total {order.total}. Invoice: {invoice_url}"
            # Ensure message < 160 chars for SMS, keep link short
            if len(sms_message) > 160:
                sms_message = f"Luxe: Order {order.order_number} done. View: {invoice_url}"

            # Use same notification_id for idempotency if created
            nid = result.get("notification_id")
            # Dispatch after commit to ensure order persisted
            def _dispatch_sms():
                send_sms.delay(phone, sms_message, nid)

            # If we're already inside atomic (order creation), defer to on_commit
            try:
                transaction.on_commit(_dispatch_sms)
            except Exception:
                _dispatch_sms()
            logger.info("order_placed_handler queued SMS to %s for order %s", phone, order.order_number)
        except Exception as e:
            logger.exception("Failed to queue SMS for order %s: %s", order.order_number, e)
