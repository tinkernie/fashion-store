from django.db import transaction
from .models import Notification, NotificationTemplate, UserNotificationPreference
from common.exceptions import BusinessException


class NotificationRepository:
    @staticmethod
    def create_notification(user, type: str, subject: str, body: str, context: dict = None) -> Notification:
        return Notification.objects.create(
            user=user,
            type=type,
            subject=subject,
            body=body,
            context_json=context or {},
        )

    @staticmethod
    def mark_as_read(notification: Notification):
        from django.utils import timezone
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=['is_read', 'read_at', 'updated_at'])

    @staticmethod
    def mark_all_as_read(user):
        from django.utils import timezone
        Notification.objects.filter(user=user, is_read=False).update(
            is_read=True, read_at=timezone.now(), updated_at=timezone.now()
        )


class TemplateRepository:
    @staticmethod
    def get_template(type: str) -> NotificationTemplate:
        try:
            return NotificationTemplate.objects.get(type=type, is_active=True)
        except NotificationTemplate.DoesNotExist:
            raise BusinessException(f"Notification template for type '{type}' not found.")


class PreferenceRepository:
    @staticmethod
    def get_or_create_preferences(user) -> UserNotificationPreference:
        obj, _ = UserNotificationPreference.objects.get_or_create(user=user)
        return obj

    @staticmethod
    def update_preferences(user, **fields) -> UserNotificationPreference:
        prefs = PreferenceRepository.get_or_create_preferences(user)
        allowed = ['email_order_updates', 'email_promotions', 'email_account',
                   'in_app_order_updates', 'in_app_account']
        for key, value in fields.items():
            if key in allowed:
                setattr(prefs, key, value)
        prefs.save()
        return prefs
