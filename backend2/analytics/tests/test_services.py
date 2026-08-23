import pytest
from analytics.services import AnalyticsService
from analytics.selectors import AnalyticsSelector
from .factories import TrackedEventFactory
from common.tests.factories import UserFactory
from analytics.models import TrackedEvent


@pytest.mark.django_db
class TestAnalyticsService:
    def test_record_event(self):
        user = UserFactory()
        service = AnalyticsService()
        result = service.record_event(user, None, 'product_view', {'product_id': '123'})
        assert result['type'] == 'product_view'
        event = TrackedEvent.objects.get(id=result['id'])
        assert event.payload['product_id'] == '123'

    def test_get_events(self):
        TrackedEventFactory(type='cart_add', payload={'variant_id': 'v1'})
        TrackedEventFactory(type='cart_remove')
        service = AnalyticsService()
        events = service.get_recent_events(type='cart_add')
        assert len(events) == 1
        assert events[0]['payload']['variant_id'] == 'v1'
