from django.db.models import Prefetch
from .models import Wishlist, WishlistItem


class WishlistSelector:
    @staticmethod
    def get_wishlist_for_user(user) -> Wishlist or None:
        return (
            Wishlist.objects.filter(user=user)
            .prefetch_related(
                Prefetch(
                    "items", queryset=WishlistItem.objects.select_related("product")
                )
            )
            .first()
        )

    @staticmethod
    def get_wishlist_by_id(wishlist_id: str) -> Wishlist or None:
        return (
            Wishlist.objects.filter(id=wishlist_id)
            .prefetch_related(
                Prefetch(
                    "items", queryset=WishlistItem.objects.select_related("product")
                )
            )
            .first()
        )
