import pytest
from unittest.mock import patch
from payments.services import PaymentService
from payments.models import Payment
from orders.models import Order
from orders.tests.factories import OrderFactory
from common.tests.factories import UserFactory
from common.exceptions import BusinessException

@pytest.mark.django_db
class TestPaymentService:
    @patch('payments.gateways.dummy.DummyGateway.create_transaction')
    def test_initiate_payment_success(self, mock_create):
        mock_create.return_value = {
            'gateway_reference': 'dummy-ref',
            'status': 'succeeded',
            'raw_response': {}
        }
        user = UserFactory()
        order = OrderFactory(user=user, status=Order.Status.AWAITING_PAYMENT)
        service = PaymentService()
        result = service.initiate_payment(user, str(order.id))
        assert result['status'] == 'succeeded'
        order.refresh_from_db()
        assert order.status == Order.Status.PAID

    def test_initiate_on_already_paid_order(self):
        user = UserFactory()
        order = OrderFactory(user=user, status=Order.Status.PAID)
        service = PaymentService()
        with pytest.raises(BusinessException):
            service.initiate_payment(user, str(order.id))

    def test_callback_verification(self):
        payment = PaymentFactory(gateway='dummy', gateway_reference='ref-123')
        service = PaymentService()
        result = service.verify_callback('dummy', {'ref': 'ref-123'})
        payment.refresh_from_db()
        assert payment.status == 'succeeded'
        assert payment.order.status == Order.Status.PAID