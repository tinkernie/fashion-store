from datetime import timedelta
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
        UserValidator.validate_email_unique(new_email, exclude_user_id=user.id)
        # Cancel any previous pending requests for this user
        from .models import EmailChangeRequest

        EmailChangeRequest.objects.filter(user=user, is_used=False).update(is_used=True)
        token = UserRepository.create_email_change_request(user, new_email)
        send_email_change_verification.delay(str(token.id), new_email, str(token.token))
        return {"message": "Verification email sent to new address."}

    def confirm_email_change(self, token_str: str) -> dict:
        from .models import EmailChangeRequest

        try:
            token = UserSelector.get_email_change_request(token_str)
        except EmailChangeRequest.DoesNotExist:
            raise BusinessException("Invalid or expired token.", code="invalid_token")
        if token.created_at < timezone.now() - timedelta(hours=1):
            token.is_used = True
            token.save()
            raise BusinessException("Token expired.", code="token_expired")
        # Update user email
        user = token.user
        user.email = token.new_email
        user.save(update_fields=["email", "updated_at"])
        UserRepository.mark_email_change_used(token)
        # Blacklist all tokens to force re‑login
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

        for t in OutstandingToken.objects.filter(user=user):
            t.blacklist()
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
            UserValidator.validate_email_unique(update_data["email"], exclude_user_id=user.id)

        if "is_active" in update_data and update_data["is_active"] and user == requested_by:
            raise BusinessException(
                "Cannot deactivate yourself via admin update.", code="self_deactivate"
            )

        return UserRepository.update_user(user, **update_data)

    def assign_groups(self, user_id: str, group_ids: list, requested_by: User):
        user = UserSelector.get_user_by_id(user_id)
        if not user:
            raise BusinessException("User not found.")
        from django.contrib.auth.models import Group

        groups = Group.objects.filter(id__in=group_ids)
        user.groups.set(groups)
        return {"groups": list(user.groups.values_list("name", flat=True))}
