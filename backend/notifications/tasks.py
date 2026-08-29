import logging
import smtplib
import socket

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.db.utils import OperationalError

logger = logging.getLogger(__name__)


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
            # proceed to send anyway; update step will handle

    # Send email outside DB transaction to avoid holding lock during SMTP (500-3000ms)
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
    logger.info("send_notification_email sent to %s notification_id=%s", email, notification_id)

    # Mark as sent atomically after successful send
    if notification_id:
        try:
            from .models import Notification

            with transaction.atomic():
                notification = Notification.objects.select_for_update().get(id=notification_id)
                # Double-check after acquiring lock (another worker may have marked it)
                if notification.context_json and notification.context_json.get("email_sent"):
                    logger.info("send_notification_email: race, already marked sent for %s", notification_id)
                    return
                notification.context_json = {
                    **(notification.context_json or {}),
                    "email_sent": True,
                }
                notification.save(update_fields=["context_json", "updated_at"])
        except Exception as e:
            # Notification.DoesNotExist or DB error - log and re-raise for transient retry
            # But DoesNotExist should not retry (narrow autoretry excludes it, will not retry)
            logger.exception("Failed to mark notification %s as sent: %s", notification_id, e)
            # Only re-raise if it's a transient error that autoretry handles
            if isinstance(e, (OperationalError, ConnectionError, TimeoutError, smtplib.SMTPException, socket.error)):
                raise
            # For DoesNotExist / other business errors, don't retry (return)
            return
