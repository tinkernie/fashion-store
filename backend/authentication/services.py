from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from django.db import transaction, IntegrityError

from common.exceptions import BusinessException
from .repositories import UserRepository, TokenRepository
from .selectors import UserSelector, TokenSelector
from .validators import PasswordValidator
from .models import EmailVerificationToken
from .tasks import send_verification_email, send_password_reset_email
from django.contrib.auth import get_user_model


class AuthService:
    def register_user(
        self, email: str, password: str, first_name: str = "", last_name: str = ""
    ) -> dict:
        PasswordValidator.validate(password)

        # H1: TOCTOU fix - atomic + IntegrityError catch for concurrent same email
        try:
            with transaction.atomic():
                existing = UserSelector.get_user_by_email(email)
                if existing:
                    raise BusinessException(
                        "A user with this email already exists.", code="email_exists"
                    )

                user = UserRepository.create_user(
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True,
                )
                # Create verification token inside same atomic to avoid orphan token
                token = TokenRepository.create_verification_token(user)
        except IntegrityError:
            # Race: second concurrent insert hit UNIQUE(email) - map to 400 not 500
            raise BusinessException(
                "A user with this email already exists.", code="email_exists"
            )
        # Send verification email (async) — after commit to avoid race
        transaction.on_commit(
            lambda: send_verification_email.delay(str(user.id), str(token.token))
        )
        return {
            "id": user.id,
            "email": user.email,
            "message": "User registered successfully.",
        }

    def verify_email(self, token_str: str) -> dict:
        # H2: atomic + select_for_update to prevent double-spend
        with transaction.atomic():
            try:
                token = EmailVerificationToken.objects.select_for_update().select_related("user").get(token=token_str)
            except EmailVerificationToken.DoesNotExist:
                raise BusinessException("Invalid verification token.", code="invalid_token")
            if token.is_used:
                raise BusinessException("Token already used.", code="token_used")
            if token.created_at < timezone.now() - timedelta(hours=24):
                raise BusinessException("Verification token expired.", code="token_expired")

            token.is_used = True
            token.save(update_fields=["is_used", "updated_at"])
            UserRepository.mark_email_verified(token.user)
        return {"message": "Email verified successfully."}

    def login_user(self, email: str, password: str) -> dict:
        user = UserSelector.get_user_by_email(email)
        if not user or not user.check_password(password):
            raise BusinessException("Invalid credentials.", code="invalid_credentials")
        if not user.is_active:
            raise BusinessException(
                "Account not activated. Please verify your email.",
                code="inactive_account",
            )

        refresh = RefreshToken.for_user(user)
        refresh["is_staff"] = user.is_staff
        refresh["is_superuser"] = user.is_superuser
        refresh["email"] = user.email
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            },
        }

    def logout_user(self, refresh_token: str):
        from rest_framework_simplejwt.exceptions import TokenError
        from rest_framework.exceptions import PermissionDenied

        try:
            token = RefreshToken(refresh_token)
            # H2-related: small ownership check is done in view, but keep generic here
            token.blacklist()
        except TokenError as e:
            raise BusinessException(str(e), code="invalid_token")

    def refresh_token(self, refresh_token: str) -> dict:
        # SimpleJWT handles rotation and blacklisting automatically in the view.
        # We'll just delegate to the library view.
        pass  # handled in view directly

    def request_password_reset(self, email: str) -> dict:
        user = UserSelector.get_user_by_email(email)
        # Always return success even if email not found (prevent enumeration)
        if not user:
            return {
                "message": "If the email is registered, a reset link has been sent."
            }
        # Generate token using Django's default token generator
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        # Send email — after commit (even though no DB write, keeps pattern consistent)
        transaction.on_commit(
            lambda: send_password_reset_email.delay(user.email, uidb64, token)
        )
        return {"message": "If the email is registered, a reset link has been sent."}

    def reset_password(self, uidb64: str, token: str, new_password: str) -> dict:
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = UserSelector.get_user_by_id(uid)
            User = get_user_model()
            if not user:
                raise BusinessException("Invalid reset link.", code="invalid_link")
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise BusinessException("Invalid reset link.", code="invalid_link")
        # H3: explicit None check before check_token to avoid AttributeError 500
        if user is None or not default_token_generator.check_token(user, token):
            raise BusinessException(
                "Invalid or expired reset token.", code="invalid_token"
            )

        PasswordValidator.validate(new_password)
        with transaction.atomic():
            UserRepository.change_password(user, new_password)
            # Invalidate all existing refresh tokens for this user
            for outstanding in OutstandingToken.objects.filter(user=user):
                BlacklistedToken.objects.get_or_create(token=outstanding)
        return {"message": "Password reset successful."}

    def change_password(self, user, old_password: str, new_password: str):
        if not user.check_password(old_password):
            raise BusinessException(
                "Current password is incorrect.", code="wrong_password"
            )
        PasswordValidator.validate(new_password)
        with transaction.atomic():
            UserRepository.change_password(user, new_password)
            # Optional: blacklist all tokens to force re-login
            for outstanding in OutstandingToken.objects.filter(user=user):
                BlacklistedToken.objects.get_or_create(token=outstanding)
        return {"message": "Password changed successfully."}
