"""Regression tests for coupon validity windows.

`CouponService.validate_and_calculate` locks the coupon row with
`select_for_update()`, but that query only filtered on `code` and `is_active`.
It therefore always matched an existing coupon and never fell through to
`CouponSelector.get_active_coupon_by_code()` — the only place that checked
`valid_from` / `valid_until`. An expired coupon was still discounted, which is
a direct financial loss. These tests pin the locked lookup to the same rules.
"""
from decimal import Decimal

import pytest
from django.utils import timezone

from common.exceptions import BusinessException
from common.tests.factories import UserFactory
from coupons.services import CouponService

from .factories import CouponFactory

ITEMS = [{"price": Decimal("100"), "quantity": 1}]


def _validate(code):
    return CouponService().validate_and_calculate(code, UserFactory(), ITEMS)


@pytest.mark.django_db
class TestCouponValidityWindow:
    def test_expired_coupon_is_rejected(self):
        CouponFactory(
            code="EXPIRED10",
            discount_type="percentage",
            discount_value=10,
            valid_until=timezone.now() - timezone.timedelta(minutes=1),
        )
        with pytest.raises(BusinessException):
            _validate("EXPIRED10")

    def test_not_yet_valid_coupon_is_rejected(self):
        CouponFactory(
            code="FUTURE10",
            discount_type="percentage",
            discount_value=10,
            valid_from=timezone.now() + timezone.timedelta(days=1),
        )
        with pytest.raises(BusinessException):
            _validate("FUTURE10")

    def test_coupon_inside_window_is_applied(self):
        CouponFactory(
            code="ACTIVE10",
            discount_type="percentage",
            discount_value=10,
            valid_from=timezone.now() - timezone.timedelta(hours=1),
            valid_until=timezone.now() + timezone.timedelta(hours=1),
        )
        result = _validate("ACTIVE10")
        assert result["discount"] == Decimal("10")

    def test_coupon_without_window_is_still_applied(self):
        # null bounds mean "no limit" on that side; the fix must not close
        # coupons that never had a window.
        CouponFactory(code="OPEN10", discount_type="percentage", discount_value=10)
        result = _validate("OPEN10")
        assert result["discount"] == Decimal("10")
