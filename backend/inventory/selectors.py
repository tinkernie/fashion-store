from .models import Inventory, Reservation


class InventorySelector:
    @staticmethod
    def get_by_variant_id(variant_id: str) -> Inventory or None:
        return Inventory.objects.filter(variant_id=variant_id).first()

    @staticmethod
    def get_reservation_by_id(reservation_id: str) -> Reservation or None:
        return (
            Reservation.objects.filter(id=reservation_id)
            .select_related("inventory")
            .first()
        )

    @staticmethod
    def get_expired_active_reservations() -> list[Reservation]:
        from django.utils import timezone

        return Reservation.objects.filter(
            status=Reservation.Status.ACTIVE,
            expires_at__lt=timezone.now(),
        ).select_related("inventory")
