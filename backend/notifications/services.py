from django.db import transaction
from django.template import Template, Context
from django.conf import settings
from .repositories import (
    NotificationRepository,
    TemplateRepository,
    PreferenceRepository,
)
from .selectors import NotificationSelector, PreferenceSelector
from .tasks import send_notification_email
from common.exceptions import BusinessException
from .models import Notification


class NotificationService:
    def send_notification(self, user, type: str, context: dict = None, send_email: bool = True) -> dict:
        """
        Create an in-app notification and conditionally send an email.
        """
        # Check user preferences for email
        prefs = PreferenceRepository.get_or_create_preferences(user)
        email_allowed = self._is_email_allowed(type, prefs)
        if send_email and email_allowed:
            # Render template for email
            template = TemplateRepository.get_template(type)
            subject = self._render_template_string(template.subject_template, context)
            body = self._render_template_string(template.body_template, context)
        else:
            subject = ""
            body = ""

        # Always create in-app notification if user has in-app preference
        in_app_allowed = self._is_inapp_allowed(type, prefs)
        notification = None
        if in_app_allowed:
            notification = NotificationRepository.create_notification(
                user=user,
                type=type,
                subject=subject,
                body=body,
                context=context,
            )

        # Dispatch email via Celery if allowed — after commit to ensure Notification exists
        if send_email and email_allowed:
            nid = str(notification.id) if notification else None
            transaction.on_commit(
                lambda: send_notification_email.delay(user.email, subject, body, nid)
            )

        return {
            'notification_id': str(notification.id) if notification else None,
            'email_sent': email_allowed,
            'in_app': in_app_allowed,
        }

    def mark_as_read(self, user, notification_id: str):
        notification = Notification.objects.filter(id=notification_id, user=user).first()
        if not notification:
            raise BusinessException("Notification not found.")
        NotificationRepository.mark_as_read(notification)

    def mark_all_as_read(self, user):
        NotificationRepository.mark_all_as_read(user)

    def get_notifications(self, user, unread_only: bool = False) -> dict:
        qs = NotificationSelector.get_notifications_for_user(
            user,
            is_read=False if unread_only else None,
            limit=50,
        )
        return {
            'unread_count': NotificationSelector.get_unread_count(user),
            'notifications': [
                {
                    'id': str(n.id),
                    'type': n.type,
                    'subject': n.subject,
                    'body': n.body,
                    'is_read': n.is_read,
                    'created_at': n.created_at.isoformat(),
                }
                for n in qs
            ],
        }

    def get_preferences(self, user) -> dict:
        prefs = PreferenceRepository.get_or_create_preferences(user)
        return {
            'email_order_updates': prefs.email_order_updates,
            'email_promotions': prefs.email_promotions,
            'email_account': prefs.email_account,
            'in_app_order_updates': prefs.in_app_order_updates,
            'in_app_account': prefs.in_app_account,
        }

    def update_preferences(self, user, data: dict) -> dict:
        prefs = PreferenceRepository.update_preferences(user, **data)
        return self.get_preferences(user)

    # Helper to determine if email should be sent based on type
    def _is_email_allowed(self, type, prefs) -> bool:
        mapping = {
            'order_confirmation': prefs.email_order_updates,
            'order_status_change': prefs.email_order_updates,
            'shipping_update': prefs.email_order_updates,
            'password_reset': prefs.email_account,
            'welcome': prefs.email_account,
            'generic': True,
        }
        return mapping.get(type, True)

    def _is_inapp_allowed(self, type, prefs) -> bool:
        mapping = {
            'order_confirmation': prefs.in_app_order_updates,
            'order_status_change': prefs.in_app_order_updates,
            'shipping_update': prefs.in_app_order_updates,
            'password_reset': prefs.in_app_account,
            'welcome': prefs.in_app_account,
            'generic': True,
        }
        return mapping.get(type, True)

    def _render_template_string(self, template_str, context):
        if not context:
            return template_str
        t = Template(template_str)
        c = Context(context)
        return t.render(c)
