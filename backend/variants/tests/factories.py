import factory
from factory.django import DjangoModelFactory
from variants.models import Variant, VariantOption
from products.tests.factories import ProductFactory
from product_options.tests.factories import ProductOptionFactory, OptionValueFactory

class VariantFactory(DjangoModelFactory):
    class Meta:
        model = Variant
    product = factory.SubFactory(ProductFactory)
    sku = factory.Sequence(lambda n: f"SKU-{n:04d}")
    barcode = factory.Sequence(lambda n: f"BAR-{n:06d}")
    price = 100.00
    weight = 200
    status = Variant.Status.PUBLISHED
    availability = Variant.Availability.IN_STOCK

    @factory.post_generation
    def option_values(self, create, extracted, **kwargs):
        if not create or not extracted:
            return
        for assignment in extracted:
            VariantOption.objects.create(
                variant=self,
                option=assignment['option'],
                option_value=assignment['value'],
            )