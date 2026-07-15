from celery import shared_task
from .services import InventoryService


@shared_task
def expire_reservations_task():
    service = InventoryService()
    service.expire_reservations()
