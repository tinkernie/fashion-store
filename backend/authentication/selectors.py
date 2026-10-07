from django.contrib.auth import get_user_model

User = get_user_model()


class UserSelector:
    @staticmethod
    def get_user_by_phone(phone_number: str) -> User:
        from .validators import PhoneValidator

        try:
            normalized = PhoneValidator.normalize(phone_number)
        except Exception:
            normalized = phone_number
        return User.objects.filter(phone_number=normalized).first()

    @staticmethod
    def get_user_by_id(user_id) -> User:
        return User.objects.filter(id=user_id).first()
