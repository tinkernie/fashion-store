from django.db.models import Prefetch
from .models import Order, OrderItem


class OrderSelector:
    @staticmethod
    def get_user_orders(user) -> list[Order]:
        return (
            Order.objects.filter(user=user)
            .prefetch_related(Prefetch("items", queryset=OrderItem.objects.all()))
            .order_by("-placed_at")
        )

    @staticmethod
    def get_order_by_number(order_number: str) -> Order or None:
        order = (
            Order.objects.filter(order_number=order_number)
            .prefetch_related(Prefetch("items", queryset=OrderItem.objects.all()), "status_history")
            .first()
        )
        if not order:
            try:
                order = (
                    Order.objects.filter(id=order_number)
                    .prefetch_related(Prefetch("items", queryset=OrderItem.objects.all()), "status_history")
                    .first()
                )
            except Exception:
                pass
        return order

    @staticmethod
    def get_order_by_id(order_id: str) -> Order or None:
        return (
            Order.objects.filter(id=order_id)
            .prefetch_related(
                Prefetch("items", queryset=OrderItem.objects.all()), "status_history"
            )
            .first()
        )

    @staticmethod
    def get_all_orders() -> list[Order]:
        return Order.objects.prefetch_related(
            Prefetch("items", queryset=OrderItem.objects.all())
        ).order_by("-placed_at")
