import logging
from celery import shared_task
from django.db.utils import OperationalError

from .services import InventoryService

logger = logging.getLogger(__name__)


@shared_task(
    name="inventory.tasks.expire_reservations_task",
    bind=True,
    acks_late=True,
    time_limit=300,
    soft_time_limit=240,
    autoretry_for=(OperationalError, ConnectionError, TimeoutError),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=3,
)
def expire_reservations_task(self) -> dict:
    """
    Celery Beat periodic task — runs every 5 minutes via crontab(minute="*/5").
    Delegates to InventoryService.expire_reservations() which:
      1. Finds ACTIVE reservations with expires_at < now()
      2. Decrements Inventory.reserved_quantity (SELECT FOR UPDATE)
      3. Bulk-updates reservations to EXPIRED

    Returns {"expired_count": int, "inventories_updated": int} for monitoring.
    Retry only on transient DB/network errors, not BusinessException.
    """
    logger.info("expire_reservations_task started")
    service = InventoryService()
    result = service.expire_reservations()
    logger.info("expire_reservations_task finished: %s", result)
    return result


@shared_task(
    name="inventory.tasks.release_expired_reservations",
    bind=True,
    acks_late=True,
    time_limit=300,
    soft_time_limit=240,
    autoretry_for=(OperationalError, ConnectionError, TimeoutError),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=3,
)
def release_expired_reservations(self) -> dict:
    """Alias for expire_reservations_task — kept for spec compatibility. Directly calls service (not other task) to keep retry/timeout semantics."""
    logger.info("release_expired_reservations (alias) started")
    service = InventoryService()
    result = service.expire_reservations()
    logger.info("release_expired_reservations finished: %s", result)
    return result
