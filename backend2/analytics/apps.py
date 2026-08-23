from django.apps import AppConfig


class AnalyticsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'analytics'

    def ready(self):
        import analytics.signals
        from .handlers import cart_changed_handler, order_placed_handler
        from analytics.signals import cart_changed, order_placed
        cart_changed.connect(cart_changed_handler)
        order_placed.connect(order_placed_handler)
