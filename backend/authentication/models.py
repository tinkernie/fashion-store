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


class PasswordResetToken(UUIDPrimaryKeyMixin, TimestampedModel):
    """
    Optional DB-backed password-reset token (complement to Django's
    default_token_generator which is stateless). We store it so the
    periodic cleanup task can purge expired records >48h as per spec.
    If you use only the generator, this table stays empty — cleanup is still safe.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "auth_password_reset_token"

    def mark_used(self):
        self.is_used = True
        self.save(update_fields=["is_used", "updated_at"])
