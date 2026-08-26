from django.utils import timezone
from django.db import transaction
from common.exceptions import BusinessException
from .models import Inventory, Reservation
from .repositories import InventoryRepository, ReservationRepository
from .selectors import InventorySelector
from django.db import models


class InventoryService:
    @staticmethod
    def _calculate_status(inventory: Inventory):
        sellable = inventory.available_quantity - inventory.reserved_quantity
        if sellable <= 0:
            return Inventory.Status.OUT_OF_STOCK
        elif sellable <= inventory.safety_stock:
            return Inventory.Status.LOW_STOCK
        else:
            return Inventory.Status.IN_STOCK

    @transaction.atomic
    def adjust_stock(self, variant_id: str, delta: int) -> dict:
        """Add or remove available quantity (admin action). Supports variant_id or product_id."""
        from variants.models import Variant
        from inventory.models import Inventory

        # Try to locate the variant
        actual_variant_id = variant_id
        variant = Variant.objects.filter(id=variant_id, deleted_at__isnull=True).first()
        if not variant:
            # Maybe a product_id was passed
            variant = Variant.objects.filter(product_id=variant_id, deleted_at__isnull=True).first()
            if variant:
                actual_variant_id = str(variant.id)
            else:
                # Create a default variant for this product if missing
                from products.models import Product
                import uuid
                prod = Product.objects.filter(id=variant_id, deleted_at__isnull=True).first()
                if prod:
                    variant = Variant.objects.create(
                        product=prod,
                        sku=f"{prod.slug or 'PROD'}-{uuid.uuid4().hex[:6].upper()}",
                        price=100000,
                        weight=500,
                        status=Variant.Status.PUBLISHED,
                        availability=Variant.Availability.IN_STOCK,
                    )
                    actual_variant_id = str(variant.id)
                else:
                    raise BusinessException("Target product or variant not found.")

        inventory = InventoryRepository.lock_inventory(actual_variant_id)
        new_qty = max(0, inventory.available_quantity + delta)
        updated = InventoryRepository.update_fields(
            inventory,
            available_quantity=new_qty,
            status=self._calculate_status(inventory),
        )
        return self._serialize(updated)

    def set_safety_stock(self, variant_id: str, value: int) -> dict:
        inventory = InventoryRepository.lock_inventory(variant_id)
        updated = InventoryRepository.update_fields(
            inventory, safety_stock=value, status=self._calculate_status(inventory)
        )
        return self._serialize(updated)

    def set_reservation_expiration(self, variant_id: str, minutes: int) -> dict:
        inventory = InventoryRepository.lock_inventory(variant_id)
        updated = InventoryRepository.update_fields(
            inventory, reservation_expiration_minutes=minutes
        )
        return self._serialize(updated)

    @transaction.atomic
    def reserve_stock(
        self,
        variant_id: str,
        quantity: int,
        user_id: str = None,
        expires_in_minutes: int = None,
    ) -> dict:
        inventory = InventoryRepository.lock_inventory(variant_id)
        if quantity <= 0:
            raise BusinessException("Reservation quantity must be positive.")

        sellable = inventory.available_quantity - inventory.reserved_quantity
        if sellable < quantity:
            raise BusinessException("Not enough stock available to reserve.")

        # Use inventory's default expiration if not overridden
        if expires_in_minutes is None:
            expires_in_minutes = inventory.reservation_expiration_minutes

        expires_at = timezone.now() + timezone.timedelta(minutes=expires_in_minutes)
        reservation = ReservationRepository.create_reservation(
            inventory, user_id, quantity, expires_at
        )

        # Update reserved quantity
        new_reserved = inventory.reserved_quantity + quantity
        updated = InventoryRepository.update_fields(
            inventory,
            reserved_quantity=new_reserved,
            status=self._calculate_status(inventory),
        )

        return {
            "reservation_id": str(reservation.id),
            "expires_at": reservation.expires_at.isoformat(),
            "reserved_quantity": quantity,
        }

    @transaction.atomic
    def commit_reservation(self, reservation_id: str) -> dict:
        reservation = InventorySelector.get_reservation_by_id(reservation_id)
        if not reservation:
            raise BusinessException("Reservation not found.")
        if reservation.status != Reservation.Status.ACTIVE:
            raise BusinessException("Reservation is no longer active.")
        if reservation.expires_at < timezone.now():
            # Expired – we could release it automatically, but caller should handle.
            self._release_reservation(reservation)
            raise BusinessException("Reservation has expired.")

        inventory = InventoryRepository.lock_inventory(reservation.inventory.variant_id)
        # Deduct from available and reduce reserved
        new_available = inventory.available_quantity - reservation.quantity
        new_reserved = inventory.reserved_quantity - reservation.quantity
        ReservationRepository.update_status(reservation, Reservation.Status.USED)
        updated = InventoryRepository.update_fields(
            inventory,
            available_quantity=new_available,
            reserved_quantity=new_reserved,
            status=self._calculate_status(inventory),
        )
        return {"message": "Reservation committed."}

    @transaction.atomic
    def release_reservation(self, reservation_id: str) -> dict:
        reservation = InventorySelector.get_reservation_by_id(reservation_id)
        if not reservation:
            raise BusinessException("Reservation not found.")
        if reservation.status != Reservation.Status.ACTIVE:
            raise BusinessException("Reservation is not active.")
        self._release_reservation(reservation)
        return {"message": "Reservation released."}

    def _release_reservation(self, reservation: Reservation):
        inventory = InventoryRepository.lock_inventory(reservation.inventory.variant_id)
        new_reserved = inventory.reserved_quantity - reservation.quantity
        ReservationRepository.update_status(reservation, Reservation.Status.CANCELLED)
        InventoryRepository.update_fields(
            inventory,
            reserved_quantity=new_reserved,
            status=self._calculate_status(inventory),
        )

    @transaction.atomic
    def expire_reservations(self):
        """Called by Celery beat. Cancel all expired active reservations and update inventory."""
        expired = InventorySelector.get_expired_active_reservations()
        if not expired:
            return
        # Group by inventory to update reserved counts
        inventory_ids = set(r.inventory_id for r in expired)
        for inventory in Inventory.objects.filter(
            id__in=inventory_ids
        ).select_for_update():
            active_reservations = Reservation.objects.filter(
                inventory=inventory, status=Reservation.Status.ACTIVE
            )
            total_reserved = (
                active_reservations.aggregate(sum=models.Sum("quantity"))["sum"] or 0
            )
            # Update reserved_quantity to reflect only still active
            InventoryRepository.update_fields(
                inventory,
                reserved_quantity=total_reserved,
                status=self._calculate_status(inventory),
            )
        # Mark all expired as EXPIRED
        ReservationRepository.bulk_update_status(
            [r.id for r in expired], Reservation.Status.EXPIRED
        )

    def _serialize(self, inventory: Inventory) -> dict:
        return {
            "id": str(inventory.id),
            "variant_id": str(inventory.variant_id),
            "available_quantity": inventory.available_quantity,
            "reserved_quantity": inventory.reserved_quantity,
            "safety_stock": inventory.safety_stock,
            "status": inventory.status,
            "reservation_expiration_minutes": inventory.reservation_expiration_minutes,
        }
