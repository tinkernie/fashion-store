import pytest
from rest_framework.test import APIClient
from rest_framework import status
from .factories import UserFactory


@pytest.mark.django_db
class TestUserEndpoints:
    def test_get_me(self):
        user = UserFactory()
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.get('/api/v1/users/me/')
        assert resp.status_code == 200
        assert resp.data['email'] == user.email

    def test_admin_list_users(self):
        admin = UserFactory(is_staff=True)
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.get('/api/v1/users/')
        assert resp.status_code == 200
        assert len(resp.data['results']) >= 1
