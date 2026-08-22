from django.db.models import Count
from .models import Notification, UserNotificationPreference


class NotificationSelector:
    @staticmethod
    def get_notifications_for_user(user, is_read: bool = None, limit: int = 50):
        qs = Notification.objects.filter(user=user)
        if is_read is not None:
            qs = qs.filter(is_read=is_read)
        return qs[:limit]

    @staticmethod
    def get_unread_count(user) -> int:
        return Notification.objects.filter(user=user, is_read=False).count()


class PreferenceSelector:
    @staticmethod
    def get_preferences(user) -> UserNotificationPreference:
        return UserNotificationPreference.objects.filter(user=user).first()
