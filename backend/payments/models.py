from django.db import models
from django.conf import settings
from common.models import BaseModel

class Payment(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        AUTHORIZED = 'authorized', 'Authorized'
        SUCCEEDED = 'succeeded', 'Succeeded'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'

    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.PROTECT,
        related_name='payments',
        db_index=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='payments',
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    gateway = models.CharField(max_length=50)   # e.g., 'dummy', 'stripe'
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    gateway_reference = models.CharField(max_length=255, null=True, blank=True, db_index=True)   # returned by gateway, unique when set
    authority = models.CharField(max_length=255, null=True, blank=True, unique=True, help_text='Unique transaction ID we generate')
    raw_response = models.JSONField(default=dict, blank=True)
    callback_data = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'payment'

    def __str__(self):
        return f"Payment {self.id} for Order {self.order.order_number} ({self.status})"