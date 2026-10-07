from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from common.exceptions import BusinessException
from .repositories import UserRepository
from .selectors import UserSelector
from .validators import UserValidator

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

    def change_phone_request(self, user: User, new_phone: str) -> dict:
        from authentication.validators import PhoneValidator
        from authentication.models import OtpCode
        from authentication.repositories import OtpRepository
        import secrets
        from django.conf import settings

        new_phone = PhoneValidator.validate(new_phone)
        UserValidator.validate_phone_unique(new_phone, exclude_user_id=user.id)
        with transaction.atomic():
            OtpCode.objects.filter(
                phone_number=new_phone, purpose=OtpCode.PURPOSE_LOGIN, is_used=False
            ).update(is_used=True)
            raw = "".join(secrets.choice("0123456789") for _ in range(max(4, min(int(settings.OTP_LENGTH), 8))))
            OtpRepository.create_otp(new_phone, raw, OtpCode.PURPOSE_LOGIN)
            # stash pending phone on user session? store via PhoneChangeRequest
            from .models import PhoneChangeRequest

            PhoneChangeRequest.objects.filter(user=user, is_used=False).update(is_used=True)
            PhoneChangeRequest.objects.create(user=user, new_phone=new_phone)
        from notifications.tasks import send_otp_sms

        transaction.on_commit(lambda: send_otp_sms.delay(new_phone, raw))
        return {"message": "OTP sent to new number."}

    def confirm_phone_change(self, user: User, new_phone: str, code: str) -> dict:
        from authentication.models import OtpCode
        from authentication.validators import PhoneValidator

        new_phone = PhoneValidator.validate(new_phone)
        with transaction.atomic():
            otp = (
                OtpCode.objects.select_for_update()
                .filter(phone_number=new_phone, purpose=OtpCode.PURPOSE_LOGIN, is_used=False)
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
            if User.objects.filter(phone_number=new_phone).exclude(id=user.id).exists():
                raise BusinessException("Phone already in use.", code="phone_exists")
            otp.is_used = True
            otp.save(update_fields=["is_used", "updated_at"])
            from .models import PhoneChangeRequest

            PhoneChangeRequest.objects.filter(user=user, is_used=False).update(is_used=True)
            user.phone_number = new_phone
            user.save(update_fields=["phone_number", "updated_at"])
            from rest_framework_simplejwt.token_blacklist.models import (
                BlacklistedToken,
                OutstandingToken,
            )

            for t in OutstandingToken.objects.select_for_update().filter(user=user):
                BlacklistedToken.objects.get_or_create(token=t)
        return {"message": "Phone changed. Please log in again."}

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
        return {"message": f"User {user.phone_number} deactivated."}

    def activate_user(self, user_id: str, requested_by: User) -> dict:
        user = UserSelector.get_user_by_id(user_id)
        if not user:
            raise BusinessException("User not found.", code="not_found")
        UserRepository.activate_user(user)
        return {"message": f"User {user.phone_number} activated."}

    def admin_update_user(self, user_id: str, data: dict, requested_by: User) -> User:
        user = UserSelector.get_user_by_id(user_id)
        if not user:
            raise BusinessException("User not found.", code="not_found")
        allowed = {"first_name", "last_name", "is_active"}
        update_data = {k: v for k, v in data.items() if k in allowed}

        if user == requested_by and update_data.get("is_active") is False:
            raise BusinessException(
                "You cannot deactivate your own account.",
                code="self_deactivate",
            )
        return UserRepository.update_user(user, **update_data)

    def assign_groups(self, user_id: str, group_ids: list, requested_by: User):
        user = UserSelector.get_user_by_id(user_id)
        if not user:
            raise BusinessException("User not found.")
        from django.contrib.auth.models import Group

        if user == requested_by:
            raise BusinessException("Cannot change your own groups.", code="self_assign")
        groups = Group.objects.filter(id__in=group_ids)
        if groups.count() != len(set(str(g) for g in group_ids)):
            raise BusinessException("One or more groups not found.", code="not_found")
        user.groups.set(groups)
        return {"groups": list(user.groups.values_list("name", flat=True))}
