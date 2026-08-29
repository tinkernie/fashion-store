from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from .selectors import UserSelector


@shared_task(
    name="authentication.tasks.send_verification_email",
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def send_verification_email(user_id: str, token: str):
    """
    Async registration email — offloaded via .delay() so SMTP latency
    (500-3000ms) never blocks the 200ms HTTP registration response.
    """
    user = UserSelector.get_user_by_id(user_id)
    if not user:
        return
    subject = "Verify your email"
    message = f"Your verification code: {token}"
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])


@shared_task(
    name="authentication.tasks.send_password_reset_email",
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def send_password_reset_email(email: str, uidb64: str, token: str):
    """
    Async password-reset email — non-blocking; uses FRONTEND_URL to build
    reset link. Dispatched via send_password_reset_email.delay() in AuthService.
    """
    subject = "Password reset request"
    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?uid={uidb64}&token={token}"
    message = f"Click the link to reset your password: {reset_url}"
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])


@shared_task(name="authentication.tasks.cleanup_expired_tokens")
def cleanup_expired_tokens() -> dict:
    """
    Periodic cleanup (Beat: daily 02:00 UTC, crontab(hour=2, minute=0)).
    Deletes EmailVerificationToken + PasswordResetToken rows with
    created_at < now() - 48 hours. Prevents unbounded table growth
    and stale token reuse.

    Also cleans EmailChangeRequest (>48h) for hygiene if present.
    Returns counts for monitoring / beat logs.
    """
    cutoff = timezone.now() - timedelta(hours=48)

    from .models import EmailVerificationToken

    deleted_email, _ = EmailVerificationToken.objects.filter(
        created_at__lt=cutoff
    ).delete()

    # PasswordResetToken may be empty if using only default_token_generator — safe.
    deleted_pw = 0
    try:
        from .models import PasswordResetToken

        deleted_pw, _ = PasswordResetToken.objects.filter(
            created_at__lt=cutoff
        ).delete()
    except Exception:
        pass

    # Optional: also purge stale EmailChangeRequest (>48h)
    deleted_change = 0
    try:
        from users.models import EmailChangeRequest

        deleted_change, _ = EmailChangeRequest.objects.filter(
            created_at__lt=cutoff
        ).delete()
    except Exception:
        pass

    return {
        "deleted_email_verification_tokens": deleted_email,
        "deleted_password_reset_tokens": deleted_pw,
        "deleted_email_change_requests": deleted_change,
        "cutoff": cutoff.isoformat(),
    }
