from django.contrib.auth import get_user_model
from .models import EmailVerificationToken

User = get_user_model()


class UserSelector:
    @staticmethod
    def get_user_by_email(email: str) -> User:
        return User.objects.filter(email__iexact=email).first()

    @staticmethod
    def get_user_by_id(user_id) -> User:
        return User.objects.filter(id=user_id).first()


class TokenSelector:
    @staticmethod
    def get_verification_token(token: str) -> EmailVerificationToken:
        return EmailVerificationToken.objects.select_related("user").get(token=token)
