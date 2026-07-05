import pytest
from rest_framework.test import APIClient
from rest_framework import status
from .factories import UserFactory

@pytest.mark.django_db
class TestAuthEndpoints:
    def test_register(self, mocker):
        mocker.patch('authentication.tasks.send_verification_email.delay')
        client = APIClient()
        response = client.post('/api/v1/auth/register/', {
            'email': 'newuser@test.com',
            'password': 'ValidPass1!',
            'first_name': 'A',
        })
        assert response.status_code == status.HTTP_201_CREATED

    def test_login(self):
        user = UserFactory(email='login@test.com')
        user.set_password('ValidPass1!')
        user.save()
        client = APIClient()
        response = client.post('/api/v1/auth/login/', {
            'email': 'login@test.com',
            'password': 'ValidPass1!',
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data