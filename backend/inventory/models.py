import uuid

from django.db import models
from django.conf import settings
from common.models import BaseModel


class Inventory(BaseModel):
    class Status(models.TextChoices):
        IN_STOCK = "in_stock", "In Stock"
        LOW_STOCK = "low_stock", "Low Stock"
        OUT_OF_STOCK = "out_of_stock", "Out of Stock"

    variant = models.OneToOneField(
        "variants.Variant",
        on_delete=models.PROTECT,
        related_name="inventory",
        db_index=True,
    )
    available_quantity = models.PositiveIntegerField(default=0)
    reserved_quantity = models.PositiveIntegerField(
        default=0
    )  # sum of active reservations
    safety_stock = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.OUT_OF_STOCK
    )
    reservation_expiration_minutes = models.PositiveIntegerField(default=15)
    version = models.PositiveIntegerField(default=1, editable=False)

    class Meta:
        db_table = "inventory"
        verbose_name_plural = "inventories"

    def __str__(self):
        return f"Inventory for {self.variant.sku}"

    @property
    def sellable_quantity(self):
        return self.available_quantity - self.reserved_quantity


class StockMovement(models.Model):
    """Append-only stock ledger.

    Every change to `Inventory.available_quantity` is recorded here with the
    resulting balance, so the on-hand number can always be reconstructed and
    audited (who sold/returned/adjusted what, and for which order).

    Deliberately NOT a BaseModel: rows are never updated, soft-deleted or
    timestamped beyond creation.
    """

    class Reason(models.TextChoices):
        SALE = "sale", "Counter sale"
        SALE_REVERSAL = "sale_reversal", "Sale reversal (void)"
        ONLINE_SALE = "online_sale", "Online order"
        RETURN = "return", "Customer return"
        RECEIVING = "receiving", "Stock received"
        ADJUSTMENT = "adjustment", "Manual adjustment"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inventory = models.ForeignKey(
        Inventory, on_delete=models.PROTECT, related_name="movements", db_index=True
    )
    # Signed: negative = stock left the shop, positive = stock arrived.
    quantity_delta = models.IntegerField()
    # Balance of available_quantity right after this movement was applied.
    quantity_after = models.PositiveIntegerField()
    reason = models.CharField(max_length=20, choices=Reason.choices, db_index=True)
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_movements",
    )
    reservation = models.ForeignKey(
        "Reservation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_movements",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_movements",
    )
    note = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "stock_movement"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["inventory", "-created_at"], name="idx_movement_inv_created"),
            models.Index(fields=["reason", "-created_at"], name="idx_movement_reason_created"),
        ]

    def __str__(self):
        return f"{self.reason} {self.quantity_delta:+d} -> {self.quantity_after}"

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValueError("StockMovement rows are append-only and cannot be updated.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("StockMovement rows are append-only and cannot be deleted.")


class Reservation(BaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        USED = "used", "Used"
        CANCELLED = "cancelled", "Cancelled"
        EXPIRED = "expired", "Expired"

    inventory = models.ForeignKey(
        Inventory,
        on_delete=models.PROTECT,
        related_name="reservations",
        db_index=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reservations",
    )
    quantity = models.PositiveIntegerField()
    reserved_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True
    )

    class Meta:
        db_table = "reservation"
        ordering = ["-reserved_at"]
