from django.core.management.base import BaseCommand
from notifications.models import NotificationTemplate

DEFAULT_TEMPLATES = [
    {
        'type': 'order_confirmation',
        'subject_template': 'Order {{ order_number }} confirmed',
        'body_template': 'Dear {{ user_name }}, your order {{ order_number }} has been placed. Total: {{ order_total }}.',
    },
    {
        'type': 'order_status_change',
        'subject_template': 'Order {{ order_number }} status updated',
        'body_template': 'Your order {{ order_number }} is now {{ new_status }} (was {{ old_status }}).',
    },
    {
        'type': 'shipping_update',
        'subject_template': 'Your order {{ order_number }} has shipped',
        'body_template': 'Great news! Your order {{ order_number }} has been shipped.',
    },
    {
        'type': 'password_reset',
        'subject_template': 'Password reset request',
        'body_template': 'Click the link to reset your password: {{ reset_url }}',
    },
    {
        'type': 'welcome',
        'subject_template': 'Welcome to Luxe!',
        'body_template': 'Hi {{ user_name }}, thank you for joining Luxe.',
    },
]


class Command(BaseCommand):
    help = 'Initialize default notification templates'

    def handle(self, *args, **options):
        for tpl in DEFAULT_TEMPLATES:
            NotificationTemplate.objects.get_or_create(
                type=tpl['type'],
                defaults={
                    'subject_template': tpl['subject_template'],
                    'body_template': tpl['body_template'],
                    'is_active': True,
                }
            )
        self.stdout.write(self.style.SUCCESS('Notification templates initialized.'))
