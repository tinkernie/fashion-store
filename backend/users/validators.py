from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from common.exceptions import BusinessException

User = get_user_model()

class UserValidator:
    MAX_NAME_LENGTH = 150

    @staticmethod
    def validate_name(name: str, field_name: str = 'name'):
        if len(name) > UserValidator.MAX_NAME_LENGTH:
            raise ValidationError(f"{field_name} must be {UserValidator.MAX_NAME_LENGTH} characters or fewer.")

    @classmethod
    def validate_email_unique(cls, email: str, exclude_user_id=None):
        queryset = User.objects.filter(email__iexact=email)
        if exclude_user_id:
            queryset = queryset.exclude(id=exclude_user_id)
        if queryset.exists():
            raise BusinessException("A user with this email already exists.", code="email_exists")