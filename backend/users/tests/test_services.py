import pytest
from common.exceptions import BusinessException
from users.services import UserService
from users.selectors import UserSelector
from .factories import UserFactory, GroupFactory

@pytest.mark.django_db
class TestUserService:
    def test_update_profile(self):
        user = UserFactory()
        service = UserService()
        updated = service.update_profile(user, {'first_name': 'Bob'})
        assert updated.first_name == 'Bob'

    def test_update_profile_invalid_name_length(self):
        user = UserFactory()
        service = UserService()
        with pytest.raises(BusinessException):
            service.update_profile(user, {'first_name': 'A' * 151})

    def test_deactivate_user(self):
        admin = UserFactory(is_staff=True)
        target = UserFactory()
        service = UserService()
        service.deactivate_user(str(target.id), admin)
        target.refresh_from_db()
        assert not target.is_active

    def test_cannot_deactivate_self(self):
        admin = UserFactory(is_staff=True)
        service = UserService()
        with pytest.raises(BusinessException):
            service.deactivate_user(str(admin.id), admin)