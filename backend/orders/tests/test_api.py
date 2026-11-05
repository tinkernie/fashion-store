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
        user = User.objects.create_user("09121111111", "pass")
        OrderFactory(user=user, order_number="MAVI-001")
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.get("/api/orders/")
        assert resp.status_code == 200
        assert len(resp.data) == 1

    def test_checkout_empty_cart_fails(self):
        user = User.objects.create_user("09121111111", "pass")
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.post(
            "/api/orders/checkout/", {"shipping_method": "pickup"}, format="json"
        )
        assert resp.status_code == 400
        assert "cart is empty" in str(resp.data).lower()

    def test_checkout_missing_address_fails_for_postal(self):
        user = User.objects.create_user("09121111112", "pass")
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.post(
            "/api/orders/checkout/", {"shipping_method": "pishtaz"}, format="json"
        )
        assert resp.status_code == 400
        assert "address" in str(resp.data).lower()


@pytest.mark.django_db
class TestAdminEndpoints:
    def test_transition_status_as_admin(self):
        admin = User.objects.create_superuser("09129999999", "pass")
        order = OrderFactory(status=Order.Status.PENDING)
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.post(
            f"/api/admin/orders/{order.id}/transition/",
            {"status": "awaiting_payment"},
        )
        assert resp.status_code == 200
        assert resp.data["status"] == "awaiting_payment"
