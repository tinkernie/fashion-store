import pytest
from common.exceptions import BusinessException
from products.services import ProductService
from products.selectors import ProductSelector
from .factories import ProductFactory
from categories.tests.factories import CategoryFactory

@pytest.mark.django_db
class TestProductService:
    def test_create_product(self):
        cat = CategoryFactory(name='Shirts', slug='shirts')
        service = ProductService()
        result = service.create_product({
            'title': 'Silk Blouse',
            'slug': 'silk-blouse',
            'category_id': str(cat.id),
            'status': 'draft',
        })
        assert result['slug'] == 'silk-blouse'
        assert result['category_id'] == str(cat.id)

    def test_duplicate_slug_raises(self):
        ProductFactory(slug='unique')
        service = ProductService()
        with pytest.raises(BusinessException):
            service.create_product({'title': 'Copy', 'slug': 'unique', 'category_id': str(CategoryFactory().id)})

    def test_archive_product(self):
        product = ProductFactory()
        service = ProductService()
        service.archive_product(str(product.id))
        product.refresh_from_db()
        assert product.status == 'archived'

    def test_get_visible_only_published(self):
        published = ProductFactory(status='published')
        draft = ProductFactory(status='draft')
        visible = ProductSelector.get_visible_products()
        assert published in visible
        assert draft not in visible