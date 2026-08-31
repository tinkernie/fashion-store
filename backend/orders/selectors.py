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
        # M2: strict match only on order_number, no UUID fallback to prevent BOLA confusion
        if not order_number:
            return None
        return (
            Order.objects.filter(order_number=order_number)
            .prefetch_related(Prefetch("items", queryset=OrderItem.objects.all()), "status_history")
            .first()
        )

    @staticmethod
    def get_order_by_id(order_id: str) -> Order or None:
        if not order_id:
            return None
        import uuid
        is_valid_uuid = False
        try:
            uuid.UUID(str(order_id))
            is_valid_uuid = True
        except Exception:
            pass

        if is_valid_uuid:
            order = (
                Order.objects.filter(id=order_id)
                .prefetch_related(
                    Prefetch("items", queryset=OrderItem.objects.all()), "status_history"
                )
                .first()
            )
            if order:
                return order

        return (
            Order.objects.filter(order_number=order_id)
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
