from .services import NotificationService


def order_status_changed_handler(sender, order, old_status, new_status, **kwargs):
    service = NotificationService()
    user = order.user
    type = 'order_status_change'
    context = {
        'order_number': order.order_number,
        'old_status': old_status,
        'new_status': new_status,
        'user_name': user.first_name,
    }
    service.send_notification(user, type, context, send_email=True)
