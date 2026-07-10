from django.db import transaction
from .models import Cart, CartItem
from common.exceptions import BusinessException


class CartRepository:
    @staticmethod
    def get_or_create_cart_by_session(session_key: str) -> Cart:
        return Cart.objects.get_or_create(session_key=session_key)[0]

    @staticmethod
    def get_or_create_cart_for_user(user) -> Cart:
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    @staticmethod
    def add_item(cart: Cart, variant_id: str, quantity: int, price_snapshot: str,
                 reservation_id: str = None) -> CartItem:
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            variant_id=variant_id,
            defaults={
                'quantity': quantity,
                'price_snapshot': price_snapshot,
                'reservation_id': reservation_id,
            }
        )
        if not created:
            # Item already exists: update quantity and reservation
            item.quantity += quantity
            item.reservation_id = reservation_id
            item.price_snapshot = price_snapshot  # update to latest price? Could keep original, but spec says price snapshot at add. We'll update for simplicity.
            item.save()
        return item

    @staticmethod
    def update_item(item: CartItem, quantity: int = None, reservation_id: str = None):
        if quantity is not None:
            item.quantity = quantity
        if reservation_id is not None:
            item.reservation_id = reservation_id
        item.save()

    @staticmethod
    def remove_item(item: CartItem):
        item.delete()

    @staticmethod
    def clear_cart(cart: Cart):
        cart.items.all().delete()

    @staticmethod
    def delete_cart(cart: Cart):
        cart.delete()


class CartItemRepository:
    @staticmethod
    def get_item(cart: Cart, variant_id: str) -> CartItem or None:
        return cart.items.filter(variant_id=variant_id).first()
