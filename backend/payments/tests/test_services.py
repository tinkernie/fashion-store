import pytest
from unittest.mock import patch
from django.conf import settings
from payments.services import PaymentService
from payments.models import Payment
from orders.models import Order
from payments.tests.factories import PaymentFactory
from orders.tests.factories import OrderFactory
from common.tests.factories import UserFactory
from common.exceptions import BusinessException


@pytest.fixture
def zarinpal_cfg(monkeypatch):
    monkeypatch.setattr(settings, "ZARINPAL_MERCHANT_ID", "11111111-2222-4333-8444-555555555555")
    monkeypatch.setattr(settings, "ZARINPAL_SANDBOX", True)
    monkeypatch.setattr(settings, "ZARINPAL_CURRENCY", "IRT")


@pytest.mark.django_db
class TestPaymentService:
    def test_initiate_payment_zarinpal_request_success(self, zarinpal_cfg):
        """Gateway responds success -> pending payment with authority stored."""
        from payments.gateways.zarinpal import ZarinpalGateway

        with patch.object(ZarinpalGateway, "create_transaction", return_value={
            "gateway_reference": "zarinpal-testing",
            "authority": "S0000000000000000000000000000TST",
            "status": Payment.Status.PENDING,
            "raw_response": {"code": 100, "redirect_url": "x"},
        }):
            user = UserFactory()
            order = OrderFactory(user=user, status=Order.Status.AWAITING_PAYMENT, total=12000)
            service = PaymentService()
            result = service.initiate_payment(user, str(order.id))
            assert result["status"] == Payment.Status.PENDING
            assert result["authority"] == "S0000000000000000000000000000TST"
            payment = Payment.objects.get(order=order)
            assert payment.authority == "S0000000000000000000000000000TST"
            order.refresh_from_db()
            assert order.status == Order.Status.AWAITING_PAYMENT  # not paid yet

    def test_initiate_on_already_paid_order(self):
        user = UserFactory()
        order = OrderFactory(user=user, status=Order.Status.PAID)
        service = PaymentService()
        with pytest.raises(BusinessException):
            service.initiate_payment(user, str(order.id))

    def test_callback_verification_via_gateway_reference(self):
        """Non-authority style result still resolves the payment row."""
        payment = PaymentFactory(gateway="zarinpal", gateway_reference="ref-123")
        service = PaymentService()
        with patch("payments.gateways.zarinpal.ZarinpalGateway.verify_callback", return_value={
            "gateway_reference": "ref-123",
            "authority": None,
            "status": Payment.Status.SUCCEEDED,
            "raw_response": {"verify": {"code": 100, "ref_id": 123}},
        }):
            service.verify_callback("zarinpal", {"Status": "OK"})
        payment.refresh_from_db()
        assert payment.status == Payment.Status.SUCCEEDED
        assert payment.order.status == Order.Status.PAID

    def test_callback_sets_reference_on_success(self, zarinpal_cfg):
        """Verify success writes ref_id as gateway_reference."""
        order = OrderFactory(status=Order.Status.AWAITING_PAYMENT, total=9000)
        payment = PaymentFactory(
            order=order, gateway="zarinpal", amount="9000",
            authority="S0000000000000000000000000000REF", status="pending",
        )
        service = PaymentService()
        with patch("payments.gateways.zarinpal.ZarinpalGateway.verify_callback", return_value={
            "gateway_reference": "77777",
            "authority": "S0000000000000000000000000000REF",
            "status": Payment.Status.SUCCEEDED,
            "raw_response": {"verify": {"code": 100, "ref_id": 77777}},
        }):
            service.verify_callback("zarinpal", {"Authority": "S0000000000000000000000000000REF", "Status": "OK"})
        payment.refresh_from_db()
        assert payment.status == Payment.Status.SUCCEEDED
        assert payment.gateway_reference == "77777"
        assert payment.order.status == Order.Status.PAID
