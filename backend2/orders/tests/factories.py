import factory
from factory.django import DjangoModelFactory
from orders.models import Order, OrderItem
from common.tests.factories import UserFactory
from variants.tests.factories import VariantFactory


class OrderFactory(DjangoModelFactory):
    class Meta:
        model = Order

    user = factory.SubFactory(UserFactory)
    order_number = factory.Sequence(lambda n: f"TEST-ORDER-{n:06d}")
    status = Order.Status.PENDING
    subtotal = 100.00
    total = 100.00
    shipping_address = {"street": "123 Main St", "city": "NYC"}


class OrderItemFactory(DjangoModelFactory):
    class Meta:
        model = OrderItem

    order = factory.SubFactory(OrderFactory)
    variant = factory.SubFactory(VariantFactory)
    product_snapshot = {"title": "Test Product", "options": "Size: M", "sku": "SKU123"}
    quantity = 1
    price_snapshot = 50.00
    line_total = 50.00
