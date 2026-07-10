from rest_framework import serializers

class OptionAssignmentSerializer(serializers.Serializer):
    option_id = serializers.UUIDField()
    value_id = serializers.UUIDField()

class VariantCreateSerializer(serializers.Serializer):
    sku = serializers.CharField(max_length=100)
    barcode = serializers.CharField(max_length=100, required=False, allow_blank=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    weight = serializers.IntegerField(min_value=0)
    dimensions = serializers.JSONField(required=False, default=dict)
    availability = serializers.ChoiceField(choices=['in_stock', 'out_of_stock', 'pre_order'])
    status = serializers.ChoiceField(choices=['draft', 'published', 'discontinued'], default='draft')
    metadata = serializers.JSONField(required=False, default=dict)
    option_values = serializers.ListField(
        child=OptionAssignmentSerializer(),
        allow_empty=False
    )

class VariantUpdateSerializer(serializers.Serializer):
    sku = serializers.CharField(max_length=100, required=False)
    barcode = serializers.CharField(max_length=100, required=False, allow_blank=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    weight = serializers.IntegerField(min_value=0, required=False)
    dimensions = serializers.JSONField(required=False)
    availability = serializers.ChoiceField(choices=['in_stock', 'out_of_stock', 'pre_order'], required=False)
    status = serializers.ChoiceField(choices=['draft', 'published', 'discontinued'], required=False)
    metadata = serializers.JSONField(required=False)
    option_values = serializers.ListField(
        child=OptionAssignmentSerializer(),
        required=False
    )

class VariantDetailSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    product_id = serializers.UUIDField()
    sku = serializers.CharField()
    barcode = serializers.CharField(allow_null=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    weight = serializers.IntegerField()
    dimensions = serializers.JSONField()
    availability = serializers.CharField()
    status = serializers.CharField()
    metadata = serializers.JSONField()
    options = serializers.ListField(child=serializers.DictField())