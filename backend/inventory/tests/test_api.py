import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .factories import InventoryFactory
from variants.tests.factories import VariantFactory

User = get_user_model()


@pytest.mark.django_db
class TestAdminAPI:
    def test_retrieve_inventory(self):
        admin = User.objects.create_superuser("admin@test.com", "pass")
        inventory = InventoryFactory()
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.get(f"/api/v1/admin/inventory/{inventory.variant_id}/")
        assert resp.status_code == 200
        assert resp.data["available_quantity"] == inventory.available_quantity

    def test_adjust_stock(self):
        admin = User.objects.create_superuser("admin@test.com", "pass")
        variant = VariantFactory()
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.post(
            f"/api/v1/admin/inventory/{variant.id}/adjust_stock/", {"delta": 50}
        )
        assert resp.status_code == 200
        assert resp.data["available_quantity"] == 50
