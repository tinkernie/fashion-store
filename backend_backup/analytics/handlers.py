from .services import AnalyticsService


def cart_changed_handler(sender, user, session_key, action, variant_id, quantity, **kwargs):
    service = AnalyticsService()
    service.record_event(
        user=user,
        session_key=session_key,
        type=f'cart_{action}',
        payload={'variant_id': str(variant_id), 'quantity': quantity}
    )


def order_placed_handler(sender, user, order, items_data, **kwargs):
    service = AnalyticsService()
    service.record_event(
        user=user,
        session_key=None,
        type='order_placed',
        payload={
            'order_id': str(order.id),
            'order_number': order.order_number,
            'total': str(order.total),
            'items': [
                {'variant_id': str(item.get('variant_id')), 'quantity': item.get('quantity')}
                for item in items_data
            ]
        }
    )
