import re
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from common.exceptions import BusinessException

User = get_user_model()


class UserValidator:
    MAX_NAME_LENGTH = 150

    @staticmethod
    def validate_name(name: str, field_name: str = "name"):
        if name is None:
            raise BusinessException(f"{field_name} is required.")
        stripped = name.strip()
        if not stripped:
            raise BusinessException(f"{field_name} cannot be blank or whitespace.")
        if len(stripped) > UserValidator.MAX_NAME_LENGTH:
            raise ValidationError(
                f"{field_name} must be {UserValidator.MAX_NAME_LENGTH} characters or fewer."
            )
        if not re.match(r"^[\w\s\-\'\u0600-\u06FF]+$", stripped):
            raise BusinessException(f"{field_name} contains invalid characters.")
        if "<" in stripped or ">" in stripped:
            raise BusinessException(f"{field_name} contains invalid characters.")

    @classmethod
    def validate_phone_unique(cls, phone_number: str, exclude_user_id=None):
        queryset = User.objects.filter(phone_number=phone_number)
        if exclude_user_id:
            queryset = queryset.exclude(id=exclude_user_id)
        if queryset.exists():
            raise BusinessException(
                "A user with this phone already exists.", code="phone_exists"
            )


class JalaliDateValidator:
    """Parse + validate a Solar Hijri (Jalali) date from a `YYYY/MM/DD`
    string (also accepts `-` separators, Persian digits are translated).

    Returns (year, month, day) ints. Persian year range 1300-1500 keeps
    the 33-year leap table exact; month lengths: 1-6 -> 31, 7-11 -> 30,
    12 -> 29 (30 in leap years).
    """

    MIN_YEAR = 1300
    MAX_YEAR = 1500
    # Leap-year remainders in the standard 33-year (kabiseh) cycle.
    LEAP_REMAINDERS = {1, 5, 9, 13, 17, 22, 26, 30}

    _PERSIAN_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")

    @classmethod
    def is_leap(cls, jalali_year: int) -> bool:
        return (jalali_year % 33) in cls.LEAP_REMAINDERS

    @classmethod
    def days_in_month(cls, jalali_year: int, month: int) -> int:
        if 1 <= month <= 6:
            return 31
        if 7 <= month <= 11:
            return 30
        return 30 if cls.is_leap(jalali_year) else 29

    @classmethod
    def validate(cls, value: str) -> tuple:
        if value is None:
            raise BusinessException("Birth date is required.")
        raw = str(value).strip().translate(cls._PERSIAN_DIGITS)
        parts = re.split(r"[/\-.]", raw)
        if len(parts) != 3 or not all(part.isdigit() for part in parts):
            raise BusinessException(
                "Birth date must be in Solar Hijri YYYY/MM/DD format.", code="invalid_birth_date"
            )
        year, month, day = (int(part) for part in parts)
        if not (cls.MIN_YEAR <= year <= cls.MAX_YEAR):
            raise BusinessException(
                f"Birth year must be between {cls.MIN_YEAR} and {cls.MAX_YEAR}.",
                code="invalid_birth_date",
            )
        if not (1 <= month <= 12):
            raise BusinessException(
                "Birth date month must be between 1 and 12.", code="invalid_birth_date"
            )
        if not (1 <= day <= cls.days_in_month(year, month)):
            raise BusinessException(
                "Birth date day is out of range.", code="invalid_birth_date"
            )
        return year, month, day

    @classmethod
    def format_jalali(cls, year: int, month: int, day: int) -> str:
        return f"{year:04d}/{month:02d}/{day:02d}"
