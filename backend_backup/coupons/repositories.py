from django.db import transaction
from .models import Coupon, CouponUsage
from common.exceptions import BusinessException


class CouponRepository:
    @staticmethod
    def create_coupon(**validated_data) -> Coupon:
        return Coupon.objects.create(**validated_data)

    @staticmethod
    def update_coupon(coupon: Coupon, **fields) -> Coupon:
        allowed = {
            'code', 'discount_type', 'discount_value', 'min_purchase',
            'max_uses', 'max_per_user', 'valid_from', 'valid_until',
            'is_active', 'conditions'
        }
        for key, value in fields.items():
            if key in allowed:
                setattr(coupon, key, value)
        coupon.save()
        return coupon

    @staticmethod
    def delete_coupon(coupon: Coupon):
        coupon.delete()  # soft delete via BaseModel

    @staticmethod
    @transaction.atomic
    def increment_used_count(coupon: Coupon, user, order):
        # Lock coupon row to safely increment
        coupon = Coupon.objects.select_for_update().get(pk=coupon.pk)
        if coupon.max_uses is not None and coupon.used_count >= coupon.max_uses:
            raise BusinessException("Coupon usage limit reached.")
        coupon.used_count += 1
        coupon.save(update_fields=['used_count', 'updated_at'])
        CouponUsage.objects.create(coupon=coupon, user=user, order=order)

    @staticmethod
    def get_coupon_usage_count(coupon: Coupon, user) -> int:
        return CouponUsage.objects.filter(coupon=coupon, user=user).count()
