from django.contrib.auth import get_user_model
from .models import EmailVerificationToken

User = get_user_model()


class UserRepository:
    @staticmethod
    def create_user(
        email: str,
        password: str,
        first_name: str = "",
        last_name: str = "",
        is_active: bool = False,
    ) -> User:
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_active=is_active,
        )
        return user

    @staticmethod
    def mark_email_verified(user: User):
        user.is_active = True
        user.save(update_fields=["is_active", "updated_at"])

    @staticmethod
    def change_password(user: User, new_password: str):
        user.set_password(new_password)
        user.save(update_fields=["password", "updated_at"])


class TokenRepository:
    @staticmethod
    def create_verification_token(user: User) -> EmailVerificationToken:
        return EmailVerificationToken.objects.create(user=user)

    @staticmethod
    def get_verification_token(token: str) -> EmailVerificationToken:
        return EmailVerificationToken.objects.get(token=token)
