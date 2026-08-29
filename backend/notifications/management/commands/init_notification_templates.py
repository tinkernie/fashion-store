from django.core.management.base import BaseCommand
from notifications.models import NotificationTemplate

DEFAULT_TEMPLATES = [
    {
        'type': 'order_confirmation',
        'subject_template': 'Order {{ order_number }} confirmed — Luxe',
        'body_template': 'Hi {{ user_name }}, your order {{ order_number }} ({{ total }}) has been placed. Invoice: {{ invoice_url }}. Items: {{ items|length }} item(s).',
    },
    {
        'type': 'order_status_change',
        'subject_template': 'Order {{ order_number }} is now {{ new_status|upper }}',
        'body_template': 'Hi {{ user_name }}, order {{ order_number }} changed from {{ old_status }} to {{ new_status }}. View: {{ frontend_url }}/orders/{{ order_number }}',
    },
    {
        'type': 'shipping_update',
        'subject_template': 'Your order {{ order_number }} has shipped — Luxe',
        'body_template': 'Hi {{ user_name }}, great news! Order {{ order_number }} shipped. Tracking: {{ tracking_number|default:"pending" }} {{ tracking_url|default:"" }}',
    },
    {
        'type': 'password_reset',
        'subject_template': 'Reset your password — Luxe',
        'body_template': 'Hi {{ user_name|default:"there" }}, reset your password: {{ reset_url }} (expires in 24h)',
    },
    {
        'type': 'welcome',
        'subject_template': 'Welcome to Luxe, {{ user_name }}!',
        'body_template': 'Hi {{ user_name }}, welcome to Luxe! Explore: {{ frontend_url }}/collections',
    },
    {
        'type': 'generic',
        'subject_template': 'Notification from Luxe',
        'body_template': 'Hi {{ user_name|default:"there" }}, you have a new notification: {{ message|default:"" }}',
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
