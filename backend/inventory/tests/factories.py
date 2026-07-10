import factory
from factory.django import DjangoModelFactory
from variants.models import Variant, VariantOption
from products.tests.factories import ProductFactory
from product_options.tests.factories import ProductOptionFactory, OptionValueFactory


class VariantFactory(DjangoModelFactory):
    class Meta:
        model = Variant


from factory.django import DjangoModelFactory
from inventory.models import Inventory, Reservation
from variants.tests.factories import VariantFactory
from common.tests.factories import UserFactory  # adjust import if needed


class InventoryFactory(DjangoModelFactory):
    class Meta:
        model = Inventory

    variant = factory.SubFactory(VariantFactory)
    available_quantity = 100
    reserved_quantity = 0
    safety_stock = 10
    status = Inventory.Status.IN_STOCK
    reservation_expiration_minutes = 15
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
