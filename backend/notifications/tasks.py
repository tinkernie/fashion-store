import logging
import smtplib
import socket

from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.db.utils import OperationalError
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def _sanitize_subject(subject: str) -> str:
    return subject.replace("\n", " ").replace("\r", " ").strip()[:300]


@shared_task(
    bind=True,
    acks_late=True,
    time_limit=60,
    soft_time_limit=45,
    autoretry_for=(smtplib.SMTPException, socket.error, ConnectionError, TimeoutError, OperationalError),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=3,
)
def send_notification_email(self, email, subject, body, notification_id):
    # Early exit for missing email - not retryable
    if not email:
        logger.warning("send_notification_email: missing email, skipping")
        return

    # Sanitize subject to prevent header injection
    subject = _sanitize_subject(subject or "")

    # Idempotency check before sending: avoid duplicate email if already marked sent
    if notification_id:
        try:
            from .models import Notification

            existing = Notification.objects.filter(id=notification_id).first()
            if existing and existing.context_json and existing.context_json.get("email_sent"):
                logger.info("send_notification_email: already sent for %s, skipping", notification_id)
                return
        except Exception as e:
            logger.exception("Idempotency check failed for %s: %s", notification_id, e)

    # Build HTML alternative: wrap plain body in branded base if no specific template
    # Try to infer html template from subject/body context if notification available
    html_body = None
    try:
        # If notification has context, try to render type-specific html template
        if notification_id:
            from .models import Notification

            notif = Notification.objects.filter(id=notification_id).first()
            if notif and notif.type:
                try:
                    type_template_map = {
                        "order_confirmation": "email/order_confirmation.html",
                        "order_status_change": "email/order_status_change.html",
                        "shipping_update": "email/shipping_update.html",
                        "welcome": "email/welcome.html",
                        "generic": None,
                    }
                    tmpl = type_template_map.get(notif.type)
                    if tmpl:
                        # context_json holds original context dict passed to service
                        ctx = notif.context_json or {}
                        ctx.setdefault("frontend_url", settings.FRONTEND_URL)
                        ctx.setdefault("email", email)
                        ctx.setdefault("subject", subject)
                        # Map body fields for invoice compatibility
                        if notif.type == "order_confirmation" and "order_number" in ctx:
                            # Ensure invoice fields available
                            pass
                        html_body = render_to_string(tmpl, ctx)
                except Exception as e:
                    logger.debug("Type-specific HTML template render failed: %s", e)
    except Exception:
        pass

    # Fallback HTML: simple branded wrapper with body line-breaks
    if not html_body:
        # Escape body and wrap
        escaped_body = body.replace("\n", "<br>") if body else subject
        html_body = f"""<!DOCTYPE html><html><body style="font-family:Arial,sans-serif; color:#333; line-height:22px; max-width:600px; margin:0 auto; padding:24px; border:1px solid #eeeeee;"><div style="background:#111;color:#fff;padding:16px;text-align:center;font-weight:bold;letter-spacing:2px;">LUXE</div><div style="padding:24px;">{escaped_body}</div><div style="font-size:11px;color:#888;text-align:center;padding:16px;border-top:1px solid #eee;">&copy; Luxe Fashion Store</div></body></html>"""

    text_body = body or strip_tags(html_body)
    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[email],
    )
    msg.attach_alternative(html_body, "text/html")
    msg.send(fail_silently=False)
    logger.info("send_notification_email sent to %s notification_id=%s subject=%s", email, notification_id, subject)

    # Mark as sent atomically after successful send
    if notification_id:
        try:
            from .models import Notification

            with transaction.atomic():
                notification = Notification.objects.select_for_update().get(id=notification_id)
                if notification.context_json and notification.context_json.get("email_sent"):
                    logger.info("send_notification_email: race, already marked sent for %s", notification_id)
                    return
                notification.context_json = {
                    **(notification.context_json or {}),
                    "email_sent": True,
                }
                notification.save(update_fields=["context_json", "updated_at"])
        except Exception as e:
            logger.exception("Failed to mark notification %s as sent: %s", notification_id, e)
            if isinstance(e, (OperationalError, ConnectionError, TimeoutError, smtplib.SMTPException, socket.error)):
                raise
            return


@shared_task(
    bind=True,
    acks_late=True,
    time_limit=30,
    soft_time_limit=20,
    autoretry_for=(ConnectionError, TimeoutError, OperationalError),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=3,
)
def send_sms(self, phone_number: str, message: str, notification_id: str = None):
    """
    Async SMS dispatch via Kavenegar. Uses SMS_ENABLED flag; in dev (no API key) logs only.
    Message should be short (<160 chars) for order notifications with invoice link.
    """
    if not phone_number:
        logger.warning("send_sms: missing phone_number, skipping")
        return
    # Sanitize message: strip extra whitespace, limit length
    message = (message or "").strip()[:500]
    if not message:
        logger.warning("send_sms: empty message, skipping")
        return

    # Idempotency similar to email if notification_id provided
    if notification_id:
        try:
            from .models import Notification

            existing = Notification.objects.filter(id=notification_id).first()
            if existing and existing.context_json and existing.context_json.get("sms_sent"):
                logger.info("send_sms: already sent for %s, skipping", notification_id)
                return
        except Exception as e:
            logger.exception("send_sms idempotency check failed: %s", e)

    if not settings.SMS_ENABLED or not settings.KAVENEGAR_API_KEY:
        logger.info("SMS_ENABLED=False or no KAVENEGAR_API_KEY - mock SMS to %s: %s", phone_number, message)
        # Still mark as sent in dev to avoid retry loops
    else:
        try:
            from kavenegar import KavenegarAPI, APIException, HTTPException  # type: ignore

            api = KavenegarAPI(settings.KAVENEGAR_API_KEY)
            params = {"sender": settings.SMS_SENDER, "receptor": phone_number, "message": message}
            response = api.sms_send(params)
            logger.info("SMS sent to %s via Kavenegar response=%s", phone_number, response)
        except ImportError:
            logger.warning("kavenegar package not installed - mock SMS to %s: %s", phone_number, message)
        except Exception as e:
            # APIException, HTTPException are transient -> retry
            logger.exception("SMS send failed to %s: %s", phone_number, e)
            # Only retry on transient network/API errors
            if "APIException" in type(e).__name__ or "HTTPException" in type(e).__name__ or isinstance(e, (ConnectionError, TimeoutError, OperationalError)):
                raise self.retry(exc=e)
            # For invalid receptor etc., don't retry
            return

    # Mark sms_sent in Notification if applicable
    if notification_id:
        try:
            from .models import Notification

            with transaction.atomic():
                notification = Notification.objects.select_for_update().get(id=notification_id)
                if notification.context_json and notification.context_json.get("sms_sent"):
                    return
                notification.context_json = {
                    **(notification.context_json or {}),
                    "sms_sent": True,
                }
                notification.save(update_fields=["context_json", "updated_at"])
        except Exception as e:
            logger.exception("Failed to mark sms_sent for %s: %s", notification_id, e)
            if isinstance(e, (OperationalError, ConnectionError, TimeoutError)):
                raise
            return
