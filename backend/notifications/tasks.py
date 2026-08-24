from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def send_notification_email(self, email, subject, body, notification_id):
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)

    if notification_id:
        from .models import Notification
        with transaction.atomic():
            notification = Notification.objects.select_for_update().get(id=notification_id)
            notification.context_json = {
                **notification.context_json,
                "email_sent": True,
            }
            notification.save(update_fields=["context_json", "updated_at"])

# @shared_task
# def send_notification_email(email, subject, body, notification_id):
#     send_mail(
#         subject,
#         body,
#         settings.DEFAULT_FROM_EMAIL,
#         [email],
#         fail_silently=False,
#     )
#     # Optionally update the notification record with a sent flag (not critical)
#     if notification_id:
#         from .models import Notification
#         Notification.objects.filter(id=notification_id).update(
#             context_json__email_sent=True
#         )
