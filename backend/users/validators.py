from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from common.exceptions import BusinessException

User = get_user_model()


class UserValidator:
    MAX_NAME_LENGTH = 150

    @staticmethod
    def validate_name(name: str, field_name: str = "name"):
        # Group B: strip, disallow blank, XSS regex
        if name is None:
            raise BusinessException(f"{field_name} is required.")
        stripped = name.strip()
        if not stripped:
            raise BusinessException(f"{field_name} cannot be blank or whitespace.")
        if len(stripped) > UserValidator.MAX_NAME_LENGTH:
            raise ValidationError(
                f"{field_name} must be {UserValidator.MAX_NAME_LENGTH} characters or fewer."
            )
        # Allow Persian/Arabic + Latin letters, spaces, hyphen, apostrophe
        import re

        if not re.match(r"^[\w\s\-\'\u0600-\u06FF]+$", stripped):
            raise BusinessException(f"{field_name} contains invalid characters.")
        # Also prevent script tags
        if "<" in stripped or ">" in stripped:
            raise BusinessException(f"{field_name} contains invalid characters.")

    @classmethod
    def validate_email_unique(cls, email: str, exclude_user_id=None):
        queryset = User.objects.filter(email__iexact=email)
        if exclude_user_id:
            queryset = queryset.exclude(id=exclude_user_id)
        if queryset.exists():
            raise BusinessException(
                "A user with this email already exists.", code="email_exists"
            )
