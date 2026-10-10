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
        self._ensure_unique_combination(product_id, option_assignments)

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
        try:
            updated = VariantRepository.update_variant(variant, data)
        except IntegrityError:
            raise BusinessException("SKU or barcode already exists.")

        if option_assignments is not None:
            self._validate_option_assignments(option_assignments, product_id=str(updated.product_id))
            self._ensure_unique_combination(
                str(updated.product_id), option_assignments,
                exclude_variant_id=str(updated.id),
            )
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

    @staticmethod
    def _combination_signature(assignments: list[dict]) -> tuple:
        """Canonical form of an option set: sorted (option_id, value_id)
        pairs, so order-independent comparison is possible."""
        return tuple(
            sorted(
                (str(a["option_id"]), str(a["value_id"])) for a in assignments
            )
        )

    def _ensure_unique_combination(
        self, product_id: str, assignments: list, exclude_variant_id: str = None
    ) -> None:
        """Reject a variant whose exact option set already exists on another
        active variant of the same product (e.g. red+fabric+size2 twice).
        Soft-deleted variants don't count. Empty sets count too: two plain
        variants of one product are indistinguishable on the storefront.
        """
        from .models import VariantOption

        signature = self._combination_signature(assignments or [])
        qs = VariantOption.objects.filter(
            variant__product_id=product_id,
            variant__deleted_at__isnull=True,
        )
        if exclude_variant_id:
            qs = qs.exclude(variant_id=exclude_variant_id)
        rows = qs.values(
            "variant_id", "variant__sku", "option_id", "option_value_id"
        )
        by_variant: dict = {}
        for r in rows:
            by_variant.setdefault((str(r["variant_id"]), r["variant__sku"]), []).append(
                (str(r["option_id"]), str(r["option_value_id"]))
            )
        for (vid, sku), pairs in by_variant.items():
            if tuple(sorted(pairs)) == signature:
                raise BusinessException(
                    "A variant with these exact options already exists "
                    f"(SKU {sku}). Change the options or edit that variant."
                )
        # Variants with zero assignments have no VariantOption rows; compare
        # against other assignment-less active variants explicitly.
        if not signature:
            qs = Variant.objects.filter(
                product_id=product_id, deleted_at__isnull=True
            )
            if exclude_variant_id:
                qs = qs.exclude(id=exclude_variant_id)
            other_plain = (
                qs.filter(variantoption__isnull=True)
                .values_list("sku", flat=True)
                .first()
            )
            if other_plain:
                raise BusinessException(
                    "A variant with these exact options already exists "
                    f"(SKU {other_plain}). Change the options or edit that variant."
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
