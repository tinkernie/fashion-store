from django.apps import AppConfig

class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'

    def ready(self):
        import notifications.signals
        from .handlers import order_status_changed_handler
        from notifications.signals import order_status_changed
        order_status_changed.connect(order_status_changed_handler)