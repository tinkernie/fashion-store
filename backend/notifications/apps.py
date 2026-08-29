from django.apps import AppConfig

class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'

    def ready(self):
        import notifications.signals  # noqa: F401
        import analytics.signals  # noqa: F401 ensure analytics signals loaded

        from .handlers import order_placed_handler, order_status_changed_handler
        from analytics.signals import order_placed
        from notifications.signals import order_status_changed

        order_status_changed.connect(order_status_changed_handler)
        # Wire order confirmation email + SMS to order_placed (dispatched in orders/services.py)
        order_placed.connect(order_placed_handler)