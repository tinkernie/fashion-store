import pytest
from rest_framework.test import APIClient
from django.conf import settings
from django.contrib.auth import get_user_model
from orders.tests.factories import OrderFactory
from orders.models import Order
from payments.models import Payment
from payments.tests.factories import PaymentFactory

User = get_user_model()


@pytest.fixture
def zarinpal_cfg(monkeypatch):
    monkeypatch.setattr(settings, "ZARINPAL_MERCHANT_ID", "11111111-2222-4333-8444-555555555555")
    monkeypatch.setattr(settings, "ZARINPAL_SANDBOX", True)
    monkeypatch.setattr(settings, "ZARINPAL_CURRENCY", "IRT")


def _fake_gateway_request(monkeypatch, authority="S0000000000000000000000000000test"):
    """Sandbox-shaped successful response for payment request.json"""
    class R:
        status_code = 200
        def raise_for_status(self):
            pass
        def json(self):
            return {"data": {"code": 100, "authority": authority}, "errors": []}

    monkeypatch.setattr("payments.gateways.zarinpal.requests.post", lambda *a, **kw: R())


@pytest.mark.django_db
class TestPaymentAPI:
    def test_initiate_payment_zarinpal_default_gateway(self, zarinpal_cfg, monkeypatch):
        _fake_gateway_request(monkeypatch, authority="S0000000000000000000000000000A11")
        user = User.objects.create_user('09355501111', 'pass') if hasattr(User.objects, 'create_user') else None
        if user is None:
            from common.tests.factories import UserFactory
            user = UserFactory()
        order = OrderFactory(user=user, status=Order.Status.AWAITING_PAYMENT, total=15000)
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.post('/api/payments/initiate/', {'order_id': str(order.id)})
        assert resp.status_code == 200
        assert resp.json()['gateway'] == 'zarinpal'
        assert resp.json()['status'] == 'pending'
        assert resp.json()['redirect_url'].startswith('https://sandbox.zarinpal.com/pg/StartPay/')
        payment = Payment.objects.get(order=order)
        assert payment.authority == "S0000000000000000000000000000A11"

    def test_initiate_unknown_gateway_rejected(self, zarinpal_cfg, monkeypatch):
        _fake_gateway_request(monkeypatch)
        from common.tests.factories import UserFactory
        user = UserFactory()
        order = OrderFactory(user=user, status=Order.Status.AWAITING_PAYMENT, total=15000)
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.post('/api/payments/initiate/', {'order_id': str(order.id), 'gateway': 'stripe'})
        assert resp.status_code == 400

    def test_callback_result_redirect_enriched_payload(self, zarinpal_cfg, monkeypatch):
        """Browser return NOK path: failed payment kept, redirect carries
        order/status/ref/amount/gateway for the frontend result page."""
        order = OrderFactory(status=Order.Status.AWAITING_PAYMENT, total=15000)
        payment = PaymentFactory(
            order=order, gateway='zarinpal', amount='15000',
            authority='S0000000000000000000000000000B22', status='pending',
        )
        monkeypatch.setattr(settings, "FRONTEND_URL", "https://maviposh.com")
        client = APIClient()
        resp = client.get(
            "/api/payments/callbacks/zarinpal/result/",
            {"Authority": "S0000000000000000000000000000B22", "Status": "NOK"},
        )
        assert resp.status_code == 302
        loc = resp["Location"]
        for part in ("order=", "status=failed", "ref=", "amount=15000", "gateway=zarinpal"):
            assert part in loc
        payment.refresh_from_db()
        assert payment.status == Payment.Status.FAILED
