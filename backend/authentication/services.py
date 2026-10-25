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
    # sid binds the access+refresh pair into one login session. It is
    # persisted inside OutstandingToken.token, so later rotations (which
    # mutate the same object) keep it — enabling per-session logout.
    import uuid as _uuid

    sid = _uuid.uuid4().hex
    refresh = RefreshToken.for_user(user)
    refresh["sid"] = sid
    refresh["is_staff"] = user.is_staff
    refresh["is_superuser"] = user.is_superuser
    refresh["phone_number"] = user.phone_number
    refresh.access_token["sid"] = sid
    refresh.access_token["is_staff"] = user.is_staff
    refresh.access_token["is_superuser"] = user.is_superuser
    refresh.access_token["phone_number"] = user.phone_number
    # for_user() persists the Outstanding row BEFORE custom claims are set;
    # refresh the stored string so the sid is actually recorded for later
    # session matching (e.g. change-password keeps own session alive).
    try:
        OutstandingToken.objects.filter(jti=refresh["jti"]).update(token=str(refresh))
    except Exception:
        pass
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


SIGNUP_TICKET_SALT = "otp-signup-ticket"
SIGNUP_TICKET_MAX_AGE = 10 * 60  # the name+password form must follow OTP promptly


def _make_signup_token(phone_number: str) -> str:
    from django.core.signing import TimestampSigner

    return TimestampSigner(salt=SIGNUP_TICKET_SALT).sign(phone_number)


def _read_signup_token(token: str):
    """Return the phone bound to a signup ticket, or None if forged/expired."""
    from django.core.signing import BadSignature, SignatureExpired, TimestampSigner

    try:
        return TimestampSigner(salt=SIGNUP_TICKET_SALT).unsign(token, max_age=SIGNUP_TICKET_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None


def _stored_token_sid(stored_token: str):
    """Read the sid claim from a persisted OutstandingToken string without
    verifying the signature (read-only lookup; unparseable rows match
    nothing and are therefore blacklisted by callers)."""
    try:
        import base64 as _b64
        import json as _json

        payload_b64 = stored_token.split(".")[1]
        payload_b64 += "=" * (-len(payload_b64) % 4)
        return _json.loads(_b64.urlsafe_b64decode(payload_b64).decode("utf-8")).get("sid")
    except Exception:
        return None


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

    # --- OTP passwordless (signup + reset via sms.ir verify) ---
    _PUBLIC_OTP_PURPOSES = ("signup", "reset")

    def request_otp(self, phone_number: str, purpose: str = "login") -> dict:
        """Public OTP entry point. OTP is only used for registration and
        password recovery — login stays phone+password. Profile
        phone-change OTP is issued via the users app."""
        from .models import OtpCode

        normalized = (purpose or "").strip().lower()
        if normalized == OtpCode.PURPOSE_LOGIN:
            raise BusinessException(
                "OTP login is not available. Please log in with your phone number and password.",
                code="otp_login_disabled",
            )
        if normalized not in self._PUBLIC_OTP_PURPOSES:
            raise BusinessException(
                "Unsupported OTP purpose.", code="otp_unsupported_purpose"
            )
        return self._request_otp_internal(phone_number, normalized)

    def _request_otp_internal(self, phone_number: str, purpose: str) -> dict:
        from django.core.cache import cache

        from .models import OtpCode

        phone_number = PhoneValidator.validate(phone_number)
        if purpose not in (OtpCode.PURPOSE_LOGIN, OtpCode.PURPOSE_RESET, OtpCode.PURPOSE_SIGNUP):
            purpose = OtpCode.PURPOSE_LOGIN
        # Per-phone hourly cap (Redis, shared across workers) — protects SMS credit.
        # DRF throttle is per-IP; this is per-target-number: max 5 sends/hour.
        hour_key = f"otp:hour:{phone_number}:{purpose}"
        try:
            sent = cache.get(hour_key, 0)
            if int(sent) >= 5:
                # Generic message (no enumeration), no SMS sent
                return {"message": "If the number is valid, an OTP has been sent."}
        except Exception:
            sent = 0
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
            try:
                cache.set(hour_key, int(sent) + 1, 3600)
            except Exception:
                pass
        from notifications.tasks import send_otp_sms

        transaction.on_commit(lambda: send_otp_sms.delay(phone_number, raw_code, purpose))
        return {"message": "If the number is valid, an OTP has been sent."}

    @staticmethod
    def _load_valid_otp(phone_number: str, purpose: str):
        """Shared OTP check (expiry, lockout, attempts accounting). Returns
        the valid OtpCode row WITHOUT consuming it; callers decide."""
        from .models import OtpCode

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
            return otp

    @staticmethod
    def _consume_code(phone_number: str, purpose: str, code: str):
        """Validate a code against the latest OTP and consume it. Returns row."""
        from .models import OtpCode

        otp = AuthService._load_valid_otp(phone_number, purpose)
        with transaction.atomic():
            otp = OtpCode.objects.select_for_update().get(id=otp.id)
            if otp.is_used:
                raise BusinessException("Invalid or expired code.", code="invalid_otp")
            if not otp.check_code(code):
                otp.attempts += 1
                if otp.attempts >= otp.max_attempts:
                    otp.is_used = True
                otp.save(update_fields=["attempts", "is_used", "updated_at"])
                raise BusinessException("Invalid code.", code="invalid_otp")
            otp.is_used = True
            otp.save(update_fields=["is_used", "updated_at"])
            return otp

    def verify_otp(self, phone_number: str, code: str, purpose: str = "login") -> dict:
        """Public verify endpoint. Only signup/reset are accepted: there is
        no OTP login (phone+password only), and no implicit OTP registration.
        Profile phone-change verifies via its own users-app logic."""
        from .models import OtpCode

        phone_number = PhoneValidator.validate(phone_number)
        normalized = (purpose or "").strip().lower()
        if normalized == OtpCode.PURPOSE_LOGIN:
            raise BusinessException(
                "OTP login is not available. Please log in with your phone number and password.",
                code="otp_login_disabled",
            )
        if normalized not in self._PUBLIC_OTP_PURPOSES:
            raise BusinessException(
                "Unsupported OTP purpose.", code="otp_unsupported_purpose"
            )
        purpose = normalized
        self._consume_code(phone_number, purpose, code)
        with transaction.atomic():
            if purpose == OtpCode.PURPOSE_SIGNUP:
                # Signup step 1 of 2: prove the number, create NOTHING yet.
                # The client then shows the name+password form and calls
                # signup/complete with the returned ticket.
                if UserSelector.get_user_by_phone(phone_number):
                    raise BusinessException(
                        "This number is already registered. Please log in.",
                        code="phone_exists",
                    )
                return {
                    "phone_number": phone_number,
                    "signup_token": _make_signup_token(phone_number),
                    "message": "Code verified. Complete your registration.",
                }
            if purpose == OtpCode.PURPOSE_RESET:
                # Reset codes only authorize the password-reset-otp call;
                # they never open a session by themselves.
                return {"phone_number": phone_number, "message": "Code verified."}
            raise BusinessException(
                "Unsupported OTP purpose.", code="otp_unsupported_purpose"
            )

    def complete_signup(self, phone_number: str, signup_token: str,
                        password: str, first_name: str = "", last_name: str = "") -> dict:
        """Signup step 2 of 2: consume a verified signup ticket, create the
        account with name+password, and log the user in."""
        from .models import OtpCode

        phone_number = PhoneValidator.validate(phone_number)
        PasswordValidator.validate(password)
        ticket_phone = _read_signup_token(signup_token)
        if ticket_phone is None:
            raise BusinessException("Signup session expired. Please request a new code.", code="invalid_token")
        if ticket_phone != phone_number:
            raise BusinessException("Signup session does not match this number.", code="invalid_token")
        try:
            with transaction.atomic():
                if UserSelector.get_user_by_phone(phone_number):
                    raise BusinessException(
                        "This number is already registered. Please log in.", code="phone_exists"
                    )
                user = UserRepository.create_user(
                    phone_number=phone_number,
                    password=password,
                    first_name=(first_name or "").strip(),
                    last_name=(last_name or "").strip(),
                    is_active=True,
                )
        except IntegrityError:
            raise BusinessException(
                "This number is already registered. Please log in.", code="phone_exists"
            )
        data = _issue_tokens(user)
        data["message"] = "Account created successfully."
        return data

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

    def change_password(self, user, old_password: str, new_password: str, current_sid: str = None):
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
            # Log out OTHER sessions, but keep the session that made this
            # request alive: otherwise the profile page's success toast is
            # immediately followed by a forced logout (all tokens dead).
            # Sessions are identified by the sid claim minted at login
            # (rotations preserve it); rows without a matching sid —
            # including pre-sid legacy sessions — are blacklisted.
            for token in OutstandingToken.objects.filter(user=user):
                if current_sid and _stored_token_sid(token.token) == current_sid:
                    continue
                BlacklistedToken.objects.get_or_create(token=token)
        return {"message": "Password changed successfully."}
