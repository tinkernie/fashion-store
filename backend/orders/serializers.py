from rest_framework import serializers
from .models import Order


class CreateOrderSerializer(serializers.Serializer):
    shipping_address = serializers.JSONField()
    billing_address = serializers.JSONField(required=False)
    session_key = serializers.CharField(required=False, allow_blank=True)


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

    class Meta:
        model = Order
        fields = ("id", "order_number", "status", "total", "placed_at", "items_count")
