import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from products.tests.factories import ProductFactory
from .factories import VariantFactory
from product_options.tests.factories import ProductOptionFactory, OptionValueFactory

User = get_user_model()

@pytest.mark.django_db
class TestPublicAPI:
    def test_list_variants(self):
        product = ProductFactory(slug='test-product', status='published')
        option = ProductOptionFactory(product=product, name='Size')
        value = OptionValueFactory(option=option, value='M')
        variant = VariantFactory(
            product=product,
            sku='VAR-1',
            status='published',
            option_values=[{'option': option, 'value': value}]
        )
        client = APIClient()
        resp = client.get(f'/api/v1/products/{product.slug}/variants/')
        assert resp.status_code == 200
        data = resp.data
        assert len(data) == 1
        assert data[0]['sku'] == 'VAR-1'
        assert data[0]['options'][0]['value'] == 'M'

    def test_retrieve_variant_by_sku(self):
        product = ProductFactory(slug='product-1', status='published')
        VariantFactory(sku='UNIQUE-SKU', product=product, status='published')
        client = APIClient()
        resp = client.get(f'/api/v1/products/{product.slug}/variants/UNIQUE-SKU/')
        assert resp.status_code == 200
        assert resp.data['sku'] == 'UNIQUE-SKU'

class TestAdminAPI:
    def test_create_variant(self):
        admin = User.objects.create_superuser('admin@test.com', 'pass')
        product = ProductFactory()
        option = ProductOptionFactory(product=product, name='Color')
        value = OptionValueFactory(option=option, value='Blue')
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.post('/api/v1/admin/variants/', {
            'product_id': str(product.id),
            'sku': 'NEW-SKU',
            'price': '49.99',
            'weight': 300,
            'availability': 'in_stock',
            'option_values': [{'option_id': str(option.id), 'value_id': str(value.id)}],
        })
        assert resp.status_code == 201

    def test_delete_variant(self):
        admin = User.objects.create_superuser('admin@test.com', 'pass')
        variant = VariantFactory()
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.delete(f'/api/v1/admin/variants/{variant.id}/')
        assert resp.status_code == 200
        variant.refresh_from_db()
        assert variant.deleted_at is not None