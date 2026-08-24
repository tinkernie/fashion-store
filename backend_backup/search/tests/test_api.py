import pytest
from rest_framework.test import APIClient
from rest_framework import status
from products.tests.factories import ProductFactory
from variants.tests.factories import VariantFactory

@pytest.mark.django_db
class TestSearchAPI:
    def test_search_endpoint(self):
        ProductFactory(title='Silk Blouse', status='published')
        client = APIClient()
        resp = client.get('/api/v1/search/products/?q=blouse')
        assert resp.status_code == 200
        assert len(resp.data['products']) == 1

    def test_filter_and_sort(self):
        p1 = ProductFactory(title='A', status='published')
        v1 = VariantFactory(product=p1, price=10, status='published')
        p2 = ProductFactory(title='B', status='published')
        v2 = VariantFactory(product=p2, price=20, status='published')
        client = APIClient()
        resp = client.get('/api/v1/search/products/?sort=price_asc')
        assert resp.data['products'][0]['price'] == '10.00'
