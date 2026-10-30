import factory
from factory.django import DjangoModelFactory
from inventory.models import Inventory, Reservation
from variants.tests.factories import VariantFactory
from common.tests.factories import UserFactory


class InventoryFactory(DjangoModelFactory):
    class Meta:
        model = Inventory

    variant = factory.SubFactory(VariantFactory)
    available_quantity = 100
    reserved_quantity = 0
    safety_stock = 10
    status = Inventory.Status.IN_STOCK
    reservation_expiration_minutes = 15
