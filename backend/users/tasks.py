import logging
import smtplib
import socket

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.db.utils import OperationalError

logger = logging.getLogger(__name__)


@shared_task(
    name="users.tasks.send_email_change_verification",
    bind=True,
    acks_late=True,
    time_limit=60,
    soft_time_limit=45,
    autoretry_for=(smtplib.SMTPException, socket.error, ConnectionError, TimeoutError, OperationalError),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=3,
)
def send_email_change_verification(self, token_id: str, new_email: str, token: str):
    """
    Async email-change confirmation — offloaded via transaction.on_commit in UserService.
    SMTP latency (500-3000ms) must not block the HTTP PATCH /users/me/ response.
    Includes retry/backoff only for transient SMTP/network failures.
    """
    subject = "Confirm your new email address"
    message = f"Your confirmation code is: {token}"
    # In production this would be a FRONTEND_URL link: /auth/confirm-email?token=...
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [new_email])
    logger.info("send_email_change_verification sent to %s token_id=%s", new_email, token_id)
