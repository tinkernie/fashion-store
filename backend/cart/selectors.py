from django.db.models import Prefetch
from .models import Cart, CartItem


class CartSelector:
    @staticmethod
    def get_cart_by_session(session_key: str) -> Cart or None:
        if not session_key:
            return None
        import uuid
        try:
            uuid.UUID(str(session_key))
        except Exception:
            return None
        cart = (
            Cart.all_objects.filter(session_key=session_key)
            .prefetch_related(
                Prefetch("items", queryset=CartItem.objects.select_related("variant"))
            )
            .first()
        )
        if cart and cart.deleted_at:
            cart.deleted_at = None
            cart.save(update_fields=["deleted_at", "updated_at"])
        return cart

    @staticmethod
    def get_cart_by_user(user) -> Cart or None:
        if not user or not user.is_authenticated:
            return None
        cart = (
            Cart.all_objects.filter(user=user)
            .prefetch_related(
                Prefetch("items", queryset=CartItem.objects.select_related("variant"))
            )
            .first()
        )
        if cart and cart.deleted_at:
            cart.deleted_at = None
            cart.save(update_fields=["deleted_at", "updated_at"])
        return cart

    @staticmethod
    def get_cart_by_id(cart_id: str) -> Cart or None:
        return (
            Cart.objects.filter(id=cart_id)
            .prefetch_related(
                Prefetch("items", queryset=CartItem.objects.select_related("variant"))
            )
            .first()
        )
