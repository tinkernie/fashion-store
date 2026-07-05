import pytest
from authentication.services import AuthService
from authentication.repositories import UserRepository
from common.exceptions import BusinessException
from .factories import UserFactory

@pytest.mark.django_db
class TestAuthService:
    def test_register_user_success(self, mocker):
        service = AuthService()
        mocker.patch('authentication.tasks.send_verification_email.delay')
        result = service.register_user('new@example.com', 'ValidPass1!', 'New', 'User')
        assert result['email'] == 'new@example.com'
        user = UserRepository.get_user_by_email('new@example.com')
        assert not user.is_active

    def test_register_duplicate_email(self):
        UserFactory(email='existing@example.com')
        service = AuthService()
        with pytest.raises(BusinessException):
            service.register_user('existing@example.com', 'ValidPass1!')

    def test_login_inactive_user(self):
        user = UserFactory(is_active=False)
        service = AuthService()
        with pytest.raises(BusinessException):
            service.login_user(user.email, 'SecurePass123!')

    def test_verify_email(self, mocker):
        service = AuthService()
        mocker.patch('authentication.tasks.send_verification_email.delay')
        service.register_user('verify@example.com', 'ValidPass1!')
        from authentication.models import EmailVerificationToken
        token = EmailVerificationToken.objects.first()
        result = service.verify_email(str(token.token))
        assert result['message'] == 'Email verified successfully.'
        user = UserRepository.get_user_by_email('verify@example.com')
        assert user.is_active