from django.db import transaction
from .models import ProductOption, OptionValue
from common.exceptions import BusinessException


class ProductOptionRepository:
    @staticmethod
    def create_option(
        product_id: str, name: str, display_order: int = 0
    ) -> ProductOption:
        name = (name or "").strip()
        if not name:
            raise BusinessException("Option name must not be empty.")
        # Friendly duplicate check among active rows (avoids raw IntegrityError).
        if ProductOption.objects.filter(
            product_id=product_id, name=name
        ).exists():
            raise BusinessException(
                f"Option '{name}' already exists for this product."
            )
        # Resurrect soft-deleted row with same (product, name) so re-add works.
        tombstone = ProductOption.all_objects.filter(
            product_id=product_id, name=name, deleted_at__isnull=False
        ).first()
        if tombstone:
            tombstone.deleted_at = None
            tombstone.display_order = display_order
            tombstone.save(update_fields=["deleted_at", "display_order", "updated_at"])
            return tombstone
        return ProductOption.objects.create(
            product_id=product_id,
            name=name,
            display_order=display_order,
        )

    @staticmethod
    def update_option(option: ProductOption, **fields) -> ProductOption:
        allowed = {"name", "display_order"}
        if "name" in fields and fields["name"] is not None:
            new_name = str(fields["name"]).strip()
            if not new_name:
                raise BusinessException("Option name must not be empty.")
            if (
                new_name != option.name
                and ProductOption.objects.filter(
                    product_id=option.product_id, name=new_name
                )
                .exclude(id=option.id)
                .exists()
            ):
                raise BusinessException(
                    f"Option '{new_name}' already exists for this product."
                )
            fields["name"] = new_name
        for key, value in fields.items():
            if key in allowed:
                setattr(option, key, value)
        option.save()
        return option

    @staticmethod
    def delete_option(option: ProductOption):
        option.delete()  # soft delete via BaseModel


class OptionValueRepository:
    @staticmethod
    def create_value(
        option: ProductOption, value: str, display_order: int = 0
    ) -> OptionValue:
        value = (value or "").strip()
        if not value:
            raise BusinessException("Option value must not be empty.")
        if OptionValue.objects.filter(option=option, value=value).exists():
            raise BusinessException(
                f"Value '{value}' already exists for option '{option.name}'."
            )
        tombstone = OptionValue.all_objects.filter(
            option=option, value=value, deleted_at__isnull=False
        ).first()
        if tombstone:
            tombstone.deleted_at = None
            tombstone.display_order = display_order
            tombstone.save(update_fields=["deleted_at", "display_order", "updated_at"])
            return tombstone
        return OptionValue.objects.create(
            option=option,
            value=value,
            display_order=display_order,
        )

    @staticmethod
    def update_value(instance: OptionValue, **fields) -> OptionValue:
        allowed = {"value", "display_order"}
        if "value" in fields and fields["value"] is not None:
            new_value = str(fields["value"]).strip()
            if not new_value:
                raise BusinessException("Option value must not be empty.")
            if (
                new_value != instance.value
                and OptionValue.objects.filter(
                    option_id=instance.option_id, value=new_value
                )
                .exclude(id=instance.id)
                .exists()
            ):
                raise BusinessException(
                    f"Value '{new_value}' already exists for this option."
                )
            fields["value"] = new_value
        for key, value in fields.items():
            if key in allowed:
                setattr(instance, key, value)
        instance.save()
        return instance

    @staticmethod
    def delete_value(instance: OptionValue):
        instance.delete()
