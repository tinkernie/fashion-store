from django.db import transaction
from .models import Cart, CartItem
from common.exceptions import BusinessException


class CartRepository:
    @staticmethod
    def get_or_create_cart_by_session(session_key: str) -> Cart:
        cart = Cart.all_objects.filter(session_key=session_key).first()
        if cart:
            if cart.deleted_at:
                cart.deleted_at = None
                cart.save()
            return cart
        return Cart.objects.create(session_key=session_key)

    @staticmethod
    def get_or_create_cart_for_user(user) -> Cart:
        cart = Cart.all_objects.filter(user=user).first()
        if cart:
            if cart.deleted_at:
                cart.deleted_at = None
                cart.save()
            return cart
        return Cart.objects.create(user=user)

    @staticmethod
    def add_item(
        cart: Cart,
        variant_id: str,
        quantity: int,
        price_snapshot: str,
        reservation_id: str = None,
    ) -> CartItem:
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            variant_id=variant_id,
            defaults={
                "quantity": quantity,
                "price_snapshot": price_snapshot,
                "reservation_id": reservation_id,
            },
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
    def get_item(cart: Cart, variant_id) -> CartItem or None:
        item = cart.items.filter(variant_id=variant_id).first()
        if not item:
            item = cart.items.filter(variant__product_id=variant_id).first()
        return item
