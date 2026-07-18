from django.db import transaction
from .models import Variant, VariantOption
from common.exceptions import BusinessException


class VariantRepository:
    @staticmethod
    @transaction.atomic
    def create_variant(
        product_id: str, data: dict, option_assignments: list[dict]
    ) -> Variant:
        """
        option_assignments: [{'option_id': ..., 'value_id': ...}, ...]
        """
        variant = Variant.objects.create(product_id=product_id, **data)
        for assignment in option_assignments:
            VariantOption.objects.create(
                variant=variant,
                option_id=assignment["option_id"],
                option_value_id=assignment["value_id"],
            )
        return variant

    @staticmethod
    def update_variant(variant: Variant, fields: dict) -> Variant:
        allowed = {
            "sku",
            "barcode",
            "price",
            "weight",
            "dimensions",
            "availability",
            "status",
            "metadata",
        }
        for key, value in fields.items():
            if key in allowed:
                setattr(variant, key, value)
        variant.save()
        return variant

    @staticmethod
    def delete_variant(variant: Variant):
        variant.delete()  # soft delete

    @staticmethod
    def replace_option_assignments(variant: Variant, assignments: list[dict]):
        with transaction.atomic():
            VariantOption.objects.filter(variant=variant).delete()
            for assignment in assignments:
                VariantOption.objects.create(
                    variant=variant,
                    option_id=assignment["option_id"],
                    option_value_id=assignment["value_id"],
                )
