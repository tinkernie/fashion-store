from django.db import IntegrityError
from .repositories import ProductOptionRepository, OptionValueRepository
from .selectors import ProductOptionSelector, OptionValueSelector
from common.exceptions import BusinessException


class ProductOptionService:
    def create_option(self, product_id: str, data: dict) -> dict:
        # Ensure product exists (selector can check or let DB raise IntegrityError)
        # We'll just attempt creation; DB will enforce product FK.
        name = data["name"]
        order = data.get("display_order", 0)
        try:
            option = ProductOptionRepository.create_option(product_id, name, order)
        except BusinessException:
            raise
        except IntegrityError:
            raise BusinessException(
                f"Option '{str(name).strip()}' already exists for this product."
            )
        return self._serialize_option(option)

    def update_option(self, option_id: str, data: dict) -> dict:
        option = ProductOptionSelector.get_option_by_id(option_id)
        if not option:
            raise BusinessException("Option not found.")
        try:
            updated = ProductOptionRepository.update_option(option, **data)
        except BusinessException:
            raise
        except IntegrityError:
            raise BusinessException("Option with this name already exists.")
        return self._serialize_option(updated)

    def delete_option(self, option_id: str) -> dict:
        option = ProductOptionSelector.get_option_by_id(option_id)
        if not option:
            raise BusinessException("Option not found.")
        ProductOptionRepository.delete_option(option)
        return {"message": f"Option '{option.name}' deleted."}

    def _serialize_option(self, option) -> dict:
        return {
            "id": str(option.id),
            "product_id": str(option.product_id),
            "name": option.name,
            "display_order": option.display_order,
        }


class OptionValueService:
    def create_value(self, option_id: str, data: dict) -> dict:
        option = ProductOptionSelector.get_option_by_id(option_id)
        if not option:
            raise BusinessException("Option not found.")
        value = data["value"]
        order = data.get("display_order", 0)
        try:
            obj = OptionValueRepository.create_value(option, value, order)
        except BusinessException:
            raise
        except IntegrityError:
            raise BusinessException("This value already exists for the option.")
        return self._serialize_value(obj)

    def update_value(self, value_id: str, data: dict) -> dict:
        obj = OptionValueSelector.get_value_by_id(value_id)
        if not obj:
            raise BusinessException("Option value not found.")
        try:
            updated = OptionValueRepository.update_value(obj, **data)
        except BusinessException:
            raise
        except IntegrityError:
            raise BusinessException("This value already exists for the option.")
        return self._serialize_value(updated)

    def delete_value(self, value_id: str) -> dict:
        obj = OptionValueSelector.get_value_by_id(value_id)
        if not obj:
            raise BusinessException("Option value not found.")
        OptionValueRepository.delete_value(obj)
        return {"message": f"Value '{obj.value}' deleted."}

    def _serialize_value(self, value) -> dict:
        return {
            "id": str(value.id),
            "option_id": str(value.option_id),
            "value": value.value,
            "display_order": value.display_order,
        }
