from django.contrib import admin
from .models import NotificationTemplate, Notification, UserNotificationPreference


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['type', 'subject_template', 'is_active']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'type', 'subject', 'is_read', 'created_at']
    list_filter = ['type', 'is_read']


@admin.register(UserNotificationPreference)
class UserNotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_order_updates', 'email_account']
