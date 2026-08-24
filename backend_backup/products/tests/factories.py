import factory
from factory.django import DjangoModelFactory
from products.models import Product
from categories.tests.factories import CategoryFactory


class ProductFactory(DjangoModelFactory):
    class Meta:
        model = Product

    title = factory.Sequence(lambda n: f"Product {n}")
    slug = factory.Sequence(lambda n: f"product-{n}")
    description = "A test product"
    category = factory.SubFactory(CategoryFactory)
    status = Product.Status.PUBLISHED
