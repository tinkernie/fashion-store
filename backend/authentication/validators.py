import re
from django.core.exceptions import ValidationError

from common.exceptions import BusinessException


class PasswordValidator:
    MIN_LENGTH = 10
    MAX_LENGTH = 128

    @staticmethod
    def validate(password: str):
        if len(password) < PasswordValidator.MIN_LENGTH:
            raise ValidationError(
                f"Password must be at least {PasswordValidator.MIN_LENGTH} characters."
            )
        if len(password) > PasswordValidator.MAX_LENGTH:
            raise ValidationError(
                f"Password must be no more than {PasswordValidator.MAX_LENGTH} characters."
            )
        if not re.search(r"[A-Z]", password):
            raise ValidationError(
                "Password must contain at least one uppercase letter."
            )
        if not re.search(r"[a-z]", password):
            raise ValidationError(
                "Password must contain at least one lowercase letter."
            )
        if not re.search(r"\d", password):
            raise ValidationError("Password must contain at least one digit.")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError(
                "Password must contain at least one special character."
            )


class PhoneValidator:
    @staticmethod
    def normalize(phone: str) -> str:
        phone = (phone or "").strip().replace(" ", "").replace("-", "")
        if phone.startswith("+98"):
            phone = "0" + phone[3:]
        elif phone.startswith("98") and len(phone) == 12:
            phone = "0" + phone[2:]
        return phone

    @classmethod
    def validate(cls, phone: str) -> str:
        normalized = cls.normalize(phone)
        if not re.match(r"^09\d{9}$", normalized):
            raise BusinessException(
                "Phone number must be Iranian mobile like 09123456789.",
                code="invalid_phone",
            )
        return normalized
