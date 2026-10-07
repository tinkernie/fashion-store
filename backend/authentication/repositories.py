from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

User = get_user_model()


class UserRepository:
    @staticmethod
    def create_user(
        phone_number: str,
        password: str = None,
        first_name: str = "",
        last_name: str = "",
        is_active: bool = True,
    ) -> User:
        from .validators import PhoneValidator

        phone_number = PhoneValidator.validate(phone_number)
        user = User.objects.create_user(
            phone_number=phone_number,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_active=is_active,
        )
        return user

    @staticmethod
    def get_or_create_for_otp(phone_number: str) -> tuple:
        from .validators import PhoneValidator

        phone_number = PhoneValidator.validate(phone_number)
        user = User.objects.filter(phone_number=phone_number).first()
        if user:
            return user, False
        user = User.objects.create_user(phone_number=phone_number, password=None)
        return user, True

    @staticmethod
    def change_password(user: User, new_password: str):
        user.set_password(new_password)
        user.save(update_fields=["password", "updated_at"])


class OtpRepository:
    @staticmethod
    def create_otp(phone_number: str, raw_code: str, purpose: str = "login"):
        from .models import OtpCode

        expires_at = timezone.now() + timedelta(seconds=settings.OTP_EXPIRY_SECONDS)
        return OtpCode.objects.create(
            phone_number=phone_number,
            code_hash=OtpCode.hash_code(raw_code),
            purpose=purpose,
            expires_at=expires_at,
            max_attempts=settings.OTP_MAX_ATTEMPTS,
        )

    @staticmethod
    def latest_valid(phone_number: str, purpose: str = "login"):
        from .models import OtpCode

        return (
            OtpCode.objects.filter(
                phone_number=phone_number, purpose=purpose, is_used=False
            )
            .order_by("-created_at")
            .first()
        )
