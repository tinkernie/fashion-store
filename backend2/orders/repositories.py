from django.db import transaction
from .models import Order, OrderItem, OrderStatusHistory, OrderSequence
from common.exceptions import BusinessException


class OrderRepository:
    @staticmethod
    def generate_order_number() -> str:
        return OrderSequence.get_next_number()

    @staticmethod
    @transaction.atomic
    def create_order(user_id: str, data: dict, items_data: list[dict]) -> Order:
        order = Order.objects.create(user_id=user_id, **data)
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order

    @staticmethod
    def update_status(order: Order, new_status: str, note: str = ""):
        old_status = order.status
        order.status = new_status
        order.save(update_fields=["status", "updated_at"])
        # Create history entry
        OrderStatusHistory.objects.create(
            order=order,
            from_status=old_status,
            to_status=new_status,
            note=note,
        )

    @staticmethod
    def save_order(order: Order):
        order.save()
