import factory
from factory.django import DjangoModelFactory
from wishlist.models import Wishlist, WishlistItem
from common.tests.factories import UserFactory
from products.tests.factories import ProductFactory


class WishlistFactory(DjangoModelFactory):
    class Meta:
        model = Wishlist

    user = factory.SubFactory(UserFactory)


class WishlistItemFactory(DjangoModelFactory):
    class Meta:
        model = WishlistItem

    wishlist = factory.SubFactory(WishlistFactory)
    product = factory.SubFactory(ProductFactory)
