import pytest
from common.exceptions import BusinessException
from wishlist.services import WishlistService
from .factories import WishlistFactory, WishlistItemFactory
from products.tests.factories import ProductFactory
from common.tests.factories import UserFactory


@pytest.mark.django_db
class TestWishlistService:
    def test_get_wishlist_auto_creates(self):
        user = UserFactory()
        service = WishlistService()
        result = service.get_wishlist(user)
        assert result["count"] == 0
        assert WishlistFactory._meta.model.objects.filter(user=user).exists()

    def test_add_item(self):
        user = UserFactory()
        product = ProductFactory(status="published")
        service = WishlistService()
        result = service.add_item(user, str(product.id))
        assert result["count"] == 1
        assert result["items"][0]["product_id"] == str(product.id)

    def test_add_duplicate_raises(self):
        user = UserFactory()
        product = ProductFactory(status="published")
        service = WishlistService()
        service.add_item(user, str(product.id))
        with pytest.raises(BusinessException):
            service.add_item(user, str(product.id))

    def test_remove_item(self):
        user = UserFactory()
        product = ProductFactory(status="published")
        service = WishlistService()
        service.add_item(user, str(product.id))
        result = service.remove_item(user, str(product.id))
        assert result["count"] == 0

    def test_clear(self):
        user = UserFactory()
        product = ProductFactory(status="published")
        service = WishlistService()
        service.add_item(user, str(product.id))
        service.clear_wishlist(user)
        result = service.get_wishlist(user)
        assert result["count"] == 0
