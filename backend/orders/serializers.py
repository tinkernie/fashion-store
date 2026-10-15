from rest_framework import serializers
from .models import Order


class CreateOrderSerializer(serializers.Serializer):
    # Either a saved address-book id (new flow) or the legacy raw JSON
    # (current storefront keeps sending this — still accepted as-is).
    address_id = serializers.UUIDField(required=False, allow_null=True)
    shipping_address = serializers.JSONField(required=False)
    billing_address = serializers.JSONField(required=False)
    session_key = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if not attrs.get("address_id") and not attrs.get("shipping_address"):
            raise serializers.ValidationError(
                {"detail": "address_id or shipping_address is required."}
            )
        return attrs


class StatusTransitionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            "pending",
            "awaiting_payment",
            "paid",
            "packing",
            "shipping",
            "delivered",
            "cancelled",
            "returned",
            "refunded",
        ]
    )
    note = serializers.CharField(required=False, allow_blank=True)


class OrderListSerializer(serializers.ModelSerializer):
    items_count = serializers.IntegerField(source="items.count", read_only=True)
    user_id = serializers.UUIDField(source="user.id", read_only=True)
    customer_phone = serializers.CharField(source="user.phone_number", read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "user_id",
            "customer_phone",
            "status",
            "total",
            "placed_at",
            "items_count",
        )

    def get_total(self, obj):
        return int(round(float(obj.total))) if obj.total is not None else 0
