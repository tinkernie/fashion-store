import uuid
from django.db import models
from django.conf import settings
from common.models import BaseModel


class Cart(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="cart",
        db_index=True,
    )
    session_key = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False, db_index=True
    )
    # coupon = models.ForeignKey(
    #     "coupons.Coupon",
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name="carts",
    # )

    class Meta:
        db_table = "cart"
        constraints = [
            models.UniqueConstraint(fields=["user"], name="unique_user_cart"),
        ]

    def __str__(self):
        if self.user:
            return f"Cart of {self.user.email}"
        return f"Guest cart {self.session_key}"


class CartItem(BaseModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(
        "variants.Variant", on_delete=models.CASCADE, related_name="cart_items"
    )
    quantity = models.PositiveIntegerField(default=1)
    price_snapshot = models.DecimalField(
        max_digits=10, decimal_places=2
    )  # price at add time
    reservation_id = models.CharField(
        max_length=100, null=True, blank=True
    )  # reference to inventory reservation

    class Meta:
        db_table = "cart_item"
        unique_together = ("cart", "variant")

    def __str__(self):
        return f"{self.quantity}x {self.variant.sku} in cart {self.cart_id}"
