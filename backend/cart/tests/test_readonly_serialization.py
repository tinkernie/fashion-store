from decimal import Decimal
import uuid
import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from cart.models import Cart, CartItem
from cart.services import CartService
from variants.tests.factories import VariantFactory
from coupons.tests.factories import CouponFactory


@pytest.mark.django_db
class TestCartSerializationReadOnly:
    def test_get_cart_does_not_mutate_price_snapshot_or_execute_updates(self):
        """Issue 7: Read-only semantics must not overwrite CartItem.price_snapshot."""
        variant = VariantFactory(price=200000, status="published")
        session_key = uuid.uuid4()
        cart = Cart.objects.create(session_key=session_key)
        item = CartItem.objects.create(
            cart=cart,
            variant=variant,
            quantity=1,
            price_snapshot=Decimal("150000"),
        )
        original_updated_at = item.updated_at

        service = CartService()
        with CaptureQueriesContext(connection) as queries:
            result = service.get_cart(session_key=str(session_key))

        # 1. Serialized response displays current effective price
        assert result["items"][0]["price"] == 200000
        assert result["subtotal"] == 200000

        # 2. Database state is completely untouched
        item.refresh_from_db()
        assert item.price_snapshot == Decimal("150000")
        assert item.updated_at == original_updated_at

        # 3. Verify zero UPDATE or INSERT queries were executed
        update_queries = [
            q["sql"] for q in queries.captured_queries
            if q["sql"].strip().upper().startswith("UPDATE")
            or q["sql"].strip().upper().startswith("INSERT")
        ]
        assert update_queries == [], f"Expected 0 write queries on GET cart, got: {update_queries}"

    def test_get_cart_does_not_mutate_coupon_when_ineligible(self):
        """Issue 7: Ineligible coupon must be omitted in memory without DB mutation."""
        variant = VariantFactory(price=100000, status="published")
        # Mark product as discount active so coupon is ineligible under no-stacking
        variant.product.discount_percent = 20
        variant.product.discount_price = 80000
        variant.product.save(update_fields=["discount_percent", "discount_price", "updated_at"])

        coupon = CouponFactory(code="SAVE10", discount_type="percent", discount_value=10)
        session_key = uuid.uuid4()
        cart = Cart.objects.create(session_key=session_key, coupon=coupon)
        CartItem.objects.create(
            cart=cart,
            variant=variant,
            quantity=1,
            price_snapshot=Decimal("80000"),
        )

        service = CartService()
        with CaptureQueriesContext(connection) as queries:
            result = service.get_cart(session_key=str(session_key))

        # Serialized response omits coupon benefit in memory
        assert result["coupon_code"] is None
        assert result["discount_amount"] == 0

        # Database still keeps coupon FK (no DB mutation on read)
        cart.refresh_from_db()
        assert cart.coupon_id == coupon.id

        update_queries = [
            q["sql"] for q in queries.captured_queries
            if q["sql"].strip().upper().startswith("UPDATE")
        ]
        assert update_queries == [], f"Expected 0 UPDATE queries on GET cart, got: {update_queries}"
