from django.db import transaction
from django.template import Template, Context
from django.conf import settings
from .repositories import (
    NotificationRepository,
    TemplateRepository,
    PreferenceRepository,
)
from .selectors import NotificationSelector, PreferenceSelector
from .tasks import send_sms
from common.exceptions import BusinessException
from .models import Notification


class NotificationService:
    def send_notification(self, user, type: str, context: dict = None, send_sms_flag: bool = True) -> dict:
        """Create in-app notification and dispatch SMS via sms.ir (no email)."""
        from .models import NotificationTemplate
        allowed_types = [c[0] for c in NotificationTemplate.TYPE_CHOICES]
        if type not in allowed_types:
            raise BusinessException(f"Invalid notification type: {type}")
        if context and len(str(context)) > 5000:
            raise BusinessException("Notification context too large.")
        if context is None:
            context = {}
        if context.get('new_status') and 'new_status_fa' not in context:
            try:
                from .constants import get_persian_status
                context['new_status_fa'] = get_persian_status(context['new_status'])
            except Exception:
                pass
        if context.get('old_status') and 'old_status_fa' not in context:
            try:
                from .constants import get_persian_status
                context['old_status_fa'] = get_persian_status(context['old_status'])
            except Exception:
                pass

        prefs = PreferenceRepository.get_or_create_preferences(user)
        sms_allowed = self._is_sms_allowed(type, prefs)
        if send_sms_flag and sms_allowed:
            try:
                template = TemplateRepository.get_template(type)
                subject = self._render_template_string(template.subject_template, context)
                body = self._render_template_string(template.body_template, context)
            except BusinessException:
                fallback_subjects = {
                    "order_confirmation": "سفارش {{ order_number }} با موفقیت ثبت شد",
                    "order_status_change": "وضعیت سفارش {{ order_number }}: {{ new_status_fa|default:new_status }}",
                    "shipping_update": "سفارش {{ order_number }} تحویل پست شد",
                    "welcome": "به فروشگاه تخصصی ماوی خوش آمدید",
                    "back_in_stock": "{{ product_title }} دوباره موجود شد",
                    "generic": "اطلاعیه سیستم",
                }
                fallback_bodies = {
                    "order_confirmation": "{{ user_name }} عزیز، سفارش {{ order_number }} به مبلغ {{ total }} تومان ثبت شد. فاکتور: {{ invoice_url }}",
                    "order_status_change": "{{ user_name }} عزیز، وضعیت سفارش {{ order_number }} به «{{ new_status_fa|default:new_status }}» تغییر یافت.",
                    "shipping_update": "{{ user_name }} عزیز، مرسوله سفارش {{ order_number }} تحویل شرکت پست گردید. کد رهگیری: {{ tracking_number|default:'---' }}",
                    "welcome": "{{ user_name }} عزیز، به فروشگاه تخصصی ماوی خوش آمدید!",
                    "back_in_stock": "{{ product_title }} ({{ options }}) هم‌اکنون موجود است.",
                    "generic": "{{ user_name }} عزیز، شما یک اعلان جدید دارید.",
                }
                subject = self._render_template_string(fallback_subjects.get(type, "اطلاعیه سیستم"), context)
                body = self._render_template_string(fallback_bodies.get(type, "یک پیام سیستمی جدید برای شما ثبت شده است."), context)
        else:
            subject = ""
            body = ""

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

        if send_sms_flag and sms_allowed and getattr(user, "phone_number", None):
            nid = str(notification.id) if notification else None
            sms_text = f"{subject} {body}".strip()[:300] if (subject or body) else subject or body
            phone = user.phone_number
            transaction.on_commit(lambda: send_sms.delay(phone, sms_text or subject, nid))

        return {
            'notification_id': str(notification.id) if notification else None,
            'sms_sent': sms_allowed,
            'in_app': in_app_allowed,
        }

    # Backward compat: send_email kwarg maps to SMS
    def send_notification_legacy(self, *args, **kwargs):
        if "send_email" in kwargs:
            kwargs["send_sms_flag"] = kwargs.pop("send_email")
        return self.send_notification(*args, **kwargs)

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
            'sms_order_updates': prefs.sms_order_updates,
            'sms_promotions': prefs.sms_promotions,
            'sms_account': prefs.sms_account,
            'in_app_order_updates': prefs.in_app_order_updates,
            'in_app_account': prefs.in_app_account,
        }

    def update_preferences(self, user, data: dict) -> dict:
        prefs = PreferenceRepository.update_preferences(user, **data)
        return self.get_preferences(user)

    def _is_sms_allowed(self, type, prefs) -> bool:
        mapping = {
            'order_confirmation': prefs.sms_order_updates,
            'order_status_change': prefs.sms_order_updates,
            'shipping_update': prefs.sms_order_updates,
            'welcome': prefs.sms_account,
            'generic': True,
        }
        return mapping.get(type, True)

    def _is_inapp_allowed(self, type, prefs) -> bool:
        mapping = {
            'order_confirmation': prefs.in_app_order_updates,
            'order_status_change': prefs.in_app_order_updates,
            'shipping_update': prefs.in_app_order_updates,
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


class StockAlertService:
    """'Notify me when available' subscriptions: max 5 active per user,
    any mix of products. Only subscribable while actually out of stock."""

    MAX_ALERTS = 5

    def list_alerts(self, user) -> list:
        from .models import BackInStockAlert

        alerts = (
            BackInStockAlert.objects.filter(user=user, deleted_at__isnull=True)
            .select_related("variant__product")
            .order_by("-created_at")
        )
        return [self._serialize(a) for a in alerts]

    def add_alert(self, user, variant_id: str) -> dict:
        from django.db import IntegrityError, transaction as _tx
        from .models import BackInStockAlert
        from variants.selectors import VariantSelector

        variant = VariantSelector.get_variant_by_id(variant_id)
        if not variant:
            raise BusinessException("Variant not found.")
        try:
            inv = variant.inventory
            sellable = (inv.available_quantity or 0) - (inv.reserved_quantity or 0)
        except Exception:
            sellable = 0
        if sellable > 0:
            raise BusinessException("This variant is already available.")
        if BackInStockAlert.objects.filter(user=user).count() >= self.MAX_ALERTS:
            raise BusinessException(
                f"At most {self.MAX_ALERTS} alerts. Remove one to add another."
            )
        if BackInStockAlert.objects.filter(user=user, variant=variant).exists():
            raise BusinessException("You are already watching this variant.")
        try:
            with _tx.atomic():
                alert = BackInStockAlert.objects.create(user=user, variant=variant)
        except IntegrityError:
            raise BusinessException("You are already watching this variant.")
        return self._serialize(alert)

    def remove_alert(self, user, alert_id: str) -> dict:
        from .models import BackInStockAlert

        alert = BackInStockAlert.objects.filter(user=user, id=alert_id).first()
        if not alert:
            raise BusinessException("Alert not found.")
        alert.delete()  # soft delete; re-subscribing later is allowed
        return {"message": "Alert removed."}

    def _serialize(self, alert) -> dict:
        variant = alert.variant
        product = variant.product
        try:
            inv = variant.inventory
            sellable = max(0, (inv.available_quantity or 0) - (inv.reserved_quantity or 0))
        except Exception:
            sellable = 0
        return {
            "id": str(alert.id),
            "variant_id": str(variant.id),
            "sku": variant.sku,
            "product_id": str(product.id),
            "product_title": product.title,
            "product_slug": product.slug,
            "options": [
                {"option_name": vo.option.name, "value": vo.option_value.value}
                for vo in variant.variantoption_set.select_related("option", "option_value").all()
            ],
            "in_stock_now": sellable > 0,
            "current_sellable": sellable,
            "last_notified_at": alert.last_notified_at.isoformat() if alert.last_notified_at else None,
            "created_at": alert.created_at.isoformat(),
        }
