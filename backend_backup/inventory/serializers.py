from rest_framework import serializers


class InventorySerializer(serializers.Serializer):
    variant_id = serializers.UUIDField()
    available_quantity = serializers.IntegerField()
    reserved_quantity = serializers.IntegerField(read_only=True)
    safety_stock = serializers.IntegerField()
    status = serializers.CharField(read_only=True)
    reservation_expiration_minutes = serializers.IntegerField()


class AdjustStockSerializer(serializers.Serializer):
    delta = serializers.IntegerField()  # positive to add, negative to remove


class SafetyStockSerializer(serializers.Serializer):
    safety_stock = serializers.IntegerField(min_value=0)


class ReservationExpirationSerializer(serializers.Serializer):
    minutes = serializers.IntegerField(min_value=1)
