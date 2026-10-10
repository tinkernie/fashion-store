from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from common.models import BaseModel


class Coupon(BaseModel):
    class DiscountType(models.TextChoices):
        PERCENTAGE = 'percentage', 'Percentage'
        FIXED_AMOUNT = 'fixed', 'Fixed Amount'

    code = models.CharField(max_length=50, db_index=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices)
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text='Percentage (0‑100) or fixed amount'
    )
    min_purchase = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Minimum order subtotal for coupon to apply'
    )
    max_uses = models.PositiveIntegerField(null=True, blank=True, help_text='Max total uses')
    max_per_user = models.PositiveIntegerField(null=True, blank=True, help_text='Max uses per user')
    used_count = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    conditions = models.JSONField(default=dict, blank=True,
                                  help_text='Additional rules: {"category_ids": [...], "product_ids": [...]}')

    class Meta:
        db_table = 'coupon'
        constraints = [
            models.UniqueConstraint(
                fields=['code'],
                condition=models.Q(deleted_at__isnull=True),
                name='uq_coupon_code_active',
            )
        ]

    def __str__(self):
        return self.code


class CouponUsage(BaseModel):
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='usages')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coupon_usages')
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='coupon_usages')

    class Meta:
        db_table = 'coupon_usage'
