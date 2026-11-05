import pytest
from decimal import Decimal
from unittest.mock import patch, MagicMock
from orders.services import OrderService
from orders.models import Order
from cart.tests.factories import CartFactory, CartItemFactory
from inventory.tests.factories import InventoryFactory
from variants.tests.factories import VariantFactory
from common.tests.factories import UserFactory
from common.exceptions import BusinessException
from .factories import OrderFactory


@pytest.mark.django_db
class TestOrderCreation:
    @patch("orders.services.InventoryService.commit_reservation")
    def test_create_order_from_cart(self, mock_commit):
        user = UserFactory()
        variant = VariantFactory(price=Decimal("100.00"), status="published")
        cart = CartFactory(user=user)
        item = CartItemFactory(
            cart=cart,
            variant=variant,
            quantity=2,
            price_snapshot=Decimal("100.00"),
            reservation_id="res-123",
        )
        service = OrderService()
        result = service.create_order_from_cart(
            user=user,
            shipping_address={"province": "تهران", "city": "تهران", "address": "خیابان تست"},
        )
        assert result["order_number"].startswith("MAVI-")
        assert result["status"] == "pending"
        assert len(result["items"]) == 1
        assert result["items"][0]["product_snapshot"]["title"] == variant.product.title
        assert cart.items.count() == 0
        mock_commit.assert_called_once_with("res-123")

    @patch("orders.services.InventoryService.commit_reservation")
    def test_create_order_with_store_pickup(self, mock_commit):
        user = UserFactory()
        variant = VariantFactory(price=Decimal("100.00"), status="published")
        cart = CartFactory(user=user)
        CartItemFactory(
            cart=cart,
            variant=variant,
            quantity=1,
            price_snapshot=Decimal("100.00"),
            reservation_id="res-pickup-1",
        )
        service = OrderService()
        result = service.create_order_from_cart(
            user=user, shipping_method="pickup"
        )
        assert result["shipping_method"] == "pickup"
        assert result["shipping_cost"] == 0
        assert result["shipping_address"]["type"] == "pickup"
        assert "فروشگاه" in result["shipping_address"]["title"]
        assert result["status"] == "pending"
        assert cart.items.count() == 0
        mock_commit.assert_called_once_with("res-pickup-1")

    @patch("inventory.services.InventoryService.commit_reservation")
    def test_order_creation_applies_coupon(self, mock_commit):
        from coupons.tests.factories import CouponFactory
        coupon = CouponFactory(code="SAVE20", discount_type="percentage", discount_value=20, min_purchase=0)
        user = UserFactory()
        variant = VariantFactory(price=100, status="published")
        cart = CartFactory(user=user, coupon=coupon)
        CartItemFactory(cart=cart, variant=variant, quantity=1, price_snapshot="100.00", reservation_id="res")
        service = OrderService()
        order = service.create_order_from_cart(user, shipping_method="pickup")
        assert order["discount_amount"] == 20
        assert order["total"] == 80
        coupon.refresh_from_db()
        assert coupon.used_count == 1


@pytest.mark.django_db
class TestStatusTransitions:
    def test_valid_transition(self):
        order = OrderFactory(status=Order.Status.PENDING)
        service = OrderService()
        result = service.transition_status(str(order.id), Order.Status.AWAITING_PAYMENT)
        assert result["status"] == Order.Status.AWAITING_PAYMENT

    def test_invalid_transition(self):
        order = OrderFactory(status=Order.Status.PENDING)
        service = OrderService()
        with pytest.raises(BusinessException):
            service.transition_status(str(order.id), Order.Status.DELIVERED)
