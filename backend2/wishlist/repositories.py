from .models import Wishlist, WishlistItem
from common.exceptions import BusinessException


class WishlistRepository:
    @staticmethod
    def get_or_create_wishlist(user) -> Wishlist:
        wishlist, _ = Wishlist.objects.get_or_create(user=user)
        return wishlist

    @staticmethod
    def add_item(wishlist: Wishlist, product_id: str) -> WishlistItem:
        item, created = WishlistItem.objects.get_or_create(
            wishlist=wishlist,
            product_id=product_id,
        )
        if not created:
            raise BusinessException(
                "Product already in wishlist.", code="already_exists"
            )
        return item

    @staticmethod
    def remove_item(wishlist: Wishlist, product_id: str):
        deleted_count, _ = WishlistItem.objects.filter(
            wishlist=wishlist, product_id=product_id
        ).delete()
        if deleted_count == 0:
            raise BusinessException("Product not in wishlist.", code="not_found")

    @staticmethod
    def clear_wishlist(wishlist: Wishlist):
        wishlist.items.all().delete()
