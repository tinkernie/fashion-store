from rest_framework import serializers


class CreateOrderSerializer(serializers.Serializer):
    shipping_address = serializers.JSONField()
    billing_address = serializers.JSONField(required=False)


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


class OrderListSerializer(serializers.Serializer):
    order_number = serializers.CharField()
    status = serializers.CharField()
    total = serializers.DecimalField(max_digits=10, decimal_places=2)
    placed_at = serializers.DateTimeField()
    items_count = serializers.IntegerField(source="items.count")
