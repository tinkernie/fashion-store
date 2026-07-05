import re
from django.core.exceptions import ValidationError

class PasswordValidator:
    MIN_LENGTH = 10
    MAX_LENGTH = 128

    @staticmethod
    def validate(password: str):
        if len(password) < PasswordValidator.MIN_LENGTH:
            raise ValidationError(f"Password must be at least {PasswordValidator.MIN_LENGTH} characters.")
        if len(password) > PasswordValidator.MAX_LENGTH:
            raise ValidationError(f"Password must be no more than {PasswordValidator.MAX_LENGTH} characters.")
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r'[a-z]', password):
            raise ValidationError("Password must contain at least one lowercase letter.")
        if not re.search(r'\d', password):
            raise ValidationError("Password must contain at least one digit.")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError("Password must contain at least one special character.")