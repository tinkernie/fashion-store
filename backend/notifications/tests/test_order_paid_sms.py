import pytest
from unittest.mock import MagicMock

from django.conf import settings

from analytics.signals import order_placed
from common.tests.factories import UserFactory
from notifications.signals import order_status_changed
from notifications.models import Notification
from notifications.repositories import PreferenceRepository
from orders.models import Order
from orders.services import OrderService
from orders.tests.factories import OrderFactory
from payments.models import Payment
from payments.tests.factories import PaymentFactory


@pytest.fixture
def mock_template_sms(monkeypatch):
    mock = MagicMock()
    monkeypatch.setattr("notifications.tasks.send_template_sms", mock)
    return mock


@pytest.fixture
def mock_send_sms(monkeypatch):
    mock = MagicMock()
    monkeypatch.setattr("notifications.tasks.send_sms", mock)
    return mock


def _paid_order(user):
    order = OrderFactory(user=user, status=Order.Status.AWAITING_PAYMENT, total=25000)
    PaymentFactory(order=order, user=user, amount="25000", status=Payment.Status.SUCCEEDED,
                   gateway_reference="15511601")
    return order


@pytest.mark.django_db
class TestPaidOrderSms:
    def test_paid_transition_fires_customer_and_owner_sms(self, mock_template_sms, django_capture_on_commit_callbacks):
        user = UserFactory(email="paid-sms@example.com", phone_number="09355501111")
        order = _paid_order(user)
        with django_capture_on_commit_callbacks(execute=True):
            order_status_changed.send(
                sender=self.__class__, order=order,
                old_status=Order.Status.AWAITING_PAYMENT, new_status=Order.Status.PAID,
            )
        assert mock_template_sms.delay.call_count == 2
        calls = {c.args[1]: c.args[2] for c in mock_template_sms.delay.call_args_list}
        customer_params = {p["name"]: p["value"] for p in calls.pop(321934)}
        expected_url = f"{settings.FRONTEND_URL.replace('https://', '').replace('http://', '').rstrip('/')}/profile"
        assert customer_params == {
            "ORDERID": order.order_number,
            "TRACKING": "15511601",
            "URL": expected_url,
        }
        assert mock_template_sms.delay.call_args_list[0].args[0] == user.phone_number
        owner_params = {p["name"]: p["value"] for p in calls.pop(551115)}
        assert owner_params == {
            "ORDERID": order.order_number,
            "AMOUNT": "25000 تومان",
        }
        assert mock_template_sms.delay.call_args_list[1].args[0] == "09199547931"

    def test_no_sms_without_successful_payment(self, mock_template_sms, django_capture_on_commit_callbacks):
        order = OrderFactory(status=Order.Status.AWAITING_PAYMENT, total=25000)
        with django_capture_on_commit_callbacks(execute=True):
            order_status_changed.send(
                sender=self.__class__, order=order,
                old_status=Order.Status.AWAITING_PAYMENT, new_status=Order.Status.PAID,
            )
            order.save(update_fields=["updated_at"])
        assert mock_template_sms.delay.call_count == 0

    def test_owner_sms_not_gated_by_customer_preferences(self, mock_template_sms, django_capture_on_commit_callbacks):
        user = UserFactory()
        order = _paid_order(user)
        prefs = PreferenceRepository.get_or_create_preferences(user)
        prefs.sms_order_updates = False
        prefs.save(update_fields=["sms_order_updates"])
        with django_capture_on_commit_callbacks(execute=True):
            order_status_changed.send(
                sender=self.__class__, order=order,
                old_status=Order.Status.AWAITING_PAYMENT, new_status=Order.Status.PAID,
            )
        assert mock_template_sms.delay.call_count == 1
        assert mock_template_sms.delay.call_args_list[0].args[1] == 551115

    def test_paid_to_paid_never_resends(self, mock_template_sms, django_capture_on_commit_callbacks):
        user = UserFactory()
        order = _paid_order(user)
        order.status = Order.Status.PAID
        order.save(update_fields=["status"])
        with django_capture_on_commit_callbacks(execute=True):
            order_status_changed.send(
                sender=self.__class__, order=order,
                old_status=Order.Status.PAID, new_status=Order.Status.PAID,
            )
        assert mock_template_sms.delay.call_count == 0



    def test_order_serialization_includes_payment_info(self):
        user = UserFactory()
        order = _paid_order(user)
        serialized = OrderService().get_order_by_number(order.order_number, user=user)
        assert serialized["payment_info"] is not None
        assert serialized["payment_info"]["tracking_code"] == "15511601"
        assert serialized["payment_info"]["amount"] == 25000
        assert serialized["payment_info"]["status"] == "succeeded"
        assert serialized["payment_info"]["gateway_name"] == "زرین‌پال"
        assert len(serialized["payments"]) == 1


@pytest.mark.django_db
class TestCheckoutNotificationOnlyInApp:
    def test_order_placed_creates_in_app_without_sms_or_email(self, mock_template_sms, mock_send_sms):
        user = UserFactory()
        order = OrderFactory(user=user, status=Order.Status.PENDING, total=25000)
        order_placed.send(sender=self.__class__, user=user, order=order, items_data=[])
        assert mock_template_sms.delay.call_count == 0
        assert mock_send_sms.delay.call_count == 0
        assert Notification.objects.filter(user=user, type="order_confirmation").exists()
