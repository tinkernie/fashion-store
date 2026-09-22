from django.db import IntegrityError
from .repositories import VariantRepository
from .selectors import VariantSelector
from .models import Variant
from common.exceptions import BusinessException
from product_options.selectors import ProductOptionSelector


class VariantService:
    def create_variant(self, product_id: str, data: dict) -> dict:
        # Validate that option assignments are provided and values belong to the correct option
        option_assignments = data.pop("option_values", [])
        if not option_assignments:
            raise BusinessException("At least one option value must be provided.")
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
        """Ensure each assignment has a valid option_id and value_id, and the value belongs to the option."""
        for item in assignments:
            option = ProductOptionSelector.get_option_by_id(item["option_id"])
            if not option:
                raise BusinessException(f"Option {item['option_id']} not found.")
            # Check value exists and belongs to that option
            from product_options.selectors import OptionValueSelector

            value = OptionValueSelector.get_value_by_id(item["value_id"])
            if not value or str(value.option_id) != str(option.id):
                raise BusinessException(
                    f"Value {item['value_id']} does not belong to option {item['option_id']}."
                )

        # Clothing variant integrity per BACKEND_PRODUCT_FILTERS_SPEC: ensure Color, Size, Material not empty when defined
        if product_id:
            try:
                from products.models import Product
                from product_options.models import ProductOption

                product = Product.objects.filter(id=product_id).first()
                if product:
                    # Get product's defined option names
                    product_option_names = list(
                        ProductOption.objects.filter(product=product).values_list("name", flat=True)
                    )
                    normalized_names = [str(n).strip().lower() for n in product_option_names if n]

                    # Determine which required attributes are defined for this product
                    has_color_def = any("رنگ" in n or "color" in n for n in normalized_names)
                    has_size_def = any("سایز" in n or "size" in n for n in normalized_names)
                    has_material_def = any("جنس" in n or "متریال" in n or "material" in n for n in normalized_names)

                    # If none of the clothing attributes are defined, skip strict check (non-clothing product)
                    if has_color_def or has_size_def or has_material_def:
                        # Collect assignment option names
                        assignment_names = []
                        for item in assignments:
                            opt = ProductOptionSelector.get_option_by_id(item["option_id"])
                            if opt and opt.name:
                                assignment_names.append(opt.name.strip().lower())

                        has_color = any("رنگ" in n or "color" in n for n in assignment_names)
                        has_size = any("سایز" in n or "size" in n for n in assignment_names)
                        has_material = any("جنس" in n or "متریال" in n or "material" in n for n in assignment_names)

                        missing = []
                        if has_color_def and not has_color:
                            missing.append("رنگ")
                        if has_size_def and not has_size:
                            missing.append("سایز")
                        if has_material_def and not has_material:
                            missing.append("جنس")

                        if missing:
                            raise BusinessException(
                                f"فیلدهای {', '.join(missing)} نباید خالی باشند. حداقل یک مقدار برای هرکدام باید وارد شود."
                            )
            except BusinessException:
                raise
            except Exception:
                pass

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
