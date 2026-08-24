import factory
from factory.django import DjangoModelFactory
from coupons.models import Coupon, CouponUsage
from common.tests.factories import UserFactory
from orders.tests.factories import OrderFactory


class CouponFactory(DjangoModelFactory):
    class Meta:
        model = Coupon

    code = factory.Sequence(lambda n: f"CODE{n:04d}")
    discount_type = Coupon.DiscountType.PERCENTAGE
    discount_value = 10
    min_purchase = 0
    is_active = True


class CouponUsageFactory(DjangoModelFactory):
    class Meta:
        model = CouponUsage

    coupon = factory.SubFactory(CouponFactory)
    user = factory.SubFactory(UserFactory)
    order = factory.SubFactory(OrderFactory)
