from django.db import transaction
from .models import ProductOption, OptionValue
from common.exceptions import BusinessException

class ProductOptionRepository:
    @staticmethod
    def create_option(product_id: str, name: str, display_order: int = 0) -> ProductOption:
        return ProductOption.objects.create(
            product_id=product_id,
            name=name,
            display_order=display_order,
        )

    @staticmethod
    def update_option(option: ProductOption, **fields) -> ProductOption:
        allowed = {'name', 'display_order'}
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
    def create_value(option: ProductOption, value: str, display_order: int = 0) -> OptionValue:
        return OptionValue.objects.create(
            option=option,
            value=value,
            display_order=display_order,
        )

    @staticmethod
    def update_value(instance: OptionValue, **fields) -> OptionValue:
        allowed = {'value', 'display_order'}
        for key, value in fields.items():
            if key in allowed:
                setattr(instance, key, value)
        instance.save()
        return instance

    @staticmethod
    def delete_value(instance: OptionValue):
        instance.delete()