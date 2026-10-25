import pytest
import uuid
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from common.exceptions import BusinessException
from products.services import ProductService
from cart.services import CartService
from coupons.models import Coupon
from products.tests.factories import ProductFactory
from variants.models import Variant
from variants.tests.factories import VariantFactory


def _session():
    return str(uuid.uuid4())


def _make_sellable_product(price=100000):
    """A published product with a real variant + inventory (placeholder excluded)."""
    from inventory.models import Inventory

    product = ProductFactory()
    variant = VariantFactory(product=product, price=price, status=Variant.Status.PUBLISHED)
    Inventory.objects.create(variant=variant, available_quantity=100, safety_stock=10)
    return product, variant


def _cart(variant, quantity=1):
    session = _session()
    variant_id = str(getattr(variant, "id", variant))
    data = CartService().add_item(None, session, variant_id, quantity)
    return session, data


def _percent_coupon(code="SAVE10", value=10):
    return Coupon.objects.create(
        code=code, discount_type=Coupon.DiscountType.PERCENTAGE, discount_value=value
    )


def _future(days=7):
    return timezone.now() + timedelta(days=days)


def _add_collection_discount(product, collection=None):
    if collection is None:
        from store_collections.tests.factories import CollectionFactory

        collection = CollectionFactory()
    ProductService.apply_collection_discount(
        [product], 20, _future(), collection_id=collection.id
    )
    product.refresh_from_db()
    return collection


@pytest.mark.django_db
class TestCartChargesDiscountedPrice:
    def test_add_item_snapshots_discounted_price(self):
        product, variant = _make_sellable_product()
        _add_collection_discount(product)
        _, data = _cart(variant.id)
        assert data["items"][0]["price"] == 80000
        assert data["subtotal"] == 80000
        assert data["total"] == 80000

    def test_add_item_before_discount_keeps_snapshot_till_update(self):
        # Item added while base priced keeps its snapshot; a quantity update
        # re-applies the (now active) discount.
        product, variant = _make_sellable_product()
        session, initial = _cart(variant.id)
        assert initial["items"][0]["price"] == 100000
        _add_collection_discount(product)
        data = CartService().update_quantity(None, session, str(variant.id), 2)
        assert data["items"][0]["price"] == 80000

    def test_update_quantity_after_expiry_falls_back_to_base_price(self):
        product, variant = _make_sellable_product()
        _add_collection_discount(product)
        product.discount_expires_at = timezone.now() - timedelta(hours=1)
        product.save(update_fields=["discount_expires_at"])
        session, _ = _cart(variant.id)
        data = CartService().update_quantity(None, session, str(variant.id), 1)
        assert data["items"][0]["price"] == 100000


@pytest.mark.django_db
class TestCouponNoStacking:
    def test_coupon_counts_only_eligible_items(self):
        promo, variant_promo = _make_sellable_product(price=200000)
        normal, variant_normal = _make_sellable_product(price=100000)
        _add_collection_discount(promo)  # promo item charges 160000
        session, _ = _cart(variant_promo)
        CartService().add_item(None, session, str(variant_normal.id), 1)
        coupon = _percent_coupon("MIX10", 10)
        data = CartService().apply_coupon(None, session, coupon.code)
        # eligible subtotal is 100000 -> 10% = 10000; promo item untouched
        assert data["discount_amount"] == 10000
        assert data["subtotal"] == 260000
        assert data["total"] == 250000

    def test_apply_coupon_rejected_when_everything_is_promo(self):
        promo, variant_promo = _make_sellable_product(price=200000)
        _add_collection_discount(promo)
        session, _data = _cart(variant_promo)
        coupon = _percent_coupon("NOPES", 10)
        with pytest.raises(BusinessException):
            CartService().apply_coupon(None, session, coupon.code)
        data = CartService().get_cart(None, session)
        assert data["coupon_code"] is None
        # the code must not be consumed on rejection
        coupon.refresh_from_db()
        assert coupon.used_count == 0

    def test_attached_coupon_dropped_when_cart_turns_all_promo(self):
        promo, variant_promo = _make_sellable_product(price=100000)
        session, initial = _cart(variant_promo)
        coupon = _percent_coupon("DROPME", 10)
        data = CartService().apply_coupon(None, session, coupon.code)
        assert data["discount_amount"] == 10000
        # discount becomes active -> coupon no longer provides benefit
        _add_collection_discount(promo)
        data = CartService().get_cart(None, session)
        assert data["coupon_code"] is None
        assert data["discount_amount"] == 0
        assert data["total"] == 80000


@pytest.mark.django_db
class TestCartCouponConsumptionInvariant:
    def test_fixed_coupon_only_reduces_eligible_subtotal(self):
        promo, variant_promo = _make_sellable_product(price=200000)
        normal, variant_normal = _make_sellable_product(price=100000)
        _add_collection_discount(promo)
        session, _da = _cart(variant_promo)
        CartService().add_item(None, session, str(variant_normal.id), 1)
        coupon = Coupon.objects.create(
            code="FIX50",
            discount_type=Coupon.DiscountType.FIXED_AMOUNT,
            discount_value=Decimal("50000"),
        )
        data = CartService().apply_coupon(None, session, coupon.code)
        # fixed 50000 capped at eligible subtotal 100000
        assert data["discount_amount"] == 50000
        assert data["total"] == 210000
