from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserProfileSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    phone_number = serializers.CharField(read_only=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    is_active = serializers.BooleanField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
    date_joined = serializers.DateTimeField(read_only=True)


class UpdateProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=False)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=False)

    def validate_first_name(self, value):
        from .validators import UserValidator

        UserValidator.validate_name(value, field_name="first_name")
        return value.strip()

    def validate_last_name(self, value):
        from .validators import UserValidator

        UserValidator.validate_name(value, field_name="last_name")
        return value.strip()


class ChangePhoneSerializer(serializers.Serializer):
    new_phone = serializers.CharField()
    password = serializers.CharField(required=False, allow_blank=True)

    def validate_new_phone(self, value):
        from authentication.validators import PhoneValidator

        return PhoneValidator.validate(value)


class ConfirmPhoneSerializer(serializers.Serializer):
    new_phone = serializers.CharField()
    code = serializers.CharField(min_length=4, max_length=8)

    def validate_new_phone(self, value):
        from authentication.validators import PhoneValidator

        return PhoneValidator.validate(value)


class AdminUserSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    phone_number = serializers.CharField()
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)
    date_joined = serializers.DateTimeField(read_only=True)
    groups = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    orders_count = serializers.SerializerMethodField()

    def get_groups(self, obj):
        return list(obj.groups.values_list("name", flat=True))

    def get_total_spent(self, obj):
        from orders.models import Order
        from django.db.models import Sum

        active_statuses = [
            Order.Status.PAID,
            Order.Status.PACKING,
            Order.Status.SHIPPING,
            Order.Status.DELIVERED,
        ]
        agg = Order.objects.filter(user=obj, status__in=active_statuses).aggregate(
            total=Sum("total")
        )
        total = agg["total"] or 0
        try:
            return format(total, ".2f")
        except Exception:
            return "0.00"

    def get_orders_count(self, obj):
        from orders.models import Order

        return Order.objects.filter(user=obj).count()


class AdminUserUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)


class AssignGroupsSerializer(serializers.Serializer):
    group_ids = serializers.ListField(child=serializers.IntegerField())
