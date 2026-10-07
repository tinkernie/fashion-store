from django.contrib.auth import get_user_model
from django.db.models import QuerySet

User = get_user_model()


class UserSelector:
    @staticmethod
    def get_user_by_id(user_id: str) -> User:
        return User.objects.filter(id=user_id).first()

    @staticmethod
    def get_user_by_phone(phone_number: str) -> User:
        from authentication.validators import PhoneValidator

        try:
            phone_number = PhoneValidator.normalize(phone_number)
        except Exception:
            pass
        return User.objects.filter(phone_number=phone_number).first()

    @staticmethod
    def get_active_users() -> QuerySet[User]:
        return User.objects.filter(is_active=True).select_related()

    @staticmethod
    def list_users(filters: dict = None) -> QuerySet[User]:
        qs = User.objects.all().select_related()
        if filters:
            if "is_active" in filters:
                qs = qs.filter(is_active=filters["is_active"])
            if "search" in filters:
                search = filters["search"]
                if search and len(search) > 100:
                    from common.exceptions import BusinessException

                    raise BusinessException("Search query too long (max 100).")
                qs = (
                    qs.filter(phone_number__icontains=search)
                    | qs.filter(first_name__icontains=search)
                    | qs.filter(last_name__icontains=search)
                )
        return qs
