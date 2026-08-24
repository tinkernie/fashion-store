from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task
def send_notification_email(email, subject, body, notification_id):
    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )
    # Optionally update the notification record with a sent flag (not critical)
    if notification_id:
        from .models import Notification
        Notification.objects.filter(id=notification_id).update(
            context_json__email_sent=True
        )
