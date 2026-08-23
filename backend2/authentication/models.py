import uuid
from django.db import models
from django.conf import settings
from common.models import TimestampedModel, UUIDPrimaryKeyMixin


class EmailVerificationToken(UUIDPrimaryKeyMixin, TimestampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_verification_tokens",
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "auth_email_verification_token"

    def mark_used(self):
        self.is_used = True
        self.save(update_fields=["is_used", "updated_at"])
