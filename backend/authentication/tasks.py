import logging
from datetime import timedelta

from celery import shared_task
from django.db import transaction
from django.db.models import Q
from django.db.utils import OperationalError
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(
    name="authentication.tasks.cleanup_expired_otps",
    bind=True,
    acks_late=True,
    time_limit=120,
    soft_time_limit=90,
    autoretry_for=(OperationalError, ConnectionError, TimeoutError),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=2,
)
def cleanup_expired_otps() -> dict:
    """Beat daily: purge used OtpCode >24h and all >48h."""
    cutoff_48 = timezone.now() - timedelta(hours=48)
    cutoff_24 = timezone.now() - timedelta(hours=24)
    from .models import OtpCode

    with transaction.atomic():
        deleted, _ = OtpCode.objects.filter(
            Q(created_at__lt=cutoff_48) | Q(is_used=True, created_at__lt=cutoff_24)
        ).delete()
    logger.info("cleanup_expired_otps deleted=%s", deleted)
    return {"deleted_otps": deleted, "cutoff": cutoff_48.isoformat()}
