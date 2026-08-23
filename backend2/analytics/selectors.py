from django.db.models import Count, Sum, F, Q
from django.utils import timezone
from datetime import timedelta
from .models import TrackedEvent
from orders.models import Order
from cart.models import Cart


class AnalyticsSelector:
    @staticmethod
    def get_events(filters: dict = None, limit: int = 100):
        qs = TrackedEvent.objects.all()
        if filters:
            if 'type' in filters:
                qs = qs.filter(type=filters['type'])
            if 'user_id' in filters:
                qs = qs.filter(user_id=filters['user_id'])
            if 'since' in filters:
                qs = qs.filter(timestamp__gte=filters['since'])
        return qs[:limit]

    @staticmethod
    def get_sales_summary(start_date, end_date):
        orders = Order.objects.filter(
            placed_at__gte=start_date,
            placed_at__lte=end_date,
            status__in=[Order.Status.PAID, Order.Status.PACKING, Order.Status.SHIPPING,
                        Order.Status.DELIVERED, Order.Status.RETURNED, Order.Status.REFUNDED]
        )
        summary = orders.aggregate(
            total_orders=Count('id'),
            total_revenue=Sum('total'),
            avg_order_value=Sum('total') / Count('id'),
        )
        return {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'total_orders': summary['total_orders'] or 0,
            'total_revenue': str(summary['total_revenue'] or 0),
            'avg_order_value': str(round(summary['avg_order_value'], 2) if summary['avg_order_value'] else 0),
        }

    @staticmethod
    def get_popular_products(limit=10):
        from orders.models import OrderItem
        popular = OrderItem.objects.filter(
            order__status__in=[Order.Status.PAID, Order.Status.PACKING, Order.Status.SHIPPING,
                               Order.Status.DELIVERED]
        ).values('product_snapshot__title').annotate(
            total_quantity=Sum('quantity')
        ).order_by('-total_quantity')[:limit]
        return [
            {'title': item['product_snapshot__title'], 'units_sold': item['total_quantity']}
            for item in popular
        ]

    @staticmethod
    def get_cart_abandonment_rate():
        # Abandoned carts: those not converted to orders (no matching order placed within 2 hours)
        # We'll approximate: carts that have been updated > 2 hours ago and have no order placed for that user.
        now = timezone.now()
        two_hours_ago = now - timedelta(hours=2)
        # Users who placed orders within last 2 hours (converted)
        converted_user_ids = Order.objects.filter(
            placed_at__gte=two_hours_ago
        ).values_list('user_id', flat=True).distinct()
        # Active carts (updated within last 2 hours) whose user not in converted list
        abandoned_carts = Cart.objects.filter(
            updated_at__gte=two_hours_ago,
        ).exclude(user_id__in=converted_user_ids)
        total_active_carts = Cart.objects.filter(updated_at__gte=two_hours_ago).count()
        abandoned_count = abandoned_carts.count()
        if total_active_carts == 0:
            return {'rate': 0, 'abandoned': 0, 'total': 0}
        return {
            'rate': round(abandoned_count / total_active_carts * 100, 2),
            'abandoned': abandoned_count,
            'total_active': total_active_carts,
        }
