import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .factories import NotificationFactory

User = get_user_model()


@pytest.mark.django_db
class TestUserEndpoints:
    def test_list_notifications(self):
        user = User.objects.create_user('user@test.com', 'pass')
        NotificationFactory(user=user, type='welcome', subject='Welcome', body='Hi')
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.get('/api/v1/notifications/')
        assert resp.status_code == 200
        assert resp.data['unread_count'] == 1
        assert len(resp.data['notifications']) == 1

    def test_mark_as_read(self):
        user = User.objects.create_user('user@test.com', 'pass')
        notif = NotificationFactory(user=user)
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.post('/api/v1/notifications/mark-read/', {'notification_id': str(notif.id)})
        assert resp.status_code == 200
        notif.refresh_from_db()
        assert notif.is_read

    def test_preferences(self):
        user = User.objects.create_user('user@test.com', 'pass')
        client = APIClient()
        client.force_authenticate(user=user)
        # get default prefs
        resp = client.get('/api/v1/notifications/preferences/')
        assert resp.data['email_order_updates'] is True
        # update
        resp = client.patch('/api/v1/notifications/preferences/', {'email_order_updates': False}, format='json')
        assert resp.status_code == 200
        assert resp.data['email_order_updates'] is False
