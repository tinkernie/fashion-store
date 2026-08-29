from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task(
    name="users.tasks.send_email_change_verification",
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def send_email_change_verification(token_id: str, new_email: str, token: str):
    """
    Async email-change confirmation — offloaded via .delay() in UserService.
    SMTP latency (500-3000ms) must not block the HTTP PATCH /users/me/ response.
    Includes retry/backoff for transient SMTP failures.
    """
    subject = "Confirm your new email address"
    message = f"Your confirmation code is: {token}"
    # In production this would be a FRONTEND_URL link: /auth/confirm-email?token=...
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [new_email])
