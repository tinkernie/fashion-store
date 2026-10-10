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
        # H6: compute status from new sellable, not stale inventory object
        new_sellable = new_qty - inventory.reserved_quantity
        if new_sellable <= 0:
            new_status = Inventory.Status.OUT_OF_STOCK
        elif new_sellable <= inventory.safety_stock:
            new_status = Inventory.Status.LOW_STOCK
        else:
            new_status = Inventory.Status.IN_STOCK
        updated = InventoryRepository.update_fields(
            inventory,
            available_quantity=new_qty,
            status=new_status,
        )
        return self._serialize(updated)

    @transaction.atomic
    def set_quantity(self, variant_id: str, quantity: int) -> dict:
        """Set available quantity to an absolute value (admin action).

        Unlike adjust_stock (delta-based), this lets the admin type the exact
        stock on hand (e.g. 1) without computing the difference first.
        Negative input clamps to 0; reserved units are never touched, so the
        status is recomputed from the new sellable amount.
        """
        from variants.models import Variant

        variant = Variant.objects.filter(id=variant_id, deleted_at__isnull=True).first()
        if not variant:
            variant = Variant.objects.filter(
                product_id=variant_id, deleted_at__isnull=True
            ).first()
            if variant:
                variant_id = str(variant.id)
            else:
                raise BusinessException("Target product or variant not found.")

        inventory = InventoryRepository.lock_inventory(str(variant_id))
        new_qty = max(0, int(quantity))
        new_sellable = new_qty - inventory.reserved_quantity
        if new_sellable <= 0:
            new_status = Inventory.Status.OUT_OF_STOCK
        elif new_sellable <= inventory.safety_stock:
            new_status = Inventory.Status.LOW_STOCK
        else:
            new_status = Inventory.Status.IN_STOCK
        updated = InventoryRepository.update_fields(
            inventory,
            available_quantity=new_qty,
            status=new_status,
        )
        return self._serialize(updated)

    def set_safety_stock(self, variant_id: str, value: int) -> dict:
        from variants.models import Variant
        actual_variant_id = variant_id
        variant = Variant.objects.filter(id=variant_id, deleted_at__isnull=True).first()
        if not variant:
            variant = Variant.objects.filter(product_id=variant_id, deleted_at__isnull=True).first()
            if variant:
                actual_variant_id = str(variant.id)

        inventory = InventoryRepository.lock_inventory(actual_variant_id)
        # H6: safety stock change may affect status
        new_sellable = inventory.available_quantity - inventory.reserved_quantity
        if new_sellable <= 0:
            new_status = Inventory.Status.OUT_OF_STOCK
        elif new_sellable <= value:
            new_status = Inventory.Status.LOW_STOCK
        else:
            new_status = Inventory.Status.IN_STOCK
        updated = InventoryRepository.update_fields(
            inventory, safety_stock=value, status=new_status
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

        # Update reserved quantity - H6: compute status from new sellable
        new_reserved = inventory.reserved_quantity + quantity
        new_sellable = inventory.available_quantity - new_reserved
        if new_sellable <= 0:
            new_status = Inventory.Status.OUT_OF_STOCK
        elif new_sellable <= inventory.safety_stock:
            new_status = Inventory.Status.LOW_STOCK
        else:
            new_status = Inventory.Status.IN_STOCK
        updated = InventoryRepository.update_fields(
            inventory,
            reserved_quantity=new_reserved,
            status=new_status,
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
        # Deduct from available and reduce reserved - H6: compute status from new values
        new_available = inventory.available_quantity - reservation.quantity
        new_reserved = inventory.reserved_quantity - reservation.quantity
        new_sellable = new_available - new_reserved
        if new_sellable <= 0:
            new_status = Inventory.Status.OUT_OF_STOCK
        elif new_sellable <= inventory.safety_stock:
            new_status = Inventory.Status.LOW_STOCK
        else:
            new_status = Inventory.Status.IN_STOCK
        ReservationRepository.update_status(reservation, Reservation.Status.USED)
        updated = InventoryRepository.update_fields(
            inventory,
            available_quantity=new_available,
            reserved_quantity=new_reserved,
            status=new_status,
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
        new_reserved = max(0, inventory.reserved_quantity - reservation.quantity)
        # H6: compute status from new sellable
        new_sellable = inventory.available_quantity - new_reserved
        if new_sellable <= 0:
            new_status = Inventory.Status.OUT_OF_STOCK
        elif new_sellable <= inventory.safety_stock:
            new_status = Inventory.Status.LOW_STOCK
        else:
            new_status = Inventory.Status.IN_STOCK
        ReservationRepository.update_status(reservation, Reservation.Status.CANCELLED)
        InventoryRepository.update_fields(
            inventory,
            reserved_quantity=new_reserved,
            status=new_status,
        )

    @transaction.atomic
    def expire_reservations(self) -> dict:
        """
        Called by Celery Beat every 5 minutes (crontab minute=*/5).
        Finds all ACTIVE reservations where expires_at < now(), marks them
        EXPIRED, and restores reserved stock on the parent Inventory.

        Why periodic: if a user abandons cart/checkout the reserved stock
        would stay locked forever, making the item appear out-of-stock.
        This task guarantees eventual consistency without blocking HTTP.
        Uses SELECT FOR UPDATE to prevent race with concurrent reserve/commit.
        Includes distributed lock (ISSUE-13) and skip_locked (ISSUE-12).
        """
        import logging
        from collections import defaultdict

        from django.core.cache import cache

        logger = logging.getLogger(__name__)

        # Distributed singleton lock to prevent double execution if two beat workers overlap
        lock_key = "celery:expire_reservations:lock"
        # timeout slightly less than beat interval (5min=300s)
        if not cache.add(lock_key, "1", timeout=270):
            logger.info("expire_reservations already running, skipping duplicate execution")
            return {"expired_count": 0, "inventories_updated": 0, "skipped": True}
        try:
            now = timezone.now()
            # Lock expired rows to prevent race with concurrent commit/reserve
            # skip_locked allows concurrent workers to skip already-locked rows (Postgres)
            try:
                expired_qs = (
                    Reservation.objects.select_for_update(skip_locked=True)
                    .filter(status=Reservation.Status.ACTIVE, expires_at__lt=now)
                    .select_related("inventory")
                )
                # Force evaluation while lock held; list() avoids extra exists() query + race
                expired_list = list(expired_qs)
            except Exception:
                # Fallback for SQLite (does not support skip_locked)
                expired_list = list(
                    Reservation.objects.select_for_update()
                    .filter(status=Reservation.Status.ACTIVE, expires_at__lt=now)
                    .select_related("inventory")
                )

            if not expired_list:
                return {"expired_count": 0, "inventories_updated": 0}

            # Group expired quantity per inventory (avoid N+1 aggregation bug)
            expired_by_inventory: dict = defaultdict(int)
            expired_ids: list = []
            for r in expired_list:
                expired_by_inventory[r.inventory_id] += r.quantity
                expired_ids.append(r.id)

            inventories_updated = 0
            for inventory_id, expired_qty in expired_by_inventory.items():
                # Lock row to prevent concurrent reserve_stock/commit races
                inventory = Inventory.objects.select_for_update().get(id=inventory_id)
                new_reserved = max(0, inventory.reserved_quantity - expired_qty)
                # Compute status from the *new* sellable quantity, not stale object
                sellable = inventory.available_quantity - new_reserved
                if sellable <= 0:
                    new_status = Inventory.Status.OUT_OF_STOCK
                elif sellable <= inventory.safety_stock:
                    new_status = Inventory.Status.LOW_STOCK
                else:
                    new_status = Inventory.Status.IN_STOCK

                InventoryRepository.update_fields(
                    inventory,
                    reserved_quantity=new_reserved,
                    status=new_status,
                )
                inventories_updated += 1

            # Mark all expired reservations as EXPIRED in bulk (single query)
            # Filter by status=ACTIVE to avoid overwriting concurrently committed ones (ISSUE-12)
            Reservation.objects.filter(
                id__in=expired_ids, status=Reservation.Status.ACTIVE
            ).update(status=Reservation.Status.EXPIRED)

            return {"expired_count": len(expired_ids), "inventories_updated": inventories_updated}
        finally:
            cache.delete(lock_key)

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
