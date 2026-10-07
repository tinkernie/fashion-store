import hashlib
from django.db import models
from django.utils import timezone
from common.models import TimestampedModel, UUIDPrimaryKeyMixin


class OtpCode(UUIDPrimaryKeyMixin, TimestampedModel):
    """SMS OTP for passwordless login/signup and password reset via sms.ir verify."""

    PURPOSE_LOGIN = "login"
    PURPOSE_RESET = "reset"
    PURPOSE_CHOICES = ((PURPOSE_LOGIN, "Login"), (PURPOSE_RESET, "Reset"))

    phone_number = models.CharField(max_length=15, db_index=True)
    code_hash = models.CharField(max_length=128)
    purpose = models.CharField(max_length=10, choices=PURPOSE_CHOICES, default=PURPOSE_LOGIN)
    expires_at = models.DateTimeField(db_index=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=5)
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "auth_otp_code"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["phone_number", "is_used"])]

    def is_expired(self) -> bool:
        return self.is_used or timezone.now() >= self.expires_at

    def check_code(self, raw_code: str) -> bool:
        digest = hashlib.sha256(raw_code.strip().encode()).hexdigest()
        import hmac

        return hmac.compare_digest(digest, self.code_hash)

    @staticmethod
    def hash_code(raw_code: str) -> str:
        import hashlib

        return hashlib.sha256(raw_code.strip().encode()).hexdigest()
