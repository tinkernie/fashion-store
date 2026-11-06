from rest_framework import serializers
from .models import Order


class CreateOrderSerializer(serializers.Serializer):
    # Either a saved address-book id (new flow) or the legacy raw JSON
    # (current storefront keeps sending this — still accepted as-is).
    address_id = serializers.UUIDField(required=False, allow_null=True)
    shipping_address = serializers.JSONField(required=False)
    billing_address = serializers.JSONField(required=False)
    shipping_method = serializers.ChoiceField(
        choices=["pishtaz", "pickup", "vizheh"], required=False, default="pishtaz"
    )
    session_key = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        method = attrs.get("shipping_method", "pishtaz")
        if method != "pickup" and not attrs.get("address_id") and not attrs.get("shipping_address"):
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
    customer_name = serializers.SerializerMethodField()
    customer_phone = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    shipping_address = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "user_id",
            "customer_name",
            "customer_phone",
            "customer_email",
            "shipping_address",
            "status",
            "total",
            "shipping_method",
            "placed_at",
            "items_count",
        )

    def get_customer_name(self, obj):
        addr = obj.shipping_address if isinstance(obj.shipping_address, dict) else {}
        if addr.get("full_name"):
            return addr["full_name"]
        if obj.user:
            fn = f"{getattr(obj.user, 'first_name', '')} {getattr(obj.user, 'last_name', '')}".strip()
            if fn:
                return fn
        if getattr(obj, "address", None) and obj.address.recipient_name:
            return obj.address.recipient_name
        return "کاربر سایت"

    def get_customer_phone(self, obj):
        addr = obj.shipping_address if isinstance(obj.shipping_address, dict) else {}
        if addr.get("phone"):
            return addr["phone"]
        if obj.user and getattr(obj.user, "phone_number", None):
            return obj.user.phone_number
        if getattr(obj, "address", None) and obj.address.recipient_phone:
            return obj.address.recipient_phone
        return ""

    def get_customer_email(self, obj):
        if obj.user and getattr(obj.user, "email", None):
            return obj.user.email
        return ""

    def get_shipping_address(self, obj):
        addr = dict(obj.shipping_address) if isinstance(obj.shipping_address, dict) else {}
        if not addr.get("full_name"):
            addr["full_name"] = self.get_customer_name(obj)
        if not addr.get("phone"):
            addr["phone"] = self.get_customer_phone(obj)
        if not addr.get("address"):
            linked = getattr(obj, "address", None)
            if not linked and obj.user:
                try:
                    linked = obj.user.addresses.filter(is_default=True).first() or obj.user.addresses.first()
                except Exception:
                    linked = None
            if linked:
                addr.setdefault("province", linked.province_name)
                addr.setdefault("city", linked.city_name)
                addr.setdefault("address", f"{linked.street} {linked.building_no}".strip())
                addr.setdefault("postal_code", linked.postal_code)
        return addr

    def get_total(self, obj):
        return int(round(float(obj.total))) if obj.total is not None else 0
