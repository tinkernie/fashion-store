from rest_framework import serializers


class CartAddItemSerializer(serializers.Serializer):
    variant_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class CartUpdateQuantitySerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0)


class CartMergeSerializer(serializers.Serializer):
    session_key = serializers.UUIDField()
