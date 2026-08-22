import pytest
from unittest.mock import patch
from notifications.signals import order_status_changed
from notifications.services import NotificationService
from notifications.models import Notification
from orders.models import Order
from orders.tests.factories import OrderFactory
from common.tests.factories import UserFactory
from .factories import NotificationTemplateFactory, PreferenceFactory


@pytest.mark.django_db
class TestOrderStatusSignal:
    @patch('notifications.services.send_notification_email.delay')
    def test_signal_creates_notification(self, mock_send):
        template = NotificationTemplateFactory(type='order_status_change',
                                               subject_template='{{ order_number }} status changed',
                                               body_template='New status: {{ new_status }}')
        user = UserFactory()
        PreferenceFactory(user=user)
        order = OrderFactory(user=user, status=Order.Status.PENDING)
        order_status_changed.send(sender=self.__class__, order=order, old_status='pending', new_status='paid')
        assert Notification.objects.filter(user=user, type='order_status_change').exists()
