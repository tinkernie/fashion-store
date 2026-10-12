"""Admin product list: category filter + admin pagination (BET-2026-10-12)."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from categories.models import Category
from products.services import ProductService
from products.models import Product
from variants.models import Variant
from inventory.models import Inventory, Reservation

User = get_user_model()
pytestmark = pytest.mark.django_db


@pytest.fixture
def admin_client():
    User.all_objects.filter(phone_number="09120000091").delete()
    admin = User.objects.create_superuser(phone_number="09120000091", password="pw123456")
    client = APIClient()
    client.force_authenticate(user=admin)
    yield client
    User.all_objects.filter(phone_number="09120000091").delete()


@pytest.fixture
def catalog():
    cat_a, _ = Category.objects.get_or_create(slug="bet-cat-a", defaults={"name": "BetA"})
    cat_b, _ = Category.objects.get_or_create(slug="bet-cat-b", defaults={"name": "BetB"})
    svc = ProductService()
    ids = []
    for i in range(30):
        cat = cat_a if i % 2 == 0 else cat_b
        r = svc.create_product({
            "title": "Bet %d" % i, "slug": "bet-%d" % i,
            "category_id": str(cat.id), "price": 1000 + i, "status": "published",
        })
        ids.append(r["id"])
    yield {"cat_a": cat_a, "cat_b": cat_b, "ids": ids}
    for prod in Product.all_objects.filter(slug__startswith="bet-"):
        for var in Variant.all_objects.filter(product=prod):
            for res in Reservation.all_objects.filter(inventory__variant=var):
                res.hard_delete()
            for inv in Inventory.all_objects.filter(variant=var):
                inv.hard_delete()
            var.hard_delete()
        prod.hard_delete()


def test_category_filter_by_id(admin_client, catalog):
    resp = admin_client.get("/api/admin/products/", {"category": str(catalog["cat_a"].id)})
    assert resp.status_code == 200
    slugs = [p["slug"] for p in resp.data["results"]]
    assert slugs, "expected products in category A"
    assert all(s.startswith("bet-") and int(s.split("-")[1]) % 2 == 0 for s in slugs)


def test_category_filter_by_slug(admin_client, catalog):
    resp = admin_client.get("/api/admin/products/", {"category": "bet-cat-b"})
    assert resp.status_code == 200
    slugs = [p["slug"] for p in resp.data["results"]]
    assert slugs
    assert all(int(s.split("-")[1]) % 2 == 1 for s in slugs)


def test_category_id_alias(admin_client, catalog):
    resp = admin_client.get("/api/admin/products/", {"category_id": str(catalog["cat_a"].id)})
    assert resp.status_code == 200
    assert len(resp.data["results"]) == 15


def test_unknown_category_returns_empty_page(admin_client, catalog):
    resp = admin_client.get("/api/admin/products/", {"category": "no-such-category"})
    assert resp.status_code == 200
    assert resp.data["count"] == 0
    assert resp.data["results"] == []


def test_admin_page_size_above_standard_cap(admin_client, catalog):
    # StandardPagination caps at 20; AdminPagination must honor 50.
    resp = admin_client.get("/api/admin/products/", {"page_size": 50})
    assert resp.status_code == 200
    assert resp.data["count"] == 30
    assert len(resp.data["results"]) == 30


def test_admin_page_size_caps_at_100(admin_client, catalog):
    from products.views import AdminProductViewSet

    assert AdminProductViewSet.pagination_class.max_page_size == 100
    resp = admin_client.get("/api/admin/products/", {"page_size": 150})
    assert resp.status_code == 200
    assert len(resp.data["results"]) == 30  # all rows, capped request honored


def test_non_admin_blocked(catalog):
    User.all_objects.filter(phone_number="09120000092").delete()
    user = User.objects.create_user(phone_number="09120000092", password="pw123456")
    client = APIClient()
    client.force_authenticate(user=user)
    resp = client.get("/api/admin/products/")
    assert resp.status_code in (401, 403)
    User.all_objects.filter(phone_number="09120000092").delete()
