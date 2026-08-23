import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from orders.models import Order
from orders.tests.factories import OrderFactory
from cart.tests.factories import CartFactory, CartItemFactory
from variants.tests.factories import VariantFactory

User = get_user_model()


@pytest.mark.django_db
class TestUserEndpoints:
    def test_list_user_orders(self):
        user = User.objects.create_user('buyer@test.com', 'pass')
        OrderFactory(user=user, order_number='LUX-001')
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.get('/api/v1/orders/')
        assert resp.status_code == 200
        assert len(resp.data) == 1

    def test_checkout_empty_cart_fails(self):
        user = User.objects.create_user('buyer@test.com', 'pass')
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.post('/api/v1/orders/checkout/', {'shipping_address': {}})
        assert resp.status_code == 400
        assert 'cart' in resp.data['error']['message'].lower()


class TestAdminEndpoints:
    def test_transition_status_as_admin(self):
        admin = User.objects.create_superuser('admin@test.com', 'pass')
        order = OrderFactory(status=Order.Status.PENDING)
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.post(f'/api/v1/admin/orders/{order.id}/transition/', {'status': 'awaiting_payment'})
        assert resp.status_code == 200
        assert resp.data['status'] == 'awaiting_payment'
