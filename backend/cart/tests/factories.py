import factory, uuid
from factory.django import DjangoModelFactory
from cart.models import Cart, CartItem
from variants.tests.factories import VariantFactory
from common.tests.factories import UserFactory

class CartFactory(DjangoModelFactory):
    class Meta:
        model = Cart
    user = factory.SubFactory(UserFactory)
    session_key = factory.LazyFunction(uuid.uuid4)

class CartItemFactory(DjangoModelFactory):
    class Meta:
        model = CartItem
    cart = factory.SubFactory(CartFactory)
    variant = factory.SubFactory(VariantFactory)
    quantity = 1
    price_snapshot = '99.99'