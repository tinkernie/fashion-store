import pytest
from common.exceptions import BusinessException
from variants.services import VariantService
from variants.selectors import VariantSelector
from .factories import VariantFactory
from products.tests.factories import ProductFactory
from product_options.tests.factories import ProductOptionFactory, OptionValueFactory


@pytest.mark.django_db
class TestVariantService:
    def test_create_variant(self):
        product = ProductFactory()
        option = ProductOptionFactory(product=product, name="Color")
        value = OptionValueFactory(option=option, value="Red")
        service = VariantService()
        result = service.create_variant(
            str(product.id),
            {
                "sku": "TEST-001",
                "price": "99.99",
                "weight": 500,
                "availability": "in_stock",
                "option_values": [
                    {"option_id": str(option.id), "value_id": str(value.id)}
                ],
            },
        )
        assert result["sku"] == "TEST-001"
        assert len(result["options"]) == 1
        assert result["options"][0]["value"] == "Red"

    def test_duplicate_sku_raises(self):
        product = ProductFactory()
        variant = VariantFactory(sku="UNIQ-001")
        with pytest.raises(BusinessException):
            VariantService().create_variant(
                str(product.id),
                {
                    "sku": "UNIQ-001",
                    "price": "10.00",
                    "weight": 100,
                    "availability": "in_stock",
                    "option_values": [],
                },
            )

    def test_delete_variant(self):
        variant = VariantFactory()
        service = VariantService()
        service.delete_variant(str(variant.id))
        variant.refresh_from_db()
        assert variant.deleted_at is not None

    def test_visible_variants_filtering(self):
        product = ProductFactory(status="published")
        published = VariantFactory(product=product, status="published")
        draft = VariantFactory(product=product, status="draft")
        visible = VariantSelector.get_visible_variants_for_product(str(product.id))
        assert published in visible
        assert draft not in visible
