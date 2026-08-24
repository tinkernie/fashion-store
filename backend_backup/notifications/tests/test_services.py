import pytest
from unittest.mock import patch
from notifications.services import NotificationService
from notifications.models import Notification
from .factories import NotificationTemplateFactory, PreferenceFactory, NotificationFactory
from common.tests.factories import UserFactory
from common.exceptions import BusinessException


@pytest.mark.django_db
class TestNotificationService:
    def setup_method(self):
        self.template = NotificationTemplateFactory(type='welcome', subject_template='Welcome {{ user }}',
                                                    body_template='Hello {{ user }}')

    @patch('notifications.services.send_notification_email.delay')
    def test_send_welcome_email_allowed(self, mock_send):
        user = UserFactory()
        PreferenceFactory(user=user)
        service = NotificationService()
        result = service.send_notification(user, 'welcome', {'user': user.first_name})
        assert result['notification_id'] is not None
        mock_send.assert_called_once()
        notification = Notification.objects.get(id=result['notification_id'])
        assert notification.subject == f"Welcome {user.first_name}"

    def test_send_notification_respects_preferences(self):
        user = UserFactory()
        prefs = PreferenceFactory(user=user, email_account=False, in_app_account=False)
        service = NotificationService()
        result = service.send_notification(user, 'welcome', {'user': 'Test'})
        assert result['notification_id'] is None  # no in-app
        # email should not be sent
        # we can check celery task not called

    def test_mark_as_read(self):
        user = UserFactory()
        notif = NotificationFactory(user=user)
        service = NotificationService()
        service.mark_as_read(user, str(notif.id))
        notif.refresh_from_db()
        assert notif.is_read

    def test_mark_all_read(self):
        user = UserFactory()
        NotificationFactory(user=user)
        NotificationFactory(user=user)
        service = NotificationService()
        service.mark_all_as_read(user)
        assert Notification.objects.filter(user=user, is_read=False).count() == 0
