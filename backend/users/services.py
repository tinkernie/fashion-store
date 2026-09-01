from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from common.exceptions import BusinessException
from .repositories import UserRepository
from .selectors import UserSelector
from .validators import UserValidator
from .tasks import send_email_change_verification

User = get_user_model()


class UserService:
    def update_profile(self, user: User, data: dict) -> User:
        allowed_fields = {"first_name", "last_name"}
        filtered = {k: v for k, v in data.items() if k in allowed_fields}
        if not filtered:
            raise BusinessException("No valid fields to update.")
        for field in ["first_name", "last_name"]:
            if field in filtered:
                UserValidator.validate_name(filtered[field], field_name=field)
        return UserRepository.update_user(user, **filtered)

    def change_email_request(self, user: User, new_email: str, password: str) -> dict:
        if not user.check_password(password):
            raise BusinessException("Password is incorrect.", code="wrong_password")
        # Group A: normalize email for case-insensitivity
        normalized_email = new_email.strip().lower()
        UserValidator.validate_email_unique(normalized_email, exclude_user_id=user.id)
        # Cancel any previous pending requests for this user + atomic creation
        from .models import EmailChangeRequest

        with transaction.atomic():
            EmailChangeRequest.objects.select_for_update().filter(user=user, is_used=False).update(is_used=True)
            token = UserRepository.create_email_change_request(user, normalized_email)
        transaction.on_commit(
            lambda: send_email_change_verification.delay(
                str(token.id), normalized_email, str(token.token)
            )
        )
        return {"message": "Verification email sent to new address."}

    def confirm_email_change(self, token_str: str) -> dict:
        from .models import EmailChangeRequest

        # Group A: atomic + select_for_update + re-validate uniqueness at confirm time
        with transaction.atomic():
            try:
                token = EmailChangeRequest.objects.select_for_update().select_related("user").get(
                    token=token_str, is_used=False
                )
            except EmailChangeRequest.DoesNotExist:
                raise BusinessException("Invalid or expired token.", code="invalid_token")
            if token.created_at < timezone.now() - timedelta(hours=1):
                token.is_used = True
                token.save(update_fields=["is_used", "updated_at"])
                raise BusinessException("Token expired.", code="token_expired")

            # Re-validate uniqueness inside lock (TOCTOU between request and confirm)
            normalized_new = token.new_email.strip().lower()
            if User.objects.filter(email__iexact=normalized_new).exclude(id=token.user_id).exists():
                raise BusinessException("A user with this email already exists.", code="email_exists")

            user = token.user
            user.email = normalized_new
            user.save(update_fields=["email", "updated_at"])
            token.is_used = True
            token.save(update_fields=["is_used", "updated_at"])
            # Blacklist all tokens to force re‑login
            from rest_framework_simplejwt.token_blacklist.models import (
                BlacklistedToken,
                OutstandingToken,
            )

            for t in OutstandingToken.objects.select_for_update().filter(user=user):
                BlacklistedToken.objects.get_or_create(token=t)
        return {"message": "Email changed successfully. Please log in again."}

    # Admin actions
    def deactivate_user(self, user_id: str, requested_by: User) -> dict:
        user = UserSelector.get_user_by_id(user_id)
        if not user:
            raise BusinessException("User not found.", code="not_found")
        if user == requested_by:
            raise BusinessException(
                "You cannot deactivate your own account.", code="self_deactivate"
            )
        UserRepository.deactivate_user(user)
        return {"message": f"User {user.email} deactivated."}

    def activate_user(self, user_id: str, requested_by: User) -> dict:
        user = UserSelector.get_user_by_id(user_id)
        if not user:
            raise BusinessException("User not found.", code="not_found")
        UserRepository.activate_user(user)
        return {"message": f"User {user.email} activated."}

    def admin_update_user(self, user_id: str, data: dict, requested_by: User) -> User:
        user = UserSelector.get_user_by_id(user_id)
        if not user:
            raise BusinessException("User not found.", code="not_found")
        # Fields admin can update: first_name, last_name, email, is_active
        allowed = {"first_name", "last_name", "email", "is_active"}
        update_data = {k: v for k, v in data.items() if k in allowed}

        if user == requested_by and update_data.get("is_active") is False:
            raise BusinessException(
                "You cannot deactivate your own account.",
                code="self_deactivate",
            )

        if "email" in update_data:
            # M2: forbid direct email hijack via admin without verification
            raise BusinessException(
                "Email change via admin not allowed. User must verify via email OTP flow.",
                code="email_admin_forbidden",
            )

        return UserRepository.update_user(user, **update_data)

    def assign_groups(self, user_id: str, group_ids: list, requested_by: User):
        user = UserSelector.get_user_by_id(user_id)
        if not user:
            raise BusinessException("User not found.")
        from django.contrib.auth.models import Group

        # M2: prevent self-escalation and validate IDs
        if user == requested_by:
            raise BusinessException("Cannot change your own groups.", code="self_assign")
        groups = Group.objects.filter(id__in=group_ids)
        if groups.count() != len(set(str(g) for g in group_ids)):
            raise BusinessException("One or more groups not found.", code="not_found")
        user.groups.set(groups)
        return {"groups": list(user.groups.values_list("name", flat=True))}
