import factory
from factory.django import DjangoModelFactory
from product_options.models import ProductOption, OptionValue
from products.tests.factories import ProductFactory

class ProductOptionFactory(DjangoModelFactory):
    class Meta:
        model = ProductOption
    product = factory.SubFactory(ProductFactory)
    name = factory.Sequence(lambda n: f"Option {n}")
    display_order = 0

class OptionValueFactory(DjangoModelFactory):
    class Meta:
        model = OptionValue
    option = factory.SubFactory(ProductOptionFactory)
    value = factory.Sequence(lambda n: f"Value {n}")
    display_order = 0