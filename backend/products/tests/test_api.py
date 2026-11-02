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
        resp = client.get("/api/products/")
        assert resp.status_code == 200
        assert len(resp.data["results"]) >= 1

    def test_filter_by_category(self):
        cat1 = CategoryFactory(slug="shirts")
        cat2 = CategoryFactory(slug="pants")
        ProductFactory(category=cat1, status="published")
        ProductFactory(category=cat2, status="published")
        client = APIClient()
        resp = client.get("/api/products/?category=shirts")
        assert len(resp.data["results"]) == 1

    def test_retrieve_by_slug(self):
        product = ProductFactory(
            title="Nice Jacket", slug="nice-jacket", status="published"
        )
        client = APIClient()
        resp = client.get(f"/api/products/{product.slug}/")
        assert resp.status_code == 200
        assert resp.data["title"] == "Nice Jacket"


@pytest.mark.django_db
class TestAdminAPI:
    def test_create_product_as_admin(self):
        admin = User.objects.create_superuser("09121111111", "pass")
        cat = CategoryFactory(name="Accessories", slug="accessories")
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.post(
            "/api/admin/products/",
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
            "/api/admin/products/",
            {"title": "Belt", "slug": "belt", "category_id": "some-id"},
        )
        assert resp.status_code == 401

    def test_patch_product_reorders_images(self):
        admin = User.objects.create_superuser("09122222222", "pass")
        cat = CategoryFactory(name="Shoes", slug="shoes")
        client = APIClient()
        client.force_authenticate(user=admin)

        # Create product with initial images
        create_resp = client.post(
            "/api/admin/products/",
            {
                "title": "Leather Boots",
                "slug": "leather-boots",
                "category_id": str(cat.id),
                "images": ["https://cdn.example.com/boot-front.jpg", "https://cdn.example.com/boot-side.jpg"],
            },
            format="json",
        )
        assert create_resp.status_code == 201
        prod_id = create_resp.data["id"]

        from products.models import Product
        prod = Product.objects.get(id=prod_id)
        assert prod.images.filter(is_cover=True).first().image_url == "https://cdn.example.com/boot-front.jpg"

        # Patch product with reordered images (side image becomes featured at index 0)
        patch_resp = client.patch(
            f"/api/admin/products/{prod_id}/",
            {
                "images": ["https://cdn.example.com/boot-side.jpg", "https://cdn.example.com/boot-front.jpg"],
                "image_url": "https://cdn.example.com/boot-side.jpg",
            },
            format="json",
        )
        assert patch_resp.status_code == 200

        prod.refresh_from_db()
        cover_after = prod.images.filter(is_cover=True).first()
        assert cover_after is not None
        assert cover_after.image_url == "https://cdn.example.com/boot-side.jpg"
        ordered_urls = list(prod.images.order_by("position").values_list("image_url", flat=True))
        assert ordered_urls == ["https://cdn.example.com/boot-side.jpg", "https://cdn.example.com/boot-front.jpg"]
