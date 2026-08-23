from django.db.models import Prefetch
from .models import Variant, VariantOption


class VariantSelector:
    @staticmethod
    def get_visible_variants_for_product(product_id: str) -> list[Variant]:
        return (
            Variant.objects.filter(
                product_id=product_id,
                status=Variant.Status.PUBLISHED,
                deleted_at__isnull=True,
                product__deleted_at__isnull=True,
            )
            .prefetch_related(
                Prefetch(
                    "variantoption_set",
                    queryset=VariantOption.objects.select_related(
                        "option", "option_value"
                    ),
                )
            )
            .order_by("-created_at")
        )

    @staticmethod
    def get_variant_by_sku(sku: str) -> Variant or None:
        return (
            Variant.objects.filter(
                sku=sku,
                status=Variant.Status.PUBLISHED,
                deleted_at__isnull=True,
            )
            .prefetch_related(
                "variantoption_set__option", "variantoption_set__option_value"
            )
            .first()
        )

    @staticmethod
    def get_variant_by_id(variant_id: str) -> Variant or None:
        return (
            Variant.objects.filter(
                id=variant_id,
                deleted_at__isnull=True,
            )
            .prefetch_related(
                "variantoption_set__option", "variantoption_set__option_value"
            )
            .first()
        )

    @staticmethod
    def get_all_variants_admin(
        product_id: str = None, filters: dict = None
    ) -> list[Variant]:
        qs = Variant.objects.filter(deleted_at__isnull=True).prefetch_related(
            "variantoption_set__option", "variantoption_set__option_value"
        )
        if product_id:
            qs = qs.filter(product_id=product_id)
        if filters:
            if "status" in filters:
                qs = qs.filter(status=filters["status"])
            if "availability" in filters:
                qs = qs.filter(availability=filters["availability"])
        return qs
