from .models import ProductOption, OptionValue


class ProductOptionSelector:
    @staticmethod
    def get_options_for_product(product_id: str) -> list[ProductOption]:
        return (
            ProductOption.objects.filter(
                product_id=product_id,
                deleted_at__isnull=True,
                product__deleted_at__isnull=True,
            )
            .prefetch_related("values")
            .order_by("display_order")
        )

    @staticmethod
    def get_option_by_id(option_id: str) -> ProductOption or None:
        return (
            ProductOption.objects.filter(
                id=option_id,
                deleted_at__isnull=True,
            )
            .select_related("product")
            .first()
        )

    @staticmethod
    def get_values_for_option(option_id: str) -> list[OptionValue]:
        return OptionValue.objects.filter(
            option_id=option_id,
            deleted_at__isnull=True,
        ).order_by("display_order")

    @staticmethod
    def get_value_by_id(value_id: str) -> OptionValue or None:
        return (
            OptionValue.objects.filter(
                id=value_id,
                deleted_at__isnull=True,
            )
            .select_related("option")
            .first()
        )


class OptionValueSelector:
    @staticmethod
    def get_value_by_id(option_value_id: str) -> OptionValue or None:
        return (
            OptionValue.objects.filter(
                id=option_value_id,
                deleted_at__isnull=True,
            )
            .select_related("option")
            .first()
        )
