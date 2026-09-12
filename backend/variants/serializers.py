from rest_framework import serializers
from .models import Variant


class OptionAssignmentSerializer(serializers.Serializer):
    option_id = serializers.UUIDField()
    value_id = serializers.UUIDField()


class VariantCreateSerializer(serializers.Serializer):
    sku = serializers.CharField(max_length=100)
    barcode = serializers.CharField(max_length=100, required=False, allow_blank=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    weight = serializers.IntegerField(min_value=0)
    dimensions = serializers.JSONField(required=False, default=dict)
    availability = serializers.ChoiceField(
        choices=["in_stock", "out_of_stock", "pre_order"]
    )
    status = serializers.ChoiceField(
        choices=["draft", "published", "discontinued"], default="draft"
    )
    metadata = serializers.JSONField(required=False, default=dict)
    option_values = serializers.ListField(
        child=OptionAssignmentSerializer(), allow_empty=False
    )


class VariantUpdateSerializer(serializers.Serializer):
    sku = serializers.CharField(max_length=100, required=False)
    barcode = serializers.CharField(max_length=100, required=False, allow_blank=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    weight = serializers.IntegerField(min_value=0, required=False)
    dimensions = serializers.JSONField(required=False)
    availability = serializers.ChoiceField(
        choices=["in_stock", "out_of_stock", "pre_order"], required=False
    )
    status = serializers.ChoiceField(
        choices=["draft", "published", "discontinued"], required=False
    )
    metadata = serializers.JSONField(required=False)
    option_values = serializers.ListField(
        child=OptionAssignmentSerializer(), required=False
    )


class VariantDetailSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()
    inventory = serializers.SerializerMethodField()
    stock = serializers.SerializerMethodField()

    class Meta:
        model = Variant
        fields = (
            "id", "product_id", "sku", "barcode", "price", "weight",
            "dimensions", "availability", "status", "metadata", "options",
            "inventory", "stock",
        )

    def get_price(self, variant):
        return int(round(float(variant.price))) if variant.price is not None else 0

    def get_options(self, variant):
        return [
            {
                "option_id": str(item.option_id),
                "option_name": item.option.name,
                "value_id": str(item.option_value_id),
                "value": item.option_value.value,
            }
            for item in variant.variantoption_set.select_related(
                "option", "option_value"
            )
        ]

    def get_inventory(self, variant):
        if hasattr(variant, "inventory") and variant.inventory:
            return {
                "available_quantity": variant.inventory.available_quantity,
                "safety_stock": variant.inventory.safety_stock,
                "status": variant.inventory.status,
            }
        return None

    def get_stock(self, variant):
        if hasattr(variant, "inventory") and variant.inventory:
            return variant.inventory.available_quantity
        return 0

# class VariantDetailSerializer(serializers.Serializer):
#     id = serializers.UUIDField(read_only=True)
#     product_id = serializers.UUIDField()
#     sku = serializers.CharField()
#     barcode = serializers.CharField(allow_null=True)
#     price = serializers.DecimalField(max_digits=10, decimal_places=2)
#     weight = serializers.IntegerField()
#     dimensions = serializers.JSONField()
#     availability = serializers.CharField()
#     status = serializers.CharField()
#     metadata = serializers.JSONField()
#     options = serializers.ListField(child=serializers.DictField())
