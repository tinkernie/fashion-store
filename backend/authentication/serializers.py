from rest_framework import serializers
from .services import AuthService
from .validators import PasswordValidator, PhoneValidator


class RegisterSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True)
    # Optional confirmation: enforced only when the client sends it, so the
    # future post-OTP name+password screen can submit password_confirm while
    # older clients sending just password keep working unchanged.
    password_confirm = serializers.CharField(write_only=True, required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    def validate_phone_number(self, value):
        return PhoneValidator.validate(value)

    def validate_password(self, value):
        PasswordValidator.validate(value)
        return value

    def validate(self, attrs):
        confirm = attrs.get("password_confirm")
        if confirm not in (None, "") and confirm != attrs.get("password"):
            raise serializers.ValidationError(
                {"password_confirm": "Password confirmation does not match."}
            )
        attrs.pop("password_confirm", None)
        return attrs

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
    new_password_confirm = serializers.CharField(required=False, allow_blank=True)

    def validate_phone_number(self, value):
        return PhoneValidator.validate(value)

    def validate_new_password(self, value):
        PasswordValidator.validate(value)
        return value

    def validate(self, attrs):
        confirm = attrs.get("new_password_confirm")
        if confirm not in (None, "") and confirm != attrs.get("new_password"):
            raise serializers.ValidationError(
                {"new_password_confirm": "Password confirmation does not match."}
            )
        attrs.pop("new_password_confirm", None)
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=False, allow_blank=True)
    new_password = serializers.CharField()
    new_password_confirm = serializers.CharField(required=False, allow_blank=True)

    def validate_new_password(self, value):
        PasswordValidator.validate(value)
        return value

    def validate(self, attrs):
        confirm = attrs.get("new_password_confirm")
        if confirm not in (None, "") and confirm != attrs.get("new_password"):
            raise serializers.ValidationError(
                {"new_password_confirm": "Password confirmation does not match."}
            )
        attrs.pop("new_password_confirm", None)
        return attrs


class TokenRefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()
