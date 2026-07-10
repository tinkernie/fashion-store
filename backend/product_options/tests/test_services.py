import pytest
from common.exceptions import BusinessException
from product_options.services import ProductOptionService, OptionValueService
from .factories import ProductOptionFactory, OptionValueFactory
from products.tests.factories import ProductFactory

@pytest.mark.django_db
class TestProductOptionService:
    def test_create_option(self):
        product = ProductFactory()
        service = ProductOptionService()
        result = service.create_option(str(product.id), {'name': 'Color', 'display_order': 1})
        assert result['name'] == 'Color'
        assert result['product_id'] == str(product.id)

    def test_delete_option(self):
        option = ProductOptionFactory()
        service = ProductOptionService()
        service.delete_option(str(option.id))
        option.refresh_from_db()
        assert option.deleted_at is not None

class TestOptionValueService:
    def test_create_value(self):
        option = ProductOptionFactory()
        service = OptionValueService()
        result = service.create_value(str(option.id), {'value': 'Red'})
        assert result['value'] == 'Red'

    def test_update_value(self):
        value = OptionValueFactory(value='Old')
        service = OptionValueService()
        service.update_value(str(value.id), {'value': 'New'})
        value.refresh_from_db()
        assert value.value == 'New'