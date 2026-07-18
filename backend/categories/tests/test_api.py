import pytest
from rest_framework.test import APIClient
from rest_framework import status
from .factories import CategoryFactory
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestPublicAPI:
    def test_tree_endpoint(self):
        parent = CategoryFactory(name="Women", slug="women")
        child = CategoryFactory(name="Dresses", slug="dresses", parent=parent)
        client = APIClient()
        resp = client.get("/api/v1/categories/")
        assert resp.status_code == 200
        # Check nested structure
        data = resp.data
        assert len(data) == 1
        assert data[0]["name"] == "Women"
        assert len(data[0]["children"]) == 1
        assert data[0]["children"][0]["name"] == "Dresses"

    def test_retrieve_by_slug(self):
        cat = CategoryFactory(name="Women", slug="women")
        client = APIClient()
        resp = client.get("/api/v1/categories/women/")
        assert resp.status_code == 200
        assert resp.data["name"] == "Women"


class TestAdminAPI:
    def test_create_category_as_admin(self):
        admin = User.objects.create_superuser("admin@test.com", "pass")
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.post("/api/v1/admin/categories/", {"name": "New", "slug": "new"})
        assert resp.status_code == 201

    def test_create_as_anonymous_fails(self):
        client = APIClient()
        resp = client.post("/api/v1/admin/categories/", {"name": "New", "slug": "new"})
        assert resp.status_code == 401
