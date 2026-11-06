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

    def test_list_orders_as_admin_includes_customer_and_address(self):
        admin = User.objects.create_superuser("09129999998", "pass")
        customer = User.objects.create_user("09351234567", "pass", first_name="علی", last_name="رضایی")
        order = OrderFactory(
            user=customer,
            status=Order.Status.PAID,
            shipping_address={"full_name": "علی رضایی", "phone": "09351234567", "city": "Tehran", "address": "خیابان آزادی"}
        )
        from orders.tests.factories import OrderItemFactory
        OrderItemFactory(order=order)

        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.get("/api/admin/orders/")
        assert resp.status_code == 200
        assert len(resp.data) >= 1
        found = next((o for o in resp.data if o["id"] == str(order.id)), None)
        assert found is not None
        assert found["customer_name"] == "علی رضایی"
        assert found["customer_phone"] == "09351234567"
        assert found["shipping_address"]["city"] == "Tehran"
        assert found["items_count"] == 1

    def test_retrieve_order_as_admin_by_id_and_by_number(self):
        admin = User.objects.create_superuser("09129999997", "pass")
        customer = User.objects.create_user("09359876543", "pass", first_name="سارا", last_name="احمدی")
        order = OrderFactory(
            user=customer,
            order_number="MAVI-TEST-SARAH-01",
            shipping_address={"full_name": "سارا احمدی", "phone": "09359876543", "address": "پلاک ۱۰", "city": "اصفهان"}
        )
        from orders.tests.factories import OrderItemFactory
        OrderItemFactory(order=order, product_snapshot={"title": "مانتو بهاره", "options": "سایز L"})

        client = APIClient()
        client.force_authenticate(user=admin)

        # 1. Retrieve by UUID
        resp_id = client.get(f"/api/admin/orders/{order.id}/")
        assert resp_id.status_code == 200
        assert resp_id.data["order_number"] == "MAVI-TEST-SARAH-01"
        assert resp_id.data["customer"]["full_name"] == "سارا احمدی"
        assert resp_id.data["customer"]["phone"] == "09359876543"
        assert resp_id.data["shipping_address"]["city"] == "اصفهان"
        assert len(resp_id.data["items"]) == 1
        assert resp_id.data["items"][0]["product_snapshot"]["title"] == "مانتو بهاره"

        # 2. Retrieve by order_number
        resp_num = client.get(f"/api/admin/orders/{order.order_number}/")
        assert resp_num.status_code == 200
        assert resp_num.data["id"] == str(order.id)
        assert resp_num.data["customer"]["full_name"] == "سارا احمدی"
        assert len(resp_num.data["items"]) == 1

    def test_admin_order_list_excludes_unpaid_orders(self):
        admin = User.objects.create_superuser("09128888888", "pass")
        unpaid_pending = OrderFactory(status=Order.Status.PENDING, paid_at=None)
        unpaid_awaiting = OrderFactory(status=Order.Status.AWAITING_PAYMENT, paid_at=None)
        paid_order = OrderFactory(status=Order.Status.PAID)
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.get("/api/admin/orders/")
        assert resp.status_code == 200
        order_numbers = [o["order_number"] for o in resp.data]
        assert paid_order.order_number in order_numbers
        assert unpaid_pending.order_number not in order_numbers
        assert unpaid_awaiting.order_number not in order_numbers
