from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .selectors import UserSelector


@shared_task
def send_verification_email(user_id: str, token: str):
    user = UserSelector.get_user_by_id(user_id)
    if not user:
        return
    subject = "Verify your email"
    message = f"Your verification code: {token}"
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])


@shared_task
def send_password_reset_email(email: str, uidb64: str, token: str):
    subject = "Password reset request"
    reset_url = f"{settings.FRONTEND_URL}/password-reset/{uidb64}/{token}/"
    message = f"Click the link to reset your password: {reset_url}"
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
