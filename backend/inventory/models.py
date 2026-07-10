from django.db import models
from django.conf import settings
from common.models import BaseModel

class Inventory(BaseModel):
    class Status(models.TextChoices):
        IN_STOCK = 'in_stock', 'In Stock'
        LOW_STOCK = 'low_stock', 'Low Stock'
        OUT_OF_STOCK = 'out_of_stock', 'Out of Stock'

    variant = models.OneToOneField(
        'variants.Variant',
        on_delete=models.PROTECT,
        related_name='inventory',
        db_index=True,
    )
    available_quantity = models.PositiveIntegerField(default=0)
    reserved_quantity = models.PositiveIntegerField(default=0)   # sum of active reservations
    safety_stock = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OUT_OF_STOCK)
    reservation_expiration_minutes = models.PositiveIntegerField(default=15)
    version = models.PositiveIntegerField(default=1, editable=False)

    class Meta:
        db_table = 'inventory'
        verbose_name_plural = 'inventories'

    def __str__(self):
        return f"Inventory for {self.variant.sku}"

    @property
    def sellable_quantity(self):
        return self.available_quantity - self.reserved_quantity


class Reservation(BaseModel):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        USED = 'used', 'Used'
        CANCELLED = 'cancelled', 'Cancelled'
        EXPIRED = 'expired', 'Expired'

    inventory = models.ForeignKey(
        Inventory,
        on_delete=models.PROTECT,
        related_name='reservations',
        db_index=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reservations',
    )
    quantity = models.PositiveIntegerField()
    reserved_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)

    class Meta:
        db_table = 'reservation'
        ordering = ['-reserved_at']