import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from products.tests.factories import ProductFactory

User = get_user_model()


@pytest.mark.django_db
class TestWishlistAPI:
    def test_get_wishlist_unauthenticated(self):
        client = APIClient()
        resp = client.get("/api/v1/wishlist/")
        assert resp.status_code == 401

    def test_get_wishlist(self):
        user = User.objects.create_user("test@test.com", "pass")
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.get("/api/v1/wishlist/")
        assert resp.status_code == 200
        assert resp.data["count"] == 0

    def test_add_item(self):
        user = User.objects.create_user("test@test.com", "pass")
        product = ProductFactory(status="published")
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.post(
            "/api/v1/wishlist/add_item/", {"product_id": str(product.id)}
        )
        assert resp.status_code == 200
        assert resp.data["count"] == 1

    def test_remove_item(self):
        user = User.objects.create_user("test@test.com", "pass")
        product = ProductFactory(status="published")
        client = APIClient()
        client.force_authenticate(user=user)
        client.post("/api/v1/wishlist/add_item/", {"product_id": str(product.id)})
        resp = client.post(
            "/api/v1/wishlist/remove-item/", {"product_id": str(product.id)}
        )
        assert resp.status_code == 200
        assert resp.data["count"] == 0
