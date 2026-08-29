from django.db import models
from django.utils import timezone
from .models import Coupon


class CouponSelector:
    @staticmethod
    def get_active_coupon_by_code(code: str) -> Coupon or None:
        now = timezone.now()
        return Coupon.objects.filter(
            code__iexact=code,
            is_active=True,
            deleted_at__isnull=True,
        ).filter(
            models.Q(valid_from__isnull=True) | models.Q(valid_from__lte=now),
            models.Q(valid_until__isnull=True) | models.Q(valid_until__gte=now),
        ).first()


    @staticmethod
    def get_coupon_by_id(coupon_id) -> Coupon or None:
        return Coupon.objects.filter(id=coupon_id).first()

    @staticmethod
    def get_all_coupons_admin() -> list[Coupon]:
        return Coupon.objects.filter(deleted_at__isnull=True).order_by('-created_at')
