import logging

from celery import shared_task
from django.conf import settings
from django.db import transaction
from django.db.utils import OperationalError

logger = logging.getLogger(__name__)


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
def send_template_sms(self, phone_number: str, template_id: int, parameters: list):
    """
    Async sms.ir templated send (send/verify endpoint) for any approved
    workspace template, e.g. purchase-confirmation 321934 / owner 551115.
    parameters: list of {"name": ..., "value": ...} dicts. Silent no-op when
    SMS_ENABLED is False (dev with no API key)."""
    if not phone_number:
        logger.warning("send_template_sms: missing phone_number, skipping")
        return
    if not template_id:
        logger.warning("send_template_sms: missing template_id, skipping")
        return
    params = [
        {"name": str(p.get("name", "")), "value": str(p.get("value", ""))}
        for p in (parameters or [])
    ]
    if not params:
        logger.warning("send_template_sms: empty parameters, skipping")
        return

    if not settings.SMS_ENABLED or not settings.SMS_IR_API_KEY:
        logger.info(
            "SMS_ENABLED=False - mock templated SMS to %s template %s params=%s",
            phone_number, template_id, params,
        )
        return

    try:
        from .sms_ir import send_verify

        response = send_verify(phone_number, template_id, params)
        logger.info(
            "templated SMS sent to %s (template %s) response=%s",
            phone_number, template_id, response,
        )
    except Exception as e:
        logger.exception("templated SMS failed to %s (template %s): %s", phone_number, template_id, e)
        if isinstance(e, (ConnectionError, TimeoutError, OperationalError)):
            raise self.retry(exc=e)
        sms_like = "sms.ir" in str(e).lower()
        if sms_like:
            raise self.retry(exc=e)
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
    Async SMS dispatch via sms.ir bulk. Uses SMS_ENABLED flag; in dev (no API key) logs only.
    """
    if not phone_number:
        logger.warning("send_sms: missing phone_number, skipping")
        return
    message = (message or "").strip()[:500]
    if not message:
        logger.warning("send_sms: empty message, skipping")
        return

    if notification_id:
        try:
            from .models import Notification

            existing = Notification.objects.filter(id=notification_id).first()
            if existing and existing.context_json and existing.context_json.get("sms_sent"):
                logger.info("send_sms: already sent for %s, skipping", notification_id)
                return
        except Exception as e:
            logger.exception("send_sms idempotency check failed: %s", e)

    if not settings.SMS_ENABLED or not settings.SMS_IR_API_KEY:
        logger.info("SMS_ENABLED=False - mock SMS to %s: %s", phone_number, message)
    else:
        try:
            from .sms_ir import send_bulk

            response = send_bulk(settings.SMS_IR_LINE_NUMBER, message, [phone_number])
            logger.info("SMS sent to %s via sms.ir response=%s", phone_number, response)
        except Exception as e:
            logger.exception("SMS send failed to %s: %s", phone_number, e)
            if isinstance(e, (ConnectionError, TimeoutError, OperationalError)):
                raise self.retry(exc=e)
            if "sms.ir" in str(e).lower() or "verify failed" in str(e) or "bulk failed" in str(e):
                if "115" in str(e) or "blacklist" in str(e).lower():
                    return
                raise self.retry(exc=e)
            return

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


@shared_task(
    bind=True,
    acks_late=True,
    time_limit=120,
    soft_time_limit=90,
    autoretry_for=(OperationalError, ConnectionError, TimeoutError),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=2,
)
def notify_stock_alerts(self, variant_id: str):
    """Fire 'back in stock' alerts for one variant (called on 0 -> sellable
    transitions). Re-checks availability at run time under an inventory
    row-lock (serializes concurrent restocks); per-alert rows are locked
    and an alert notified within the last 10 minutes is skipped, so a
    burst of admin clicks yields one SMS, while a genuinely later
    restock notifies again. Always safe to re-run."""
    from datetime import timedelta
    from django.utils import timezone
    from django.db import transaction as _tx
    from inventory.models import Inventory
    from .models import BackInStockAlert
    from .repositories import NotificationRepository

    try:
        from variants.models import Variant

        with _tx.atomic():
            try:
                inv = Inventory.objects.select_for_update().get(
                    variant_id=variant_id, variant__deleted_at__isnull=True
                )
            except Inventory.DoesNotExist:
                return
            sellable = (inv.available_quantity or 0) - (inv.reserved_quantity or 0)
            if sellable <= 0:
                return  # sold out again before the task ran
            variant = inv.variant
            product = (
                variant.product
                if variant.product and variant.product.deleted_at is None
                else None
            )
            if product is None or product.status != "published":
                return
            option_summary = ", ".join(
                f"{vo.option.name}: {vo.option_value.value}"
                for vo in variant.variantoption_set.select_related("option", "option_value").all()
            )
            subject = f"{product.title} دوباره موجود شد"
            body = (
                f"{product.title} ({option_summary}) هم‌اکنون موجود است. "
                f"موجودی محدود است — زودتر سفارش دهید: /products/{product.slug}"
            )
            window_start = timezone.now() - timedelta(minutes=10)
            locked = list(
                BackInStockAlert.objects.select_for_update()
                .filter(variant=variant, deleted_at__isnull=True)
                .select_related("user")
            )
            for alert in locked:
                user = alert.user
                if not user or not user.is_active or not user.phone_number:
                    continue
                if alert.last_notified_at and alert.last_notified_at >= window_start:
                    continue
                notification = NotificationRepository.create_notification(
                    user=user,
                    type="back_in_stock",
                    subject=subject,
                    body=body,
                    context={"variant_id": str(variant.id), "sku": variant.sku},
                )
                send_sms.delay(user.phone_number, body, str(notification.id))
                alert.last_notified_at = timezone.now()
                alert.save(update_fields=["last_notified_at", "updated_at"])
    except Exception as exc:
        logger.exception("notify_stock_alerts failed for %s: %s", variant_id, exc)


@shared_task(
    bind=True,
    acks_late=True,
    time_limit=120,
    soft_time_limit=90,
    autoretry_for=(OperationalError, ConnectionError, TimeoutError),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=2,
)
def cleanup_stale_stock_alerts(self):
    """Soft-delete stock alerts older than 90 days (stale numbers, bounded SMS)."""
    from datetime import timedelta
    from django.utils import timezone
    from .models import BackInStockAlert

    cutoff = timezone.now() - timedelta(days=90)
    stale = BackInStockAlert.objects.filter(created_at__lt=cutoff, deleted_at__isnull=True)
    count = stale.count()
    if count:
        stale.update(deleted_at=timezone.now(), updated_at=timezone.now())
    logger.info("cleanup_stale_stock_alerts: retired %d alerts", count)
    return {"retired_count": count}


def _otp_template_for(purpose) -> str:
    """Owner-provided workspace templates per OTP purpose; unmapped
    purposes fall back to the generic SMS_IR_OTP_TEMPLATE_ID."""
    from django.conf import settings as dj_settings

    purpose = (purpose or "").strip().lower()
    if purpose == "signup":
        return dj_settings.SMS_IR_TEMPLATE_SIGNUP
    if purpose == "reset":
        return dj_settings.SMS_IR_TEMPLATE_RESET
    if purpose == "login":
        # Only consumed internally (profile phone-change); the public
        # OTP-login endpoint is blocked. Shares the signup template by
        # owner decision.
        return dj_settings.SMS_IR_TEMPLATE_SIGNUP
    return dj_settings.SMS_IR_OTP_TEMPLATE_ID


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
def send_otp_sms(self, phone_number: str, code: str, purpose: str = "login"):
    """OTP via sms.ir verify with the purpose-matched workspace template
    (signup 875605 / reset 120372). Mocked when no API key is present."""
    from django.conf import settings as dj_settings

    code = str(code).strip()
    template_id = _otp_template_for(purpose)
    if not phone_number or not code:
        logger.warning("send_otp_sms: missing phone/code, skipping")
        return
    if not dj_settings.SMS_ENABLED or not dj_settings.SMS_IR_API_KEY:
        logger.info(
            "Mock OTP to %s: %s (purpose=%s, template=%s)",
            phone_number, code, purpose, template_id,
        )
        return
    try:
        from .sms_ir import send_verify

        resp = send_verify(
            phone_number,
            template_id,
            [{"name": dj_settings.SMS_IR_OTP_PARAM, "value": code}],
        )
        logger.info(
            "OTP sent to %s via sms.ir (purpose=%s template=%s) %s",
            phone_number, purpose, template_id, resp,
        )
    except Exception as e:
        logger.exception("OTP send failed to %s: %s", phone_number, e)
        raise self.retry(exc=e)
