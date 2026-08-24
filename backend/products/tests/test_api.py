import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .factories import ProductFactory
from categories.tests.factories import CategoryFactory

User = get_user_model()


@pytest.mark.django_db
class TestPublicAPI:
    def test_list_published_products(self):
        cat = CategoryFactory(name="Women", slug="women")
        ProductFactory(title="Dress", slug="dress", category=cat, status="published")
        client = APIClient()
        resp = client.get("/api/v1/products/")
        assert resp.status_code == 200
        assert len(resp.data["results"]) >= 1

    def test_filter_by_category(self):
        cat1 = CategoryFactory(slug="shirts")
        cat2 = CategoryFactory(slug="pants")
        ProductFactory(category=cat1, status="published")
        ProductFactory(category=cat2, status="published")
        client = APIClient()
        resp = client.get("/api/v1/products/?category=shirts")
        assert len(resp.data["results"]) == 1

    def test_retrieve_by_slug(self):
        product = ProductFactory(
            title="Nice Jacket", slug="nice-jacket", status="published"
        )
        client = APIClient()
        resp = client.get("/api/v1/products/nice-jacket/")
        assert resp.status_code == 200
        assert resp.data["title"] == "Nice Jacket"


class TestAdminAPI:
    def test_create_product_as_admin(self):
        admin = User.objects.create_superuser("admin@test.com", "pass")
        cat = CategoryFactory(name="Accessories", slug="accessories")
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.post(
            "/api/v1/admin/products/",
            {
                "title": "Belt",
                "slug": "belt",
                "category_id": str(cat.id),
            },
        )
        assert resp.status_code == 201

    def test_unauthorized(self):
        client = APIClient()
        resp = client.post(
            "/api/v1/admin/products/",
            {"title": "Belt", "slug": "belt", "category_id": "some-id"},
        )
        assert resp.status_code == 401
