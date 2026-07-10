from django.db import IntegrityError
from .repositories import VariantRepository
from .selectors import VariantSelector
from .models import Variant
from common.exceptions import BusinessException
from product_options.selectors import ProductOptionSelector

class VariantService:
    def create_variant(self, product_id: str, data: dict) -> dict:
        # Validate that option assignments are provided and values belong to the correct option
        option_assignments = data.pop('option_values', [])
        if not option_assignments:
            raise BusinessException("At least one option value must be provided.")
        self._validate_option_assignments(option_assignments)

        try:
            variant = VariantRepository.create_variant(product_id, data, option_assignments)
        except IntegrityError as e:
            if 'unique' in str(e).lower():
                raise BusinessException("SKU or barcode already exists.")
            raise
        return self._serialize_variant(variant)

    def update_variant(self, variant_id: str, data: dict) -> dict:
        variant = VariantSelector.get_variant_by_id(variant_id)
        if not variant:
            raise BusinessException("Variant not found.")

        option_assignments = data.pop('option_values', None)
        # Update scalar fields
        updated = VariantRepository.update_variant(variant, data)

        if option_assignments is not None:
            self._validate_option_assignments(option_assignments)
            VariantRepository.replace_option_assignments(updated, option_assignments)
            updated.refresh_from_db()  # to reload prefetched M2M

        return self._serialize_variant(updated)

    def delete_variant(self, variant_id: str) -> dict:
        variant = VariantSelector.get_variant_by_id(variant_id)
        if not variant:
            raise BusinessException("Variant not found.")
        VariantRepository.delete_variant(variant)
        return {"message": f"Variant {variant.sku} deleted."}

    def _validate_option_assignments(self, assignments: list[dict]):
        """Ensure each assignment has a valid option_id and value_id, and the value belongs to the option."""
        for item in assignments:
            option = ProductOptionSelector.get_option_by_id(item['option_id'])
            if not option:
                raise BusinessException(f"Option {item['option_id']} not found.")
            # Check value exists and belongs to that option
            from product_options.selectors import OptionValueSelector
            value = OptionValueSelector.get_value_by_id(item['value_id'])
            if not value or str(value.option_id) != str(option.id):
                raise BusinessException(f"Value {item['value_id']} does not belong to option {item['option_id']}.")

    def _serialize_variant(self, variant: Variant) -> dict:
        return {
            'id': str(variant.id),
            'product_id': str(variant.product_id),
            'sku': variant.sku,
            'barcode': variant.barcode,
            'price': str(variant.price),
            'weight': variant.weight,
            'dimensions': variant.dimensions,
            'availability': variant.availability,
            'status': variant.status,
            'metadata': variant.metadata,
            'options': [
                {
                    'option_id': str(vo.option_id),
                    'option_name': vo.option.name,
                    'value_id': str(vo.option_value_id),
                    'value': vo.option_value.value,
                }
                for vo in variant.variantoption_set.all()
            ],
        }