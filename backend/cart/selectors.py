from django.db.models import Prefetch
from .models import Cart, CartItem

class CartSelector:
    @staticmethod
    def get_cart_by_session(session_key: str) -> Cart or None:
        return Cart.objects.filter(session_key=session_key).prefetch_related(
            Prefetch('items', queryset=CartItem.objects.select_related('variant'))
        ).first()

    @staticmethod
    def get_cart_by_user(user) -> Cart or None:
        return Cart.objects.filter(user=user).prefetch_related(
            Prefetch('items', queryset=CartItem.objects.select_related('variant'))
        ).first()

    @staticmethod
    def get_cart_by_id(cart_id: str) -> Cart or None:
        return Cart.objects.filter(id=cart_id).prefetch_related(
            Prefetch('items', queryset=CartItem.objects.select_related('variant'))
        ).first()