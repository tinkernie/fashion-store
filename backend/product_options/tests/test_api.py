import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from products.tests.factories import ProductFactory
from .factories import ProductOptionFactory, OptionValueFactory

User = get_user_model()

@pytest.mark.django_db
class TestPublicAPI:
    def test_list_options(self):
        product = ProductFactory(slug='test-product', status='published')
        option = ProductOptionFactory(product=product, name='Color')
        value = OptionValueFactory(option=option, value='Blue')
        client = APIClient()
        resp = client.get(f'/api/v1/products/{product.slug}/options/')
        assert resp.status_code == 200
        data = resp.data
        assert len(data) == 1
        assert data[0]['name'] == 'Color'
        assert len(data[0]['values']) == 1
        assert data[0]['values'][0]['value'] == 'Blue'

class TestAdminAPI:
    def test_create_option(self):
        admin = User.objects.create_superuser('admin@test.com', 'pass')
        product = ProductFactory()
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.post(f'/api/v1/admin/products/{product.id}/options/', {
            'name': 'Size',
            'display_order': 0,
        })
        assert resp.status_code == 201
        assert resp.data['name'] == 'Size'

    def test_add_value(self):
        admin = User.objects.create_superuser('admin@test.com', 'pass')
        option = ProductOptionFactory()
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.post(
            f'/api/v1/admin/products/{option.product_id}/options/{option.id}/values/',
            {'value': 'XL', 'display_order': 1}
        )
        assert resp.status_code == 201