from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .selectors import UserSelector

@shared_task
def send_email_change_verification(token_id: str, new_email: str, token: str):
    subject = "Confirm your new email address"
    # In production, this would be a link; for now we send the token
    message = f"Your confirmation code is: {token}"
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [new_email])