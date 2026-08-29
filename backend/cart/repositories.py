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
                cart.save(update_fields=["deleted_at", "updated_at"])
            return cart
        return Cart.objects.create(session_key=session_key)

    @staticmethod
    def get_or_create_cart_for_user(user) -> Cart:
        cart = Cart.all_objects.filter(user=user).first()
        if cart:
            if cart.deleted_at:
                cart.deleted_at = None
                cart.save(update_fields=["deleted_at", "updated_at"])
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
        # Check all_objects to handle any previously soft-deleted item
        item = CartItem.all_objects.filter(cart=cart, variant_id=variant_id).first()
        if item:
            item.deleted_at = None
            item.quantity = quantity
            item.price_snapshot = price_snapshot
            item.reservation_id = reservation_id
            item.save()
            return item

        return CartItem.objects.create(
            cart=cart,
            variant_id=variant_id,
            quantity=quantity,
            price_snapshot=price_snapshot,
            reservation_id=reservation_id,
        )

    @staticmethod
    def update_item(item: CartItem, quantity: int = None, reservation_id: str = None):
        if quantity is not None:
            item.quantity = quantity
        if reservation_id is not None:
            item.reservation_id = reservation_id
        item.save()

    @staticmethod
    def remove_item(item: CartItem):
        item.hard_delete()

    @staticmethod
    def clear_cart(cart: Cart):
        CartItem.all_objects.filter(cart=cart).delete()

    @staticmethod
    def delete_cart(cart: Cart):
        CartItem.all_objects.filter(cart=cart).delete()
        cart.hard_delete()


class CartItemRepository:
    @staticmethod
    def get_item(cart: Cart, variant_id: str) -> CartItem or None:
        return cart.items.filter(variant_id=variant_id).first()
