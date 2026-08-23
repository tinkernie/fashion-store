import pytest
from django.core.exceptions import ValidationError
from authentication.validators import PasswordValidator


def test_valid_password():
    PasswordValidator.validate("ValidPass1!")  # no exception


def test_short_password():
    with pytest.raises(ValidationError):
        PasswordValidator.validate("Ab1!")


def test_missing_uppercase():
    with pytest.raises(ValidationError):
        PasswordValidator.validate("validpass1!")


def test_missing_digit():
    with pytest.raises(ValidationError):
        PasswordValidator.validate("ValidPass!")
