import pytest
from django.utils import timezone
from common.exceptions import BusinessException
from inventory.services import InventoryService
from inventory.selectors import InventorySelector
from .factories import InventoryFactory
from variants.tests.factories import VariantFactory
from inventory.models import Inventory , Reservation

@pytest.mark.django_db
class TestInventoryService:
    def test_adjust_stock_add(self):
        inventory = InventoryFactory(available_quantity=10)
        service = InventoryService()
        result = service.adjust_stock(str(inventory.variant_id), 5)
        assert result['available_quantity'] == 15
        inventory.refresh_from_db()
        assert inventory.available_quantity == 15

    def test_adjust_stock_remove_insufficient(self):
        inventory = InventoryFactory(available_quantity=5)
        service = InventoryService()
        with pytest.raises(BusinessException):
            service.adjust_stock(str(inventory.variant_id), -10)

    def test_reserve_stock_success(self):
        inventory = InventoryFactory(available_quantity=20)
        service = InventoryService()
        result = service.reserve_stock(str(inventory.variant_id), 3)
        assert result['reserved_quantity'] == 3
        inventory.refresh_from_db()
        assert inventory.reserved_quantity == 3
        assert inventory.status == Inventory.Status.IN_STOCK

    def test_reserve_exceeds_available(self):
        inventory = InventoryFactory(available_quantity=5)
        service = InventoryService()
        with pytest.raises(BusinessException):
            service.reserve_stock(str(inventory.variant_id), 6)

    def test_commit_reservation(self):
        inventory = InventoryFactory(available_quantity=10)
        service = InventoryService()
        res = service.reserve_stock(str(inventory.variant_id), 2)
        # commit
        commit = service.commit_reservation(res['reservation_id'])
        inventory.refresh_from_db()
        assert inventory.available_quantity == 8
        assert inventory.reserved_quantity == 0

    def test_release_reservation(self):
        inventory = InventoryFactory(available_quantity=10)
        service = InventoryService()
        res = service.reserve_stock(str(inventory.variant_id), 4)
        service.release_reservation(res['reservation_id'])
        inventory.refresh_from_db()
        assert inventory.reserved_quantity == 0
        assert inventory.available_quantity == 10

    def test_expire_reservations(self, freezer):
        inventory = InventoryFactory(available_quantity=10, reservation_expiration_minutes=1)
        service = InventoryService()
        res = service.reserve_stock(str(inventory.variant_id), 2)
        # advance time beyond expiration
        freezer.move_to(timezone.now() + timezone.timedelta(minutes=2))
        service.expire_reservations()
        inventory.refresh_from_db()
        assert inventory.reserved_quantity == 0
        reservation = InventorySelector.get_reservation_by_id(res['reservation_id'])
        assert reservation.status == Reservation.Status.EXPIRED