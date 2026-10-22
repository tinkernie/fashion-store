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
