from .repositories import AnalyticsRepository
from .selectors import AnalyticsSelector
from common.exceptions import BusinessException


class AnalyticsService:
    def record_event(self, user, session_key, type: str, payload: dict = None) -> dict:
        event = AnalyticsRepository.record_event(user, session_key, type, payload)
        return {'id': str(event.id), 'type': event.type}

    def get_sales_summary(self, start_date, end_date) -> dict:
        return AnalyticsSelector.get_sales_summary(start_date, end_date)

    def get_popular_products(self, limit=10) -> list:
        return AnalyticsSelector.get_popular_products(limit)

    def get_cart_abandonment(self) -> dict:
        return AnalyticsSelector.get_cart_abandonment_rate()

    def get_recent_events(self, type: str = None, user_id: str = None, limit: int = 100) -> list:
        filters = {}
        if type:
            filters['type'] = type
        if user_id:
            filters['user_id'] = user_id
        events = AnalyticsSelector.get_events(filters, limit)
        return [
            {
                'id': str(e.id),
                'user_id': str(e.user_id) if e.user_id else None,
                'session_key': str(e.session_key) if e.session_key else None,
                'type': e.type,
                'payload': e.payload,
                'timestamp': e.timestamp.isoformat(),
            } for e in events
        ]
