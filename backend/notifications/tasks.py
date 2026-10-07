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
    time_limit=30,
    soft_time_limit=20,
    autoretry_for=(ConnectionError, TimeoutError, OperationalError),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=3,
)
def send_otp_sms(self, phone_number: str, code: str):
    """OTP via sms.ir verify (template 919633, param Code). Mocked when no key."""
    from django.conf import settings as dj_settings

    code = str(code).strip()
    if not phone_number or not code:
        logger.warning("send_otp_sms: missing phone/code, skipping")
        return
    if not dj_settings.SMS_ENABLED or not dj_settings.SMS_IR_API_KEY:
        logger.info("Mock OTP to %s: %s", phone_number, code)
        return
    try:
        from .sms_ir import send_verify

        resp = send_verify(
            phone_number,
            dj_settings.SMS_IR_OTP_TEMPLATE_ID,
            [{"name": dj_settings.SMS_IR_OTP_PARAM, "value": code}],
        )
        logger.info("OTP sent to %s via sms.ir %s", phone_number, resp)
    except Exception as e:
        logger.exception("OTP send failed to %s: %s", phone_number, e)
        raise self.retry(exc=e)
