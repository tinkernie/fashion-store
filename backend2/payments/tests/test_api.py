import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from orders.tests.factories import OrderFactory
from payments.models import Payment

User = get_user_model()

@pytest.mark.django_db
class TestPaymentAPI:
    def test_initiate_payment_authenticated(self, mocker):
        mocker.patch('payments.gateways.dummy.DummyGateway.create_transaction',
                     return_value={'gateway_reference': 'ref', 'status': 'succeeded', 'raw_response': {}})
        user = User.objects.create_user('buyer@test.com', 'pass')
        order = OrderFactory(user=user, status=Order.Status.AWAITING_PAYMENT)
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.post('/api/v1/payments/initiate/', {'order_id': str(order.id)})
        assert resp.status_code == 200
        assert resp.data['status'] == 'succeeded'

    def test_callback_success(self, mocker):
        mocker.patch('payments.gateways.dummy.DummyGateway.verify_callback',
                     return_value={'gateway_reference': 'ref', 'status': 'succeeded', 'raw_response': {}})
        # We need an existing payment with that reference
        payment = PaymentFactory(gateway_reference='ref', status='pending')
        client = APIClient()
        resp = client.post('/api/v1/callbacks/dummy/', {'ref': 'ref'})
        assert resp.status_code == 200
        payment.refresh_from_db()
        assert payment.status == 'succeeded'