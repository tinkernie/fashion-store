from django.contrib.auth import get_user_model
from .models import EmailChangeRequest

User = get_user_model()


class UserRepository:
    @staticmethod
    def update_user(user: User, **fields) -> User:
        allowed_fields = {"first_name", "last_name", "email", "is_active"}
        update_fields = {k: v for k, v in fields.items() if k in allowed_fields}
        for attr, value in update_fields.items():
            setattr(user, attr, value)
        user.save(update_fields=list(update_fields.keys()) + ["updated_at"])
        return user

    @staticmethod
    def deactivate_user(user: User):
        user.is_active = False
        user.save(update_fields=["is_active", "updated_at"])
        # Blacklist all tokens for immediate session invalidation
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

        for token in OutstandingToken.objects.filter(user=user):
            token.blacklist()

    @staticmethod
    def activate_user(user: User):
        user.is_active = True
        user.save(update_fields=["is_active", "updated_at"])

    @staticmethod
    def create_email_change_request(user: User, new_email: str) -> EmailChangeRequest:
        return EmailChangeRequest.objects.create(user=user, new_email=new_email)

    @staticmethod
    def mark_email_change_used(token: EmailChangeRequest):
        token.is_used = True
        token.save(update_fields=["is_used", "updated_at"])
