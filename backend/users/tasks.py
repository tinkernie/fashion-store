import logging
import smtplib
import socket

from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db.utils import OperationalError
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def _sanitize_subject(subject: str) -> str:
    return subject.replace("\n", " ").replace("\r", " ").strip()[:300]


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
    Includes retry/backoff only for transient SMTP/network failures. HTML with text fallback.
    """
    subject = _sanitize_subject("Confirm your new email address — Luxe")
    confirmation_url = f"{settings.FRONTEND_URL}/auth/confirm-email?token={token}"
    context = {
        "new_email": new_email,
        "token": token,
        "confirmation_url": confirmation_url,
        "frontend_url": settings.FRONTEND_URL,
        "preheader": "Confirm your new email for Luxe",
    }
    html_content = render_to_string("email/email_change.html", context)
    text_content = strip_tags(html_content)
    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[new_email],
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)
    logger.info("send_email_change_verification sent to %s token_id=%s", new_email, token_id)
