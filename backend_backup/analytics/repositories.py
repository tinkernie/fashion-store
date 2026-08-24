from .models import TrackedEvent


class AnalyticsRepository:
    @staticmethod
    def record_event(user, session_key, type: str, payload: dict = None) -> TrackedEvent:
        return TrackedEvent.objects.create(
            user=user,
            session_key=session_key,
            type=type,
            payload=payload or {},
        )
