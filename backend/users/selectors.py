from django.contrib.auth import get_user_model
from django.db.models import QuerySet
from .models import EmailChangeRequest

User = get_user_model()


class UserSelector:
    @staticmethod
    def get_user_by_id(user_id: str) -> User:
        return User.objects.filter(id=user_id).first()

    @staticmethod
    def get_user_by_email(email: str) -> User:
        return User.objects.filter(email__iexact=email).first()

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
                # Group B: prevent DoS via huge search string
                search = filters["search"]
                if search and len(search) > 100:
                    from common.exceptions import BusinessException

                    raise BusinessException("Search query too long (max 100).")
                qs = (
                    qs.filter(email__icontains=search)
                    | qs.filter(first_name__icontains=search)
                    | qs.filter(last_name__icontains=search)
                )
        return qs

    @staticmethod
    def get_email_change_request(token: str) -> EmailChangeRequest:
        return EmailChangeRequest.objects.select_related("user").get(
            token=token, is_used=False
        )
