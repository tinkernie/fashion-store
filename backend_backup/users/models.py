import uuid
from django.db import models
from django.conf import settings
from common.models import TimestampedModel, UUIDPrimaryKeyMixin


class EmailChangeRequest(UUIDPrimaryKeyMixin, TimestampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_change_requests",
    )
    new_email = models.EmailField()
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "user_email_change_request"
