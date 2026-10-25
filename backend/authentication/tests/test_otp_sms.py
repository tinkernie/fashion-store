"""sms.ir production templates + hardened public OTP endpoint contract.

Owner decisions encoded here:
- purpose=signup (+ phone-change, internal login rows) -> template 875605
- purpose=reset -> template 120372
- public OTP login is BLOCKED (login stays phone+password)
"""
from unittest.mock import patch

import pytest
from django.conf import settings
from django.utils import timezone
from rest_framework.test import APIClient

from authentication.models import OtpCode
from notifications.tasks import _otp_template_for

MOCK_MSG = "If the number is valid, an OTP has been sent."
PHONE = "09123456789"


@pytest.mark.django_db
class TestOtpTemplateRouting:
    def test_signup_maps_to_owner_login_template(self):
        assert _otp_template_for("signup") == settings.SMS_IR_TEMPLATE_SIGNUP

    def test_reset_maps_to_owner_recovery_template(self):
        assert _otp_template_for("reset") == settings.SMS_IR_TEMPLATE_RESET

    def test_internal_login_rows_share_signup_template(self):
        # Phone-change rows carry purpose=login; they reuse template 875605.
        assert _otp_template_for("login") == settings.SMS_IR_TEMPLATE_SIGNUP

    def test_unmapped_purpose_falls_back_to_generic_template(self):
        assert _otp_template_for("zzz") == settings.SMS_IR_OTP_TEMPLATE_ID
        assert _otp_template_for(None) == settings.SMS_IR_OTP_TEMPLATE_ID


@pytest.mark.django_db
class TestRequestOtpTemplateDispatch:
    def test_signup_request_dispatches_signup_template(self, django_capture_on_commit_callbacks):
        client = APIClient()
        with patch("notifications.tasks.send_otp_sms") as task:
            with django_capture_on_commit_callbacks(execute=True):
                resp = client.post(
                    "/api/auth/otp/request/",
                    {"phone_number": PHONE, "purpose": "signup"},
                    format="json",
                )
        assert resp.status_code == 200
        assert resp.data["message"] == MOCK_MSG
        task.delay.assert_called_once()
        phone, code, purpose = task.delay.call_args.args
        assert phone == PHONE
        assert code.isdigit()
        assert purpose == "signup"
        assert OtpCode.objects.filter(phone_number=PHONE, purpose="signup").exists()

    def test_reset_request_dispatches_reset_purpose(self, django_capture_on_commit_callbacks):
        client = APIClient()
        with patch("notifications.tasks.send_otp_sms") as task:
            with django_capture_on_commit_callbacks(execute=True):
                resp = client.post(
                    "/api/auth/otp/request/",
                    {"phone_number": PHONE, "purpose": "reset"},
                    format="json",
                )
        assert resp.status_code == 200
        _phone, _code, purpose = task.delay.call_args.args
        assert purpose == "reset"

    def test_otp_login_is_blocked_on_request(self):
        client = APIClient()
        resp = client.post(
            "/api/auth/otp/request/",
            {"phone_number": PHONE, "purpose": "login"},
            format="json",
        )
        assert resp.status_code == 400
        assert OtpCode.objects.filter(phone_number=PHONE).count() == 0

    def test_unknown_purpose_is_rejected_at_serializer_level(self):
        client = APIClient()
        resp = client.post(
            "/api/auth/otp/request/",
            {"phone_number": PHONE, "purpose": "whatever"},
            format="json",
        )
        assert resp.status_code == 400

    def test_default_purpose_is_signup(self, django_capture_on_commit_callbacks):
        client = APIClient()
        with patch("notifications.tasks.send_otp_sms") as task:
            with django_capture_on_commit_callbacks(execute=True):
                resp = client.post(
                    "/api/auth/otp/request/", {"phone_number": PHONE}, format="json"
                )
        assert resp.status_code == 200
        _phone, _code, purpose = task.delay.call_args.args
        assert purpose == "signup"


@pytest.mark.django_db
class TestVerifyOtpHardening:
    def _make_otp(self, purpose, code):
        otp = OtpCode(
            phone_number=PHONE,
            purpose=purpose,
            expires_at=timezone.now() + timezone.timedelta(minutes=3),
        )
        otp.code_hash = OtpCode.hash_code(code)
        otp.save()
        return otp

    def test_verify_login_purpose_blocked(self):
        self._make_otp("login", "12345")
        client = APIClient()
        resp = client.post(
            "/api/auth/otp/verify/",
            {"phone_number": PHONE, "code": "12345", "purpose": "login"},
            format="json",
        )
        assert resp.status_code == 400
        # the row must remain available for its internal consumer
        assert OtpCode.objects.filter(phone_number=PHONE, is_used=False).exists()

    def test_signup_verify_still_works(self):
        self._make_otp("signup", "54321")
        client = APIClient()
        resp = client.post(
            "/api/auth/otp/verify/",
            {"phone_number": PHONE, "code": "54321", "purpose": "signup"},
            format="json",
        )
        assert resp.status_code == 200
        assert "signup_token" in resp.data

    def test_signup_verify_rejects_registered_number(self):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        User.objects.create_user(PHONE)
        self._make_otp("signup", "55555")
        client = APIClient()
        resp = client.post(
            "/api/auth/otp/verify/",
            {"phone_number": PHONE, "code": "55555", "purpose": "signup"},
            format="json",
        )
        assert resp.status_code == 400

    def test_reset_verify_never_issues_a_session(self):
        self._make_otp("reset", "98765")
        client = APIClient()
        resp = client.post(
            "/api/auth/otp/verify/",
            {"phone_number": PHONE, "code": "98765", "purpose": "reset"},
            format="json",
        )
        assert resp.status_code == 200
        assert "access" not in resp.data
        assert "refresh" not in resp.data


@pytest.mark.django_db
class TestPhoneChangeStaysOnSharedTemplate:
    def test_change_phone_sends_with_login_purpose(self, django_capture_on_commit_callbacks):
        from django.contrib.auth import get_user_model
        from users.services import UserService

        User = get_user_model()
        user = User.objects.create_user("09311111111")
        with patch("notifications.tasks.send_otp_sms") as task:
            with django_capture_on_commit_callbacks(execute=True):
                result = UserService().change_phone_request(user, "09020000000")
        assert "sent" in result["message"]
        phone, _raw, purpose = task.delay.call_args.args
        assert phone == "09020000000"
        assert purpose == "login"
        assert OtpCode.objects.filter(
            phone_number="09020000000", purpose="login", is_used=False
        ).exists()
