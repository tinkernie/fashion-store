from rest_framework import serializers

class ProductOptionSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField(max_length=100)
    display_order = serializers.IntegerField(default=0)

class OptionValueSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    option_id = serializers.UUIDField(read_only=True, source='option.id')
    value = serializers.CharField(max_length=200)
    display_order = serializers.IntegerField(default=0)

class ProductOptionDetailSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField()
    display_order = serializers.IntegerField()
    values = OptionValueSerializer(many=True, read_only=True, source='values.all')