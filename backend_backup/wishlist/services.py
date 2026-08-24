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
        product = ProductSelector.get_product_by_id(product_id) or ProductSelector.get_product_by_slug(product_id)
        if not product or product.status != "published":
            raise BusinessException("Product not available.")
        wishlist = WishlistRepository.get_or_create_wishlist(user)
        WishlistRepository.add_item(wishlist, str(product.id))
        # Refresh to get updated items
        wishlist = WishlistSelector.get_wishlist_for_user(user)
        return self._serialize_wishlist(wishlist)

    def remove_item(self, user, product_id: str) -> dict:
        product = ProductSelector.get_product_by_id(product_id) or ProductSelector.get_product_by_slug(product_id)
        actual_id = str(product.id) if product else product_id
        wishlist = WishlistRepository.get_or_create_wishlist(user)
        WishlistRepository.remove_item(wishlist, actual_id)
        wishlist = WishlistSelector.get_wishlist_for_user(user)
        return self._serialize_wishlist(wishlist)

    def clear_wishlist(self, user) -> dict:
        wishlist = WishlistRepository.get_or_create_wishlist(user)
        WishlistRepository.clear_wishlist(wishlist)
        return {"message": "Wishlist cleared."}

    def _serialize_wishlist(self, wishlist) -> dict:
        items = []
        from media_libm.selectors import MediaSelector

        for item in wishlist.items.all():
            product = item.product
            main_img = MediaSelector.get_main_image_for_product(product)
            img_url = (main_img.get("url") if isinstance(main_img, dict) else None) or (product.metadata.get("image") if isinstance(product.metadata, dict) else None) or "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
            first_var = product.variants.filter(deleted_at__isnull=True).order_by("price").first()
            price_val = float(first_var.price) if first_var else 0

            items.append(
                {
                    "id": str(product.id),
                    "product_id": str(product.id),
                    "name": product.title,
                    "title": product.title,
                    "slug": product.slug,
                    "category": product.category.name if product.category else "",
                    "price": price_val,
                    "imageUrl": img_url,
                    "image": main_img,
                    "price_range": price_val,
                }
            )
        return {
            "id": str(wishlist.id),
            "user_id": str(wishlist.user_id),
            "items": items,
            "count": len(items),
        }
