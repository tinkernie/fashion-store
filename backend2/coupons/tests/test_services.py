import pytest
from decimal import Decimal
from coupons.services import CouponService
from coupons.models import Coupon, CouponUsage
from .factories import CouponFactory, CouponUsageFactory
from common.tests.factories import UserFactory
from common.exceptions import BusinessException


@pytest.mark.django_db
class TestCouponValidation:
    def test_valid_percentage(self):
        coupon = CouponFactory(code='SAVE10', discount_type='percentage', discount_value=10, min_purchase=50)
        user = UserFactory()
        service = CouponService()
        items = [{'variant_id': '123', 'quantity': 2, 'price': Decimal('30.00'), 'category_id': None}]
        result = service.validate_and_calculate('SAVE10', user, items)
        assert result['discount'] == Decimal('6.00')  # 10% of 60

    def test_fixed_amount(self):
        coupon = CouponFactory(code='FLAT5', discount_type='fixed', discount_value=5, min_purchase=10)
        user = UserFactory()
        items = [{'price': Decimal('20.00'), 'quantity': 1}]
        service = CouponService()
        result = service.validate_and_calculate('FLAT5', user, items)
        assert result['discount'] == Decimal('5.00')

    def test_fixed_exceeds_subtotal(self):
        coupon = CouponFactory(code='FLAT50', discount_type='fixed', discount_value=50, min_purchase=10)
        user = UserFactory()
        items = [{'price': Decimal('20.00'), 'quantity': 1}]
        service = CouponService()
        result = service.validate_and_calculate('FLAT50', user, items)
        assert result['discount'] == Decimal('20.00')

    def test_inactive_coupon(self):
        CouponFactory(code='INACTIVE', is_active=False)
        service = CouponService()
        with pytest.raises(BusinessException):
            service.validate_and_calculate('INACTIVE', UserFactory(), [])

    def test_expired_coupon(self):
        from django.utils import timezone
        coupon = CouponFactory(code='EXPIRED', valid_until=timezone.now() - timezone.timedelta(days=1))
        service = CouponService()
        with pytest.raises(BusinessException):
            service.validate_and_calculate('EXPIRED', UserFactory(), [])

    def test_min_purchase_not_met(self):
        coupon = CouponFactory(code='MIN50', min_purchase=50)
        service = CouponService()
        items = [{'price': Decimal('10.00'), 'quantity': 2}]  # total 20
        with pytest.raises(BusinessException):
            service.validate_and_calculate('MIN50', UserFactory(), items)

    def test_max_per_user_exceeded(self):
        coupon = CouponFactory(code='LIMIT1', max_per_user=1)
        user = UserFactory()
        CouponUsageFactory(coupon=coupon, user=user)
        service = CouponService()
        with pytest.raises(BusinessException):
            service.validate_and_calculate('LIMIT1', user, [])

    def test_conditions_category(self):
        coupon = CouponFactory(code='CAT', conditions={'category_ids': ['cat1']})
        user = UserFactory()
        items = [{'price': 10, 'quantity': 1, 'category_id': 'cat2'}]  # no match
        service = CouponService()
        with pytest.raises(BusinessException):
            service.validate_and_calculate('CAT', user, items)
        items2 = [{'price': 10, 'quantity': 1, 'category_id': 'cat1'}]
        result = service.validate_and_calculate('CAT', user, items2)
        assert result['discount'] > 0
