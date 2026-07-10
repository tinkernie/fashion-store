import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from cart.models import Cart
from cart.tests.factories import CartFactory, CartItemFactory
from variants.tests.factories import VariantFactory

User = get_user_model()

@pytest.mark.django_db
class TestGuestCartAPI:
    def test_get_empty_cart(self):
        client = APIClient()
        resp = client.get('/api/v1/cart/')
        assert resp.status_code == 200
        assert len(resp.data['items']) == 0

    def test_add_item_as_guest(self, mocker):
        mocker.patch('inventory.services.InventoryService.reserve_stock', return_value={'reservation_id': 'mock-id', 'expires_at': '...', 'reserved_quantity': 2})
        variant = VariantFactory(status='published')
        client = APIClient()
        resp = client.post('/api/v1/cart/add_item/', {'variant_id': str(variant.id), 'quantity': 2})
        assert resp.status_code == 200
        assert resp.data['items'][0]['quantity'] == 2
        # Check session was updated
        assert 'cart_session_key' in client.session

    def test_remove_item(self, mocker):
        mocker.patch('inventory.services.InventoryService.reserve_stock', return_value={'reservation_id': 'mock-id'})
        mocker.patch('inventory.services.InventoryService.release_reservation')
        variant = VariantFactory(status='published')
        client = APIClient()
        # Add first
        client.post('/api/v1/cart/add_item/', {'variant_id': str(variant.id), 'quantity': 1})
        # Remove
        resp = client.post('/api/v1/cart/remove-item/', {'variant_id': str(variant.id)})
        assert resp.status_code == 200
        assert len(resp.data['items']) == 0