import secrets
from django.conf import settings
from django.db import transaction, IntegrityError
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)

from common.exceptions import BusinessException
from .repositories import UserRepository, OtpRepository
from .selectors import UserSelector
from .validators import PasswordValidator, PhoneValidator
from django.contrib.auth import get_user_model


def _issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    refresh["is_staff"] = user.is_staff
    refresh["is_superuser"] = user.is_superuser
    refresh["phone_number"] = user.phone_number
    refresh.access_token["is_staff"] = user.is_staff
    refresh.access_token["is_superuser"] = user.is_superuser
    refresh.access_token["phone_number"] = user.phone_number
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": str(user.id),
            "phone_number": user.phone_number,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        },
    }


def _generate_code() -> str:
    length = max(4, min(int(getattr(settings, "OTP_LENGTH", 5)), 8))
    return "".join(secrets.choice("0123456789") for _ in range(length))


class AuthService:
    # --- password-based (username + password) ---
    def register_user(
        self, phone_number: str, password: str, first_name: str = "", last_name: str = ""
    ) -> dict:
        PasswordValidator.validate(password)
        phone_number = PhoneValidator.validate(phone_number)
        try:
            with transaction.atomic():
                if UserSelector.get_user_by_phone(phone_number):
                    raise BusinessException(
                        "A user with this phone already exists.", code="phone_exists"
                    )
                user = UserRepository.create_user(
                    phone_number=phone_number,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True,
                )
        except IntegrityError:
            raise BusinessException(
                "A user with this phone already exists.", code="phone_exists"
            )
        data = _issue_tokens(user)
        data["message"] = "User registered successfully."
        return data

    def login_user(self, phone_number: str, password: str) -> dict:
        phone_number = PhoneValidator.validate(phone_number)
        user = UserSelector.get_user_by_phone(phone_number)
        if not user or not user.has_usable_password() or not user.check_password(password):
            raise BusinessException("Invalid credentials.", code="invalid_credentials")
        if not user.is_active:
            raise BusinessException("Account is not active.", code="inactive_account")
        return _issue_tokens(user)

    # --- OTP passwordless (signup + login via sms.ir verify) ---
    def request_otp(self, phone_number: str, purpose: str = "login") -> dict:
        from .models import OtpCode

        phone_number = PhoneValidator.validate(phone_number)
        if purpose not in (OtpCode.PURPOSE_LOGIN, OtpCode.PURPOSE_RESET):
            purpose = OtpCode.PURPOSE_LOGIN
        with transaction.atomic():
            latest = OtpRepository.latest_valid(phone_number, purpose)
            if latest:
                elapsed = (timezone.now() - latest.created_at).total_seconds()
                if elapsed < settings.OTP_RESEND_SECONDS:
                    # Return generic to avoid enumeration, do not send new SMS
                    return {"message": "If the number is valid, an OTP has been sent."}
                # Invalidate previous unused codes for this phone/purpose
                OtpCode.objects.filter(
                    phone_number=phone_number, purpose=purpose, is_used=False
                ).update(is_used=True)
            raw_code = _generate_code()
            OtpRepository.create_otp(phone_number, raw_code, purpose)
        from notifications.tasks import send_otp_sms

        transaction.on_commit(lambda: send_otp_sms.delay(phone_number, raw_code))
        return {"message": "If the number is valid, an OTP has been sent."}

    def verify_otp(self, phone_number: str, code: str, purpose: str = "login") -> dict:
        from .models import OtpCode

        phone_number = PhoneValidator.validate(phone_number)
        if purpose not in (OtpCode.PURPOSE_LOGIN, OtpCode.PURPOSE_RESET):
            purpose = OtpCode.PURPOSE_LOGIN
        with transaction.atomic():
            otp = (
                OtpCode.objects.select_for_update()
                .filter(phone_number=phone_number, purpose=purpose, is_used=False)
                .order_by("-created_at")
                .first()
            )
            if not otp:
                raise BusinessException("Invalid or expired code.", code="invalid_otp")
            if timezone.now() >= otp.expires_at:
                otp.is_used = True
                otp.save(update_fields=["is_used", "updated_at"])
                raise BusinessException("Code expired.", code="otp_expired")
            if otp.attempts >= otp.max_attempts:
                otp.is_used = True
                otp.save(update_fields=["is_used", "updated_at"])
                raise BusinessException("Too many attempts.", code="otp_locked")
            if not otp.check_code(code):
                otp.attempts += 1
                if otp.attempts >= otp.max_attempts:
                    otp.is_used = True
                otp.save(update_fields=["attempts", "is_used", "updated_at"])
                raise BusinessException("Invalid code.", code="invalid_otp")
            otp.is_used = True
            otp.save(update_fields=["is_used", "updated_at"])
            user, _ = UserRepository.get_or_create_for_otp(phone_number)
            if not user.is_active:
                raise BusinessException("Account is not active.", code="inactive_account")
        return _issue_tokens(user)

    def reset_password_with_otp(self, phone_number: str, code: str, new_password: str) -> dict:
        """Verify OTP (purpose=reset) then set new password and blacklist sessions."""
        from .models import OtpCode

        phone_number = PhoneValidator.validate(phone_number)
        PasswordValidator.validate(new_password)
        with transaction.atomic():
            otp = (
                OtpCode.objects.select_for_update()
                .filter(phone_number=phone_number, purpose=OtpCode.PURPOSE_RESET, is_used=False)
                .order_by("-created_at")
                .first()
            )
            if not otp:
                raise BusinessException("Invalid or expired code.", code="invalid_otp")
            if timezone.now() >= otp.expires_at:
                otp.is_used = True
                otp.save(update_fields=["is_used", "updated_at"])
                raise BusinessException("Code expired.", code="otp_expired")
            if not otp.check_code(code):
                otp.attempts += 1
                if otp.attempts >= otp.max_attempts:
                    otp.is_used = True
                otp.save(update_fields=["attempts", "is_used", "updated_at"])
                raise BusinessException("Invalid code.", code="invalid_otp")
            user = UserSelector.get_user_by_phone(phone_number)
            if not user:
                raise BusinessException("User not found.", code="not_found")
            otp.is_used = True
            otp.save(update_fields=["is_used", "updated_at"])
            UserRepository.change_password(user, new_password)
            for outstanding in OutstandingToken.objects.filter(user=user):
                BlacklistedToken.objects.get_or_create(token=outstanding)
        return {"message": "Password reset successful."}

    def logout_user(self, refresh_token: str):
        from rest_framework_simplejwt.exceptions import TokenError

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as e:
            raise BusinessException(str(e), code="invalid_token")

    def refresh_token(self, refresh_token: str) -> dict:
        pass  # handled in view directly

    def change_password(self, user, old_password: str, new_password: str):
        # For phone+password users; OTP-only users have unusable password
        if not user.has_usable_password() or not user.check_password(old_password):
            # Allow setting first password via old='' for OTP users
            if not (old_password in ("", None) and not user.has_usable_password()):
                raise BusinessException(
                    "Current password is incorrect.", code="wrong_password"
                )
        PasswordValidator.validate(new_password)
        with transaction.atomic():
            UserRepository.change_password(user, new_password)
            for outstanding in OutstandingToken.objects.filter(user=user):
                BlacklistedToken.objects.get_or_create(token=outstanding)
        return {"message": "Password changed successfully."}
