from decimal import Decimal
import pytest
from unittest.mock import patch, MagicMock
from cart.services import CartService
from cart.selectors import CartSelector
from .factories import CartFactory, CartItemFactory
from variants.tests.factories import VariantFactory
from common.tests.factories import UserFactory
from inventory.models import Reservation


@pytest.mark.django_db
class TestCartService:
    @patch("cart.services.InventoryService.reserve_stock")
    def test_add_item_guest(self, mock_reserve):
        mock_reserve.return_value = {
            "reservation_id": "res-123",
            "expires_at": "...",
            "reserved_quantity": 1,
        }
        service = CartService()
        variant = VariantFactory(status="published")
        result = service.add_item(
            user=None,
            session_key="550e8400-e29b-41d4-a716-446655440000",
            variant_id=str(variant.id),
            quantity=2,
        )
        assert len(result["items"]) == 1
        assert result["items"][0]["quantity"] == 2

    @patch("cart.services.InventoryService.release_reservation")
    @patch("cart.services.InventoryService.reserve_stock")
    def test_update_quantity(self, mock_reserve, mock_release):
        variant = VariantFactory(status="published")
        cart = CartFactory(session_key="test-key")
        item = CartItemFactory(
            cart=cart,
            variant=variant,
            quantity=1,
            price_snapshot="10.00",
            reservation_id="res-old",
        )
        mock_reserve.return_value = {
            "reservation_id": "res-new",
            "expires_at": "...",
            "reserved_quantity": 3,
        }
        service = CartService()
        result = service.update_quantity(
            user=None, session_key="test-key", variant_id=str(variant.id), quantity=3
        )
        assert result["items"][0]["quantity"] == 3
        mock_release.assert_called_once_with("res-old")
        mock_reserve.assert_called_once_with(str(variant.id), 3, user_id=None)

    @patch("cart.services.InventoryService.release_reservation")
    def test_clear_cart(self, mock_release):
        variant = VariantFactory()
        cart = CartFactory(session_key="clear-key")
        CartItemFactory(cart=cart, variant=variant, reservation_id="res-1")
        service = CartService()
        service.clear_cart(user=None, session_key="clear-key")
        assert cart.items.count() == 0
        mock_release.assert_called_once_with("res-1")

    @patch('coupons.services.CouponService.validate_and_calculate')
    def test_apply_coupon(self, mock_validate):
        from coupons.tests.factories import CouponFactory
        coupon = CouponFactory(code='TEST')
        mock_validate.return_value = {'coupon_id': str(coupon.id), 'code': 'TEST', 'discount': Decimal('5.00')}
        user = UserFactory()
        cart = CartFactory(user=user)
        CartItemFactory(cart=cart, price_snapshot='20.00', quantity=1)
        service = CartService()
        result = service.apply_coupon(user, None, 'TEST')
        assert 'coupon_code' in result
        assert result['coupon_code'] == 'TEST'
        assert result['discount'] == 5.0  # serialized
