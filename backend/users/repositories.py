from django.contrib.auth import get_user_model

User = get_user_model()


class UserRepository:
    @staticmethod
    def update_user(user: User, **fields) -> User:
        allowed_fields = {"first_name", "last_name", "is_active"}
        update_fields = {k: v for k, v in fields.items() if k in allowed_fields}
        for attr, value in update_fields.items():
            setattr(user, attr, value)
        user.save(update_fields=list(update_fields.keys()) + ["updated_at"])
        return user

    @staticmethod
    def deactivate_user(user: User):
        user.is_active = False
        user.save(update_fields=["is_active", "updated_at"])
        from rest_framework_simplejwt.token_blacklist.models import (
            BlacklistedToken,
            OutstandingToken,
        )

        for token in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token)

    @staticmethod
    def activate_user(user: User):
        user.is_active = True
        user.save(update_fields=["is_active", "updated_at"])
