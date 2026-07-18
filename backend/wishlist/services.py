from .repositories import WishlistRepository
from .selectors import WishlistSelector
from common.exceptions import BusinessException
from products.selectors import ProductSelector


class WishlistService:
    def get_wishlist(self, user) -> dict:
        wishlist = WishlistSelector.get_wishlist_for_user(user)
        if not wishlist:
            # Auto-create on first access
            wishlist = WishlistRepository.get_or_create_wishlist(user)
        return self._serialize_wishlist(wishlist)

    def add_item(self, user, product_id: str) -> dict:
        # Validate product exists and is visible
        product = ProductSelector.get_product_by_id(product_id)
        if not product or product.status != "published":
            raise BusinessException("Product not available.")
        wishlist = WishlistRepository.get_or_create_wishlist(user)
        WishlistRepository.add_item(wishlist, product_id)
        # Refresh to get updated items
        wishlist = WishlistSelector.get_wishlist_for_user(user)
        return self._serialize_wishlist(wishlist)

    def remove_item(self, user, product_id: str) -> dict:
        wishlist = WishlistRepository.get_or_create_wishlist(user)
        WishlistRepository.remove_item(wishlist, product_id)
        wishlist = WishlistSelector.get_wishlist_for_user(user)
        return self._serialize_wishlist(wishlist)

    def clear_wishlist(self, user) -> dict:
        wishlist = WishlistRepository.get_or_create_wishlist(user)
        WishlistRepository.clear_wishlist(wishlist)
        return {"message": "Wishlist cleared."}

    def _serialize_wishlist(self, wishlist) -> dict:
        items = []
        for item in wishlist.items.all():
            product = item.product
            items.append(
                {
                    "id": str(item.id),
                    "product_id": str(product.id),
                    "title": product.title,
                    "slug": product.slug,
                    "image": None,  # placeholder for future media
                    "price_range": None,  # placeholder until pricing service
                }
            )
        return {
            "id": str(wishlist.id),
            "user_id": str(wishlist.user_id),
            "items": items,
            "count": len(items),
        }
