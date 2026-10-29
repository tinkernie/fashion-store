import uuid

import pytest
from django.conf import settings
from rest_framework.test import APIClient

from common.exceptions import BusinessException
from common.tests.factories import UserFactory
from orders.models import Order
from orders.tests.factories import OrderFactory
from payments.models import Payment
from payments.tests.factories import PaymentFactory

SANDBOX_BASE = "https://sandbox.zarinpal.com"


@pytest.fixture
def zarinpal_cfg(monkeypatch):
    monkeypatch.setattr(settings, "ZARINPAL_MERCHANT_ID", "11111111-2222-4333-8444-555555555555")
    monkeypatch.setattr(settings, "ZARINPAL_SANDBOX", True)
    monkeypatch.setattr(settings, "ZARINPAL_CURRENCY", "IRT")


def fake_request_response(monkeypatch, authority="A00000000000000000000000000123456789"):
    """Capture outgoing request.json payload; return a Zarinpal-style success."""
    captured = {}

    def fake_post(url, json=None, timeout=None):
        captured["url"] = url
        captured["payload"] = json
        class R:
            status_code = 200
            def raise_for_status(self):
                pass
            def json(self):
                return {"data": {"code": 100, "authority": authority}, "status": 1}
        return R()

    monkeypatch.setattr("payments.gateways.zarinpal.requests.post", fake_post)
    return captured


@pytest.mark.django_db
class TestZarinpalGatewayCreate:
    def test_create_transaction_buildsCorrect_payload_and_authority(self, zarinpal_cfg, monkeypatch):
        from payments.gateways.zarinpal import ZarinpalGateway
        captured = fake_request_response(monkeypatch, authority="S00000000000000000000000000000011")
        order = OrderFactory(user=UserFactory(), status=Order.Status.AWAITING_PAYMENT, total=25000)
        gateway = ZarinpalGateway()
        result = gateway.create_transaction(PaymentFactory(order=order, amount="25000"), order)
        payload = captured["payload"]
        assert captured["url"] == f"{SANDBOX_BASE}/pg/v4/payment/request.json"
        assert payload["merchant_id"] == "11111111-2222-4333-8444-555555555555"
        assert payload["amount"] == 25000 and isinstance(payload["amount"], int)
        assert payload["currency"] == "IRT"
        assert "callbacks/zarinpal/result/" in payload["callback_url"]
        assert order.order_number in payload["description"]
        assert payload["metadata"]["order_id"] == order.order_number
        assert result["authority"] == "S00000000000000000000000000000011"
        assert result["status"] == "pending"
        assert result["raw_response"]["redirect_url"].startswith(f"{SANDBOX_BASE}/pg/StartPay/")

    def test_create_transaction_rejects_gateway_error(self, zarinpal_cfg, monkeypatch):
        from payments.gateways.zarinpal import ZarinpalGateway

        def fake_post(url, json=None, timeout=None):
            class R:
                status_code = 200
                def raise_for_status(self):
                    pass
                def json(self):
                    return {"data": None, "status": -70}
            return R()

        monkeypatch.setattr("payments.gateways.zarinpal.requests.post", fake_post)
        order = OrderFactory(user=UserFactory(), status=Order.Status.AWAITING_PAYMENT, total=1000)
        with pytest.raises(BusinessException):
            ZarinpalGateway().create_transaction(PaymentFactory(order=order, amount="1000"), order)

    def test_request_unreachable_maps_to_business_error(self, zarinpal_cfg, monkeypatch):
        from payments.gateways.zarinpal import ZarinpalGateway

        def fake_post(url, json=None, timeout=None):
            raise ConnectionError("boom")

        monkeypatch.setattr("payments.gateways.zarinpal.requests.post", fake_post)
        order = OrderFactory(user=UserFactory(), status=Order.Status.AWAITING_PAYMENT, total=1000)
        with pytest.raises(BusinessException):
            ZarinpalGateway().create_transaction(PaymentFactory(order=order, amount="1000"), order)


@pytest.mark.django_db
class TestZarinpalVerifyCallback:
    def _ok_verify(self, monkeypatch, code=100, ref_id=98765, card="502229******1234"):
        def fake_post(url, json=None, timeout=None):
            assert url == f"{SANDBOX_BASE}/pg/v4/payment/verify.json"
            assert json["merchant_id"] == "11111111-2222-4333-8444-555555555555"
            assert json["authority"] == "A00000000000000000000000000999888"
            assert json["amount"] == 25000
            class R:
                status_code = 200
                def raise_for_status(self):
                    pass
                def json(self):
                    return {"data": {"code": code, "ref_id": ref_id, "card_pan": card}, "status": 1}
            return R()

        monkeypatch.setattr("payments.gateways.zarinpal.requests.post", fake_post)

    def test_status_ok_verify_100_succeeds(self, zarinpal_cfg, monkeypatch):
        from payments.gateways.zarinpal import ZarinpalGateway
        self._ok_verify(monkeypatch)
        order = OrderFactory(user=UserFactory(), status=Order.Status.AWAITING_PAYMENT, total=25000)
        payment = PaymentFactory(
            order=order, amount="25000",
            authority="A00000000000000000000000000999888",
        )
        result = ZarinpalGateway().verify_callback({"Authority": "A00000000000000000000000000999888", "Status": "OK"})
        assert result["status"] == "succeeded"
        assert result["gateway_reference"] == "98765"
        assert result["authority"] == "A00000000000000000000000000999888"

    def test_status_ok_verify_101_idempotent_success(self, zarinpal_cfg, monkeypatch):
        from payments.gateways.zarinpal import ZarinpalGateway
        self._ok_verify(monkeypatch, code=101, ref_id=98765)
        PaymentFactory(amount="25000", authority="A00000000000000000000000000999888")
        result = ZarinpalGateway().verify_callback({"authority": "A00000000000000000000000000999888", "status": "OK"})
        assert result["status"] == "succeeded"

    def test_status_nok_fails_without_verify_call(self, zarinpal_cfg, monkeypatch):
        from payments.gateways.zarinpal import ZarinpalGateway
        calls = []
        monkeypatch.setattr(
            "payments.gateways.zarinpal.requests.post",
            lambda *a, **kw: calls.append(1),
        )
        PaymentFactory(amount="25000", authority="A00000000000000000000000000111111")
        result = ZarinpalGateway().verify_callback({"Authority": "A00000000000000000000000000111111", "Status": "NOK"})
        assert result["status"] == "failed"
        assert not calls

    def test_verify_other_code_fails(self, zarinpal_cfg, monkeypatch):
        from payments.gateways.zarinpal import ZarinpalGateway
        self._ok_verify(monkeypatch, code=-51)
        PaymentFactory(amount="25000", authority="A00000000000000000000000000999888")
        result = ZarinpalGateway().verify_callback({"authority": "A00000000000000000000000000999888", "status": "OK"})
        assert result["status"] == "failed"

    def test_missing_authority_rejected(self, zarinpal_cfg):
        from payments.gateways.zarinpal import ZarinpalGateway
        with pytest.raises(BusinessException):
            ZarinpalGateway().verify_callback({"Status": "OK"})


@pytest.mark.django_db
class TestZarinpalEndToEnd:
    def test_initiate_stores_authority_and_returns_redirect(self, zarinpal_cfg, monkeypatch):
        captured = fake_request_response(monkeypatch, authority="S00000000000000000000000000007777")
        user = UserFactory()
        client = APIClient()
        client.force_authenticate(user=user)
        order = OrderFactory(user=user, status=Order.Status.AWAITING_PAYMENT, total=25000)
        resp = client.post("/api/payments/initiate/", {"order_id": str(order.id), "gateway": "zarinpal"})
        assert resp.status_code == 200
        assert resp.data["status"] == "pending"
        assert resp.data["authority"] == "S00000000000000000000000000007777"
        assert resp.data["redirect_url"].startswith(f"{SANDBOX_BASE}/pg/StartPay/")
        payment = Payment.objects.get(id=resp.data["id"])
        assert payment.authority == "S00000000000000000000000000007777"
        assert payment.status == Payment.Status.PENDING

    def test_full_callback_flow_marks_succeeded_and_paid(self, zarinpal_cfg, monkeypatch):
        monkeypatch.setattr("django.conf.settings.FRONTEND_URL", "https://maviposh.com")
        fake_request_response(monkeypatch, authority="S00000000000000000000000000009911")
        user = UserFactory()
        order = OrderFactory(user=user, status=Order.Status.AWAITING_PAYMENT, total=25000)
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.post("/api/payments/initiate/", {"order_id": str(order.id), "gateway": "zarinpal"})
        assert resp.status_code == 200
        assert order.refresh_from_db() is None

        # verify call for the browser return
        def fake_verify(url, json=None, timeout=None):
            assert json["amount"] == 25000
            class R:
                status_code = 200
                def raise_for_status(self):
                    pass
                def json(self):
                    return {"data": {"code": 100, "ref_id": 444123, "card_pan": "5022**"}, "status": 1}
            return R()

        monkeypatch.setattr("payments.gateways.zarinpal.requests.post", fake_verify)
        anon = APIClient()
        resp2 = anon.get(
            "/api/payments/callbacks/zarinpal/result/",
            {"Authority": "S00000000000000000000000000009911", "Status": "OK"},
            follow=False,
        )
        assert resp2.status_code == 302
        location = resp2["Location"]
        assert location.startswith("https://maviposh.com/payment-result?")
        assert "order=" in location and "ref=" in location and "status=succeeded" in location

        payment = Payment.objects.get(order=order)
        assert payment.status == Payment.Status.SUCCEEDED
        assert payment.gateway_reference == "444123"
        order.refresh_from_db()
        assert order.status == Order.Status.PAID

        # 101-tolerant repeat return (user resubmits via back button)
        def fake_verify_repeat(url, json=None, timeout=None):
            class R:
                status_code = 200
                def raise_for_status(self):
                    pass
                def json(self):
                    return {"data": {"code": 101, "ref_id": 444123}, "status": 1}
            return R()

        monkeypatch.setattr("payments.gateways.zarinpal.requests.post", fake_verify_repeat)
        anon.get(
            "/api/payments/callbacks/zarinpal/result/",
            {"Authority": "S00000000000000000000000000009911", "Status": "OK"},
        )
        payment.refresh_from_db()
        assert payment.status == Payment.Status.SUCCEEDED
        order.refresh_from_db()
        assert order.status == Order.Status.PAID

    def test_nok_return_marks_failed_and_redirects(self, zarinpal_cfg, monkeypatch):
        user = UserFactory()
        order = OrderFactory(user=user, status=Order.Status.AWAITING_PAYMENT, total=500)
        payment = PaymentFactory(
            order=order, user=user, gateway="zarinpal", amount="500",
            authority="S0000000000000000000000000000042", status="pending",
        )
        monkeypatch.setattr(settings, "FRONTEND_URL", "https://maviposh.com")
        anon = APIClient()
        resp = anon.get(
            "/api/payments/callbacks/zarinpal/result/",
            {"Authority": "S0000000000000000000000000000042", "Status": "NOK"},
        )
        assert resp.status_code == 302
        assert "status=failed" in resp["Location"]
        payment.refresh_from_db()
        assert payment.status == Payment.Status.FAILED

    def test_error_return_does_not_enumerate(self, zarinpal_cfg, monkeypatch):
        monkeypatch.setattr(settings, "FRONTEND_URL", "https://maviposh.com")
        anon = APIClient()
        resp = anon.get(
            "/api/payments/callbacks/zarinpal/result/",
            {"Authority": "S00000000000000000000000000000099", "Status": "OK"},
        )
        assert resp.status_code == 302
        assert "status=error" in resp["Location"]
