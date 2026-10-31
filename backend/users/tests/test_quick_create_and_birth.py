import pytest
from django.conf import settings
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from common.tests.factories import UserFactory

User = get_user_model()

QUICK_CREATE_URL = "/api/admin/users/quick-create/"


@pytest.mark.django_db
class TestQuickCreateUser:
    def _client(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def test_staff_creates_user_with_default_password(self, settings):
        settings.QUICK_CREATE_PASSWORD = "12345"
        staff = UserFactory(is_staff=True, phone_number="09355500001")
        resp = self._client(staff).post(
            QUICK_CREATE_URL,
            {"phone_number": "09355500002", "birth_date": "1370/05/21"},
        )
        assert resp.status_code == 201
        user = User.objects.get(phone_number="09355500002")
        assert user.is_active
        assert not user.is_staff
        assert (user.birth_year, user.birth_month, user.birth_day) == (1370, 5, 21)
        assert user.check_password("12345")

    def test_superuser_can_use_endpoint(self, settings):
        su = UserFactory(is_superuser=True, phone_number="09355500003")
        resp = self._client(su).post(
            QUICK_CREATE_URL,
            {"phone_number": "09355500004", "birth_date": "1365-01-01"},
        )
        assert resp.status_code == 201

    def test_regular_user_forbidden(self):
        customer = UserFactory(phone_number="09355500005")
        resp = self._client(customer).post(
            QUICK_CREATE_URL,
            {"phone_number": "09355500006", "birth_date": "1370/05/21"},
        )
        assert resp.status_code == 403

    def test_duplicate_phone_rejected(self):
        staff = UserFactory(is_staff=True, phone_number="09355500007")
        resp = self._client(staff).post(
            QUICK_CREATE_URL,
            {"phone_number": "09355500007", "birth_date": "1370/05/21"},
        )
        assert resp.status_code == 400

    def test_invalid_jalali_date_rejected(self):
        staff = UserFactory(is_staff=True, phone_number="09355500008")
        for bad in ("1370/13/01", "1370/07/31", "1400/12/30", "12/1/1"):
            resp = self._client(staff).post(
                QUICK_CREATE_URL,
                {"phone_number": "09355500009", "birth_date": bad},
            )
            assert resp.status_code == 400, bad

    def test_birth_date_validation_leap_day(self):
        from users.validators import JalaliDateValidator

        assert (1399, 12, 30) == JalaliDateValidator.validate("1399/12/30")
        with pytest.raises(Exception):
            JalaliDateValidator.validate("1400/12/30")


@pytest.mark.django_db
class TestProfileBirthDate:
    def test_profile_returns_jalali_birth_date(self):
        user = UserFactory(
            phone_number="09355500010",
            birth_year=1370, birth_month=5, birth_day=21,
        )
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.get("/api/users/me/")
        assert resp.json()["birth_date"] == "1370/05/21"
