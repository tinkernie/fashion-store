import logging
import smtplib
import socket
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.db.models import Q
from django.db.utils import OperationalError
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from .selectors import UserSelector

logger = logging.getLogger(__name__)


def _sanitize_subject(subject: str) -> str:
    """Prevent SMTP header injection by stripping newlines."""
    return subject.replace("\n", " ").replace("\r", " ").strip()[:300]


def _send_html_email(subject: str, to_email: str, template_name: str, context: dict):
    """Render HTML + text fallback and send via EmailMultiAlternatives."""
    subject = _sanitize_subject(subject)
    # Ensure frontend_url and email available in base template
    context.setdefault("frontend_url", settings.FRONTEND_URL)
    context.setdefault("email", to_email)
    context.setdefault("subject", subject)
    html_content = render_to_string(template_name, context)
    text_content = strip_tags(html_content)
    # Fallback if template missing text version - keep plain version
    if not text_content.strip():
        text_content = subject
    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)
    logger.info("Email sent via %s to %s subject=%s", template_name, to_email, subject)


@shared_task(
    name="authentication.tasks.send_verification_email",
    bind=True,
    acks_late=True,
    time_limit=60,
    soft_time_limit=45,
    autoretry_for=(smtplib.SMTPException, socket.error, ConnectionError, TimeoutError, OperationalError),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=3,
)
def send_verification_email(self, user_id: str, token: str):
    """
    Async registration email — offloaded via transaction.on_commit so SMTP latency
    never blocks the HTTP registration response. Uses HTML template with text fallback.
    """
    user = UserSelector.get_user_by_id(user_id)
    if not user:
        logger.warning("send_verification_email: user %s not found, skipping", user_id)
        return
    subject = "Verify your email — Luxe"
    verification_url = f"{settings.FRONTEND_URL}/auth/verify?token={token}"
    context = {
        "user_name": user.first_name or user.email.split("@")[0],
        "token": token,
        "verification_url": verification_url,
        "preheader": "Verify your email to activate your Luxe account",
    }
    _send_html_email(subject, user.email, "email/verification.html", context)


@shared_task(
    name="authentication.tasks.send_password_reset_email",
    bind=True,
    acks_late=True,
    time_limit=60,
    soft_time_limit=45,
    autoretry_for=(smtplib.SMTPException, socket.error, ConnectionError, TimeoutError, OperationalError),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=3,
)
def send_password_reset_email(self, email: str, uidb64: str, token: str):
    """
    Async password-reset email — non-blocking; uses FRONTEND_URL to build
    reset link. Dispatched via transaction.on_commit in AuthService. HTML template.
    """
    subject = "Reset your password — Luxe"
    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?uid={uidb64}&token={token}"
    context = {
        "reset_url": reset_url,
        "preheader": "Reset your Luxe password - link expires in 24 hours",
    }
    _send_html_email(subject, email, "email/password_reset.html", context)


@shared_task(
    name="authentication.tasks.cleanup_expired_tokens",
    bind=True,
    acks_late=True,
    time_limit=120,
    soft_time_limit=90,
    autoretry_for=(OperationalError, ConnectionError, TimeoutError),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=2,
)
def cleanup_expired_tokens(self) -> dict:
    """
    Periodic cleanup (Beat: daily 02:00 UTC, crontab(hour=2, minute=0)).
    Deletes EmailVerificationToken + PasswordResetToken rows with
    created_at < now() - 48 hours. Prevents unbounded table growth
    and stale token reuse.

    Optimization (ISSUE-14): tokens with is_used=True are deleted after 24h
    even if created_at is newer, to free table earlier.

    Also cleans EmailChangeRequest (>48h) for hygiene if present.
    Returns counts for monitoring / beat logs.
    """
    cutoff_48 = timezone.now() - timedelta(hours=48)
    cutoff_24 = timezone.now() - timedelta(hours=24)

    from .models import EmailVerificationToken

    with transaction.atomic():
        # Delete unused >48h OR used >24h
        deleted_email, _ = EmailVerificationToken.objects.filter(
            Q(created_at__lt=cutoff_48) | Q(is_used=True, created_at__lt=cutoff_24)
        ).delete()

    # PasswordResetToken may be empty if using only default_token_generator — safe.
    deleted_pw = 0
    try:
        from .models import PasswordResetToken

        with transaction.atomic():
            deleted_pw, _ = PasswordResetToken.objects.filter(
                Q(created_at__lt=cutoff_48) | Q(is_used=True, created_at__lt=cutoff_24)
            ).delete()
    except (ImportError, LookupError) as e:
        logger.debug("PasswordResetToken cleanup skipped: %s", e)
    except Exception as e:
        logger.exception("Unexpected error cleaning PasswordResetToken: %s", e)
        raise

    # Optional: also purge stale EmailChangeRequest (>48h) — used >24h
    deleted_change = 0
    try:
        from users.models import EmailChangeRequest

        with transaction.atomic():
            deleted_change, _ = EmailChangeRequest.objects.filter(
                Q(created_at__lt=cutoff_48) | Q(is_used=True, created_at__lt=cutoff_24)
            ).delete()
    except (ImportError, LookupError) as e:
        logger.debug("EmailChangeRequest cleanup skipped: %s", e)
    except Exception as e:
        logger.exception("Unexpected error cleaning EmailChangeRequest: %s", e)
        raise

    logger.info(
        "cleanup_expired_tokens: deleted_email=%s deleted_pw=%s deleted_change=%s cutoff_48=%s",
        deleted_email,
        deleted_pw,
        deleted_change,
        cutoff_48.isoformat(),
    )
    return {
        "deleted_email_verification_tokens": deleted_email,
        "deleted_password_reset_tokens": deleted_pw,
        "deleted_email_change_requests": deleted_change,
        "cutoff": cutoff_48.isoformat(),
    }
