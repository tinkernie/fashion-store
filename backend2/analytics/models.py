from django.db import models
from django.conf import settings
from common.models import BaseModel


class TrackedEvent(BaseModel):
    EVENT_TYPES = [
        ('page_view', 'Page View'),
        ('product_view', 'Product View'),
        ('cart_add', 'Cart Add'),
        ('cart_remove', 'Cart Remove'),
        ('order_placed', 'Order Placed'),
    ]
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tracked_events',
    )
    session_key = models.UUIDField(null=True, blank=True, db_index=True)
    type = models.CharField(max_length=50, choices=EVENT_TYPES, db_index=True)
    payload = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'analytics_event'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.type} at {self.timestamp}"
