from django.db import IntegrityError
from .repositories import VariantRepository
from .selectors import VariantSelector
from .models import Variant
from common.exceptions import BusinessException
from product_options.selectors import ProductOptionSelector


class VariantService:
    def create_variant(self, product_id: str, data: dict) -> dict:
        # Options are fully free-form: a variant may combine any subset of
        # the product's defined options (all of them, only color, color +
        # size, none at all, ...). No combination is mandatory.
        option_assignments = data.pop("option_values", []) or []
        if option_assignments:
            self._validate_option_assignments(option_assignments, product_id=product_id)

        try:
            variant = VariantRepository.create_variant(
                product_id, data, option_assignments
            )
        except IntegrityError as e:
            if "unique" in str(e).lower():
                raise BusinessException("SKU or barcode already exists.")
            raise
        return self._serialize_variant(variant)

    def update_variant(self, variant_id: str, data: dict) -> dict:
        variant = VariantSelector.get_variant_by_id(variant_id)
        if not variant:
            raise BusinessException("Variant not found.")

        option_assignments = data.pop("option_values", None)
        # Update scalar fields
        updated = VariantRepository.update_variant(variant, data)

        if option_assignments is not None:
            self._validate_option_assignments(option_assignments, product_id=str(updated.product_id))
            VariantRepository.replace_option_assignments(updated, option_assignments)
            updated.refresh_from_db()  # to reload prefetched M2M

        return self._serialize_variant(updated)

    def delete_variant(self, variant_id: str) -> dict:
        variant = VariantSelector.get_variant_by_id(variant_id)
        if not variant:
            raise BusinessException("Variant not found.")
        VariantRepository.delete_variant(variant)
        return {"message": f"Variant {variant.sku} deleted."}

    def _validate_option_assignments(self, assignments: list[dict], product_id: str = None):
        """Free-form validation: every assignment must reference an existing
        option of THIS product with a value belonging to that option, and no
        option may repeat within one variant. Any subset (or none) is allowed.
        """
        seen_options = set()
        for item in assignments:
            option = ProductOptionSelector.get_option_by_id(item["option_id"])
            if not option:
                raise BusinessException(f"Option {item['option_id']} not found.")
            if product_id and str(option.product_id) != str(product_id):
                raise BusinessException(
                    f"Option '{option.name}' does not belong to this product."
                )
            if str(option.id) in seen_options:
                raise BusinessException(
                    f"Option '{option.name}' is assigned more than once."
                )
            seen_options.add(str(option.id))
            # Check value exists and belongs to that option
            from product_options.selectors import OptionValueSelector

            value = OptionValueSelector.get_value_by_id(item["value_id"])
            if not value or str(value.option_id) != str(option.id):
                raise BusinessException(
                    f"Value {item['value_id']} does not belong to option {item['option_id']}."
                )

    def _serialize_variant(self, variant: Variant) -> dict:
        return {
            "id": str(variant.id),
            "product_id": str(variant.product_id),
            "sku": variant.sku,
            "barcode": variant.barcode,
            "price": str(variant.price),
            "weight": variant.weight,
            "dimensions": variant.dimensions,
            "availability": variant.availability,
            "status": variant.status,
            "metadata": variant.metadata,
            "options": [
                {
                    "option_id": str(vo.option_id),
                    "option_name": vo.option.name,
                    "value_id": str(vo.option_value_id),
                    "value": vo.option_value.value,
                }
                for vo in variant.variantoption_set.all()
            ],
        }
