from django.db import models
from django.conf import settings
from common.models import BaseModel


class Wishlist(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist",
        db_index=True,
    )

    class Meta:
        db_table = "wishlist"

    def __str__(self):
        return f"Wishlist of {self.user.phone_number}"


class WishlistItem(BaseModel):
    wishlist = models.ForeignKey(
        Wishlist, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(
        "products.Product", on_delete=models.CASCADE, related_name="wishlist_items"
    )
    # No quantity, no price – just a saved product reference.

    class Meta:
        db_table = "wishlist_item"
        constraints = [
            models.UniqueConstraint(
                fields=["wishlist", "product"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_wishlistitem_wishlist_product_active",
            )
        ]

    def __str__(self):
        return f"{self.product.title} in {self.wishlist.user.phone_number}'s wishlist"
