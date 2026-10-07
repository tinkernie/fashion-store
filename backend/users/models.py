import uuid
from django.db import models
from django.conf import settings
from common.models import TimestampedModel, UUIDPrimaryKeyMixin


class PhoneChangeRequest(UUIDPrimaryKeyMixin, TimestampedModel):
    """OTP-verified phone change: old phone -> new phone via sms.ir."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="phone_change_requests",
    )
    new_phone = models.CharField(max_length=15)
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "user_phone_change_request"
