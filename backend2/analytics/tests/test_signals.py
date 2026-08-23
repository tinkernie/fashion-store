import pytest
from unittest.mock import patch
from analytics.signals import cart_changed, order_placed
from analytics.services import AnalyticsService
from analytics.models import TrackedEvent
from common.tests.factories import UserFactory
from orders.tests.factories import OrderFactory


@pytest.mark.django_db
class TestSignals:
    @patch('analytics.handlers.AnalyticsService.record_event')
    def test_cart_changed_triggers_event(self, mock_record):
        user = UserFactory()
        cart_changed.send(sender=self.__class__, user=user, session_key='test-key',
                          action='add', variant_id='123', quantity=2)
        mock_record.assert_called_once_with(
            user=user, session_key='test-key', type='cart_add',
            payload={'variant_id': '123', 'quantity': 2}
        )

    @patch('analytics.handlers.AnalyticsService.record_event')
    def test_order_placed_triggers_event(self, mock_record):
        user = UserFactory()
        order = OrderFactory(user=user)
        items_data = [{'variant_id': 'v1', 'quantity': 3}]
        order_placed.send(sender=self.__class__, user=user, order=order, items_data=items_data)
        mock_record.assert_called_once()
