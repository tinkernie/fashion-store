import logging
import smtplib
import socket
from datetime import timedelta

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.db.utils import OperationalError
from django.utils import timezone

from .selectors import UserSelector

logger = logging.getLogger(__name__)


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
    (500-3000ms) never blocks the HTTP registration response.
    Retry only on transient SMTP/network/DB errors, not BusinessException.
    """
    user = UserSelector.get_user_by_id(user_id)
    if not user:
        logger.warning("send_verification_email: user %s not found, skipping", user_id)
        return
    subject = "Verify your email"
    message = f"Your verification code: {token}"
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])


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
    reset link. Dispatched via transaction.on_commit in AuthService.
    """
    subject = "Password reset request"
    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?uid={uidb64}&token={token}"
    message = f"Click the link to reset your password: {reset_url}"
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])


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
