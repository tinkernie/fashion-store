from django.db import models
from django.conf import settings
from common.models import BaseModel

class NotificationTemplate(BaseModel):
    TYPE_CHOICES = [
        ('order_confirmation', 'Order Confirmation'),
        ('order_status_change', 'Order Status Change'),
        ('shipping_update', 'Shipping Update'),
        ('welcome', 'Welcome'),
        ('wishlist_discount', 'Wishlist Product Discount'),
        ('generic', 'Generic'),
    ]
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, db_index=True)
    subject_template = models.CharField(max_length=300)
    body_template = models.TextField(help_text="Use {{ variable }} placeholders")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'notification_template'
        constraints = [
            models.UniqueConstraint(
                fields=['type'],
                condition=models.Q(deleted_at__isnull=True),
                name='uq_template_type_active',
            )
        ]

    def __str__(self):
        return f"Template: {self.get_type_display()}"


class UserNotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preferences')
    sms_order_updates = models.BooleanField(default=True)
    sms_promotions = models.BooleanField(default=True)
    sms_account = models.BooleanField(default=True)
    in_app_order_updates = models.BooleanField(default=True)
    in_app_account = models.BooleanField(default=True)

    class Meta:
        db_table = 'user_notification_preference'

    def __str__(self):
        return f"Preferences for {self.user.phone_number}"


class Notification(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=NotificationTemplate.TYPE_CHOICES)
    subject = models.CharField(max_length=300)
    body = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    context_json = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'notification'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification {self.type} for {self.user.phone_number}"
