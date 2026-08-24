from rest_framework import serializers


class WishlistAddItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()


class WishlistRemoveItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
