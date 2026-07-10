from django.db import transaction, models as db_models
from .models import Inventory, Reservation
from common.exceptions import BusinessException

class InventoryRepository:
    @staticmethod
    def create_inventory(variant_id: str, **fields) -> Inventory:
        return Inventory.objects.create(variant_id=variant_id, **fields)

    @staticmethod
    def get_or_create(variant_id: str) -> Inventory:
        obj, _ = Inventory.objects.get_or_create(variant_id=variant_id)
        return obj

    @staticmethod
    def update_fields(inventory: Inventory, **fields) -> Inventory:
        allowed = {'available_quantity', 'reserved_quantity', 'safety_stock', 'status', 'reservation_expiration_minutes'}
        for key, value in fields.items():
            if key in allowed:
                setattr(inventory, key, value)
        inventory.version += 1
        inventory.save(update_fields=list(fields.keys()) + ['version', 'updated_at'])
        return inventory

    @staticmethod
    def lock_inventory(variant_id: str) -> Inventory:
        """Row lock using select_for_update. Must be called inside a transaction."""
        return Inventory.objects.select_for_update().get(variant_id=variant_id)


class ReservationRepository:
    @staticmethod
    def create_reservation(inventory: Inventory, user_id, quantity: int, expires_at) -> Reservation:
        return Reservation.objects.create(
            inventory=inventory,
            user_id=user_id,
            quantity=quantity,
            expires_at=expires_at,
        )

    @staticmethod
    def get_active_reservations(inventory: Inventory) -> list[Reservation]:
        return inventory.reservations.filter(status=Reservation.Status.ACTIVE)

    @staticmethod
    def update_status(reservation: Reservation, status: str):
        reservation.status = status
        reservation.save(update_fields=['status', 'updated_at'])

    @staticmethod
    def bulk_update_status(ids: list, status: str):
        Reservation.objects.filter(id__in=ids).update(status=status)