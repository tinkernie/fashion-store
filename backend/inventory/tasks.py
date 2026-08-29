from celery import shared_task
from .services import InventoryService


@shared_task(
    name="inventory.tasks.expire_reservations_task",
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def expire_reservations_task() -> dict:
    """
    Celery Beat periodic task — runs every 5 minutes via crontab(minute="*/5").
    Delegates to InventoryService.expire_reservations() which:
      1. Finds ACTIVE reservations with expires_at < now()
      2. Decrements Inventory.reserved_quantity (SELECT FOR UPDATE)
      3. Bulk-updates reservations to EXPIRED

    Returns {"expired_count": int, "inventories_updated": int} for monitoring.
    """
    service = InventoryService()
    return service.expire_reservations()


# Alias required by spec: release_expired_reservations
@shared_task(name="inventory.tasks.release_expired_reservations")
def release_expired_reservations() -> dict:
    """Alias for expire_reservations_task — kept for spec compatibility."""
    return expire_reservations_task()
