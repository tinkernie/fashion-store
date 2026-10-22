import pytest
from rest_framework.test import APIClient

from categories.models import Category
from products.models import Product
from products.selectors import ProductSelector


def _make_product(title, **kwargs):
    category, _ = Category.objects.get_or_create(
        name="دسته تست", slug="test-cat"
    )
    kwargs.setdefault("status", Product.Status.PUBLISHED)
    return Product.objects.create(
        title=title,
        slug=title,
        category=category,
        **kwargs,
    )


@pytest.mark.django_db
class TestInstaIdAllocation:
    def test_first_product_is_1_and_second_is_2(self):
        first = _make_product("first")
        second = _make_product("second")
        assert first.insta_id == 1
        assert second.insta_id == 2

    def test_explicit_value_is_respected_not_overwritten(self):
        product = _make_product("pinned", insta_id=500)
        assert product.insta_id == 500
        assert _make_product("next").insta_id == 501

    def test_uuid_pk_is_not_a_number_string(self):
        product = _make_product("kestrel")
        assert str(product.pk) != str(product.insta_id)  # UUID vs int


@pytest.mark.django_db
class TestCodeLookupEndpoint:
    def test_by_code_returns_full_detail(self):
        product = _make_product("کد ۷ محصول")
        client = APIClient()
        response = client.get(f"/api/products/by-code/{product.insta_id}/")
        assert response.status_code == 200
        assert response.data["insta_id"] == product.insta_id
        assert response.data["slug"] == "کد ۷ محصول"

    def test_by_code_rejects_unknown_code(self):
        client = APIClient()
        assert client.get("/api/products/by-code/999999/").status_code == 404
        assert client.get("/api/products/by-code/abc/").status_code == 404

    def test_code_hidden_until_published(self):
        _make_product("still draft", status=Product.Status.DRAFT)
        client = APIClient()
        assert client.get("/api/products/by-code/1/").status_code == 404


@pytest.mark.django_db
class TestPermissionSplit:
    """Req 1: anonymous storefront search by pure code.
    Req 2/3: admin finds/edits via staff auth; anonymous admin access fails."""

    def test_public_search_by_code_no_credentials(self):
        _make_product("silk scarf", insta_id=720)
        client = APIClient()
        response = client.get("/api/products/?search=720")
        assert response.status_code == 200
        slugs = [item["slug"] for item in response.data["results"]]
        assert slugs == ["silk scarf"]

    def test_anonymous_cannot_touch_admin_products(self):
        _make_product("locked", insta_id=721)
        client = APIClient()
        response = client.get("/api/admin/products/?search=721")
        assert response.status_code in (401, 403)

    def test_staff_search_by_code_sees_product(self):
        from django.contrib.auth import get_user_model

        staff = get_user_model().objects.create_user(
            "09129990001", password="pass1234", is_staff=True
        )
        product = _make_product("cashmere coat", insta_id=722)
        client = APIClient()
        client.force_authenticate(staff)
        response = client.get("/api/admin/products/?search=722")
        assert response.status_code == 200
        slugs = [item["slug"] for item in response.data["results"]]
        assert slugs == ["cashmere coat"]

    def test_staff_search_by_code_exact_param(self):
        from django.contrib.auth import get_user_model

        staff = get_user_model().objects.create_user(
            "09129990002", password="pass1234", is_staff=True
        )
        product = _make_product("wool cardigan", insta_id=723)
        client = APIClient()
        client.force_authenticate(staff)
        response = client.get(f"/api/admin/products/?code={product.insta_id}")
        assert response.status_code == 200
        assert response.data["results"][0]["slug"] == "wool cardigan"

    def test_staff_pure_digit_search_titleless_hit(self):
        """Admin types only '724' - code matches, digit-free title proves hit
        came from the code."""
        from django.contrib.auth import get_user_model

        staff = get_user_model().objects.create_user(
            "09129990003", password="pass1234", is_staff=True
        )
        product = _make_product("mohair wrap", insta_id=724)
        client = APIClient()
        client.force_authenticate(staff)
        response = client.get("/api/admin/products/?search=724")
        found = [item["slug"] for item in response.data["results"]]
        assert found == ["mohair wrap"]

    def test_staff_adjusts_stock_after_code_search(self):
        """Req 2: view stock then adjust it on the scanned item (variant-level
        inventory endpoints, Imaginative staff flow)."""
        from django.contrib.auth import get_user_model
        from variants.models import Variant
        from inventory.models import Inventory

        staff = get_user_model().objects.create_user(
            "09129990004", password="pass1234", is_staff=True
        )
        product = _make_product("linen dress", insta_id=725)
        variant = Variant.objects.create(
            product=product,
            sku="725-LINEN-A",
            price=100_000,
            weight=500,
            status=Variant.Status.PUBLISHED,
            availability=Variant.Availability.IN_STOCK,
        )
        Inventory.objects.create(
            variant=variant,
            available_quantity=9,
            status=Inventory.Status.IN_STOCK,
        )
        client = APIClient()
        client.force_authenticate(staff)
        response = client.get(
            f"/api/admin/products/?code={product.insta_id}"
        )
        assert response.status_code == 200
        product_data = response.data["results"][0]
        assert product_data["stock_quantity"] == 9
        response = client.post(
            f"/api/admin/inventory/{variant.id}/set-quantity/",
            {"quantity": 5},
            format="json",
        )
        assert response.status_code == 200
        variant.inventory.refresh_from_db()
        assert variant.inventory.available_quantity == 5

    def test_anonymous_cannot_adjust_stock(self):
        from variants.models import Variant
        from inventory.models import Inventory

        product = _make_product("tencel skirt", insta_id=726)
        variant = Variant.objects.create(
            product=product,
            sku="726-TENCEL-A",
            price=100_000,
            weight=400,
            status=Variant.Status.PUBLISHED,
            availability=Variant.Availability.IN_STOCK,
        )
        Inventory.objects.create(
            variant=variant,
            available_quantity=3,
            status=Inventory.Status.IN_STOCK,
        )
        client = APIClient()
        response = client.post(
            f"/api/admin/inventory/{variant.id}/set-quantity/",
            {"quantity": 0},
            format="json",
        )
        assert response.status_code in (401, 403)
        variant.inventory.refresh_from_db()
        assert variant.inventory.available_quantity == 3

    def test_regular_customer_cannot_adjust_stock(self):
        from django.contrib.auth import get_user_model
        from variants.models import Variant
        from inventory.models import Inventory

        customer = get_user_model().objects.create_user(
            "09129990005", password="pass1234"
        )  # not is_staff
        product = _make_product("denim jacket", insta_id=727)
        variant = Variant.objects.create(
            product=product,
            sku="727-DENIM-A",
            price=100_000,
            weight=600,
            status=Variant.Status.PUBLISHED,
            availability=Variant.Availability.IN_STOCK,
        )
        Inventory.objects.create(
            variant=variant,
            available_quantity=2,
            status=Inventory.Status.IN_STOCK,
        )
        client = APIClient()
        client.force_authenticate(customer)
        response = client.post(
            f"/api/admin/inventory/{variant.id}/set-quantity/",
            {"quantity": 0},
            format="json",
        )
        assert response.status_code == 403
        variant.inventory.refresh_from_db()
        assert variant.inventory.available_quantity == 2


@pytest.mark.django_db
class TestSearchAndFilters:
    def test_storefront_search_hits_exact_code(self):
        # Digit-free titles: any hit must come from the code, not from the
        # title text; 27 must not reach product 270.
        _make_product("sheer blouse", insta_id=27)
        _make_product("wool coat", insta_id=270)
        client = APIClient()
        response = client.get("/api/products/?search=27")
        slugs = [item["slug"] for item in response.data["results"]]
        assert slugs == ["sheer blouse"]

    def test_admin_code_filter_at_selector_level(self):
        staff = _make_product("staff-item")
        _make_product("other-item")
        result = ProductSelector.get_all_products_admin(
            {"code": staff.insta_id}
        )
        assert [p.slug for p in result] == ["staff-item"]
        assert list(ProductSelector.get_all_products_admin({"code": "abc"})) == []
