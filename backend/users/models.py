import uuid
from django.db import models
from django.conf import settings
from common.models import BaseModel, TimestampedModel, UUIDPrimaryKeyMixin


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


class Address(BaseModel):
    """User address book entry (max 3 per user, one default).

    Province/city are stored as stable source ids plus resolved Persian
    names (names are what shippers print; ids drive dropdown validation).
    No natural unique key: duplicates are the user's choice, soft-deleted
    rows never block anything, and order snapshots keep history.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="addresses",
        db_index=True,
    )
    recipient_name = models.CharField(max_length=150)
    recipient_phone = models.CharField(max_length=15, db_index=True)
    province_id = models.PositiveIntegerField(db_index=True)
    province_name = models.CharField(max_length=100)
    city_id = models.BigIntegerField(db_index=True)
    city_name = models.CharField(max_length=100)
    street = models.CharField(max_length=500)
    building_no = models.CharField(max_length=50)
    postal_code = models.CharField(max_length=10, db_index=True)
    is_default = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table = "user_address"
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.province_name}، {self.city_name} — {self.postal_code}"
