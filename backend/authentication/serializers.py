from rest_framework import serializers
from .services import AuthService
from .validators import PasswordValidator, PhoneValidator


class RegisterSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    def validate_phone_number(self, value):
        return PhoneValidator.validate(value)

    def validate_password(self, value):
        PasswordValidator.validate(value)
        return value

    def create(self, validated_data):
        service = AuthService()
        return service.register_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField()

    def validate_phone_number(self, value):
        return PhoneValidator.validate(value)


class OtpRequestSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    purpose = serializers.ChoiceField(choices=["login", "reset"], default="login", required=False)

    def validate_phone_number(self, value):
        return PhoneValidator.validate(value)


class OtpVerifySerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    code = serializers.CharField(min_length=4, max_length=8)
    purpose = serializers.ChoiceField(choices=["login", "reset"], default="login", required=False)

    def validate_phone_number(self, value):
        return PhoneValidator.validate(value)


class PasswordResetViaOtpSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    code = serializers.CharField(min_length=4, max_length=8)
    new_password = serializers.CharField()

    def validate_phone_number(self, value):
        return PhoneValidator.validate(value)

    def validate_new_password(self, value):
        PasswordValidator.validate(value)
        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=False, allow_blank=True)
    new_password = serializers.CharField()

    def validate_new_password(self, value):
        PasswordValidator.validate(value)
        return value


class TokenRefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()
