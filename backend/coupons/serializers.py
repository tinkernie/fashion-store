from rest_framework import serializers


class CouponCreateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    discount_type = serializers.ChoiceField(choices=['percentage', 'fixed'])
    discount_value = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    min_purchase = serializers.DecimalField(max_digits=10, decimal_places=2, default=0, min_value=0, required=False)
    min_order_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    max_uses = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    max_per_user = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    valid_from = serializers.DateTimeField(required=False, allow_null=True)
    valid_until = serializers.DateTimeField(required=False, allow_null=True)
    is_active = serializers.BooleanField(default=True)
    conditions = serializers.JSONField(required=False, default=dict)

    def validate(self, attrs):
        if "min_order_amount" in attrs and attrs["min_order_amount"] is not None:
            attrs["min_purchase"] = attrs.pop("min_order_amount")
        return attrs



class CouponUpdateSerializer(CouponCreateSerializer):
    code = serializers.CharField(max_length=50, required=False)
    discount_type = serializers.ChoiceField(choices=['percentage', 'fixed'], required=False)


class ApplyCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
