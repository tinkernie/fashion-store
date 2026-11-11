"""Label export (BarTender) and scanner lookup regression tests."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from inventory.models import Inventory
from product_options.tests.factories import OptionValueFactory, ProductOptionFactory
from products.tests.factories import ProductFactory
from variants.barcodes import barcode_from_counter
from variants.models import Variant

from .factories import VariantFactory

LABELS_URL = "/api/admin/variants/export-labels/"
LOOKUP_URL = "/api/admin/variants/by-barcode/{}/"


def _staff_client():
    user = get_user_model().objects.create_user(
        "09120000077", password="pass1234", is_staff=True
    )
    client = APIClient()
    client.force_authenticate(user)
    return client


def _make_variant(product, sku, counter, stock, with_options=True):
    variant = VariantFactory(
        product=product,
        sku=sku,
        barcode=barcode_from_counter(counter),
        option_values=(
            [
                {"option": product.options.get(name="رنگ"), "value": _color_value(product)},
                {"option": product.options.get(name="سایز"), "value": _size_value(product)},
            ]
            if with_options
            else []
        ),
    )
    Inventory.objects.create(variant=variant, available_quantity=stock)
    return variant


def _add_options(product):
    color = ProductOptionFactory(product=product, name="رنگ", display_order=0)
    OptionValueFactory(option=color, value="سفید", display_order=0)
    size = ProductOptionFactory(product=product, name="سایز", display_order=1)
    OptionValueFactory(option=size, value="L", display_order=0)
    return product


def _color_value(product):
    return product.options.get(name="رنگ").values.get(value="سفید")


def _size_value(product):
    return product.options.get(name="سایز").values.get(value="L")


@pytest.fixture
def catalog(db):
    product = _add_options(ProductFactory(title="پیراهن مردانه"))
    in_stock = _make_variant(product, "EXP-1", 101, stock=4)
    sold_out = _make_variant(product, "EXP-2", 102, stock=0)
    placeholder = Variant.objects.create(
        product=product,
        sku="placeholder-DEFAULT",
        price=0,
        barcode=barcode_from_counter(103),
    )
    Inventory.objects.create(variant=placeholder, available_quantity=9)
    return {
        "product": product,
        "in_stock": in_stock,
        "sold_out": sold_out,
        "placeholder": placeholder,
    }


@pytest.mark.django_db
class TestLabelExportEndpoint:
    def test_requires_authentication(self, catalog):
        response = APIClient().get(LABELS_URL)
        assert response.status_code in (401, 403)

    def test_default_is_tsv_with_bom_and_header(self, catalog):
        response = _staff_client().get(LABELS_URL)
        assert response.status_code == 200
        assert response["Content-Type"].startswith("text/tab-separated-values")
        assert ".tsv" in response["Content-Disposition"]
        text = response.content.decode("utf-8")
        assert text.startswith("\ufeff")
        lines = [line for line in text.split("\r\n") if line]
        assert lines[0].lstrip("\ufeff") == (
            "barcode\tproduct_name\toptions_summary"
        )

    def test_default_excludes_out_of_stock_and_placeholder(self, catalog):
        response = _staff_client().get(LABELS_URL)
        rows = [r for r in response.content.decode("utf-8").split("\r\n")[1:] if r]
        assert len(rows) == 1
        assert rows[0].split("\t")[0] == catalog["in_stock"].barcode
        assert "placeholder-DEFAULT" not in response.content.decode("utf-8")

    def test_include_out_of_stock_reprints_zero_stock_tags(self, catalog):
        response = _staff_client().get(LABELS_URL + "?include_out_of_stock=1")
        rows = [r for r in response.content.decode("utf-8").split("\r\n")[1:] if r]
        assert len(rows) == 2
        barcodes = {row.split("\t")[0] for row in rows}
        assert barcodes == {
            catalog["in_stock"].barcode,
            catalog["sold_out"].barcode,
        }

    def test_row_content(self, catalog):
        response = _staff_client().get(LABELS_URL)
        row = [
            r for r in response.content.decode("utf-8").split("\r\n")[1:] if r
        ][0].split("\t")
        assert row == [
            catalog["in_stock"].barcode,
            "پیراهن مردانه",
            "رنگ: سفید | سایز: L",
        ]
        assert len(row) == 3

    def test_csv_format(self, catalog):
        response = _staff_client().get(LABELS_URL + "?format=csv")
        assert response.status_code == 200
        assert response["Content-Type"].startswith("text/csv")
        assert ".csv" in response["Content-Disposition"]
        lines = [l for l in response.content.decode("utf-8").split("\r\n") if l]
        assert lines[0].lstrip("\ufeff") == (
            "barcode,product_name,options_summary"
        )
        assert len(lines) == 2

    def test_export_is_not_n_plus_one(self, catalog, django_assert_max_num_queries):
        # variants (+ product/inventory JOIN) + one option prefetch.
        with django_assert_max_num_queries(3):
            response = _staff_client().get(LABELS_URL)
        assert response.status_code == 200

    def test_filter_by_product(self, catalog):
        other = _add_options(ProductFactory(title="شلوار"))
        _make_variant(other, "OTHER-1", 201, stock=2)
        response = _staff_client().get(
            f"{LABELS_URL}?product_id={catalog['product'].id}"
        )
        rows = [r for r in response.content.decode("utf-8").split("\r\n")[1:] if r]
        assert len(rows) == 1
        assert "شلوار" not in response.content.decode("utf-8")

    def test_selected_ids_export_only_those_rows(self, catalog):
        other = _add_options(ProductFactory(title="شلوار"))
        selected = _make_variant(other, "PICK-1", 301, stock=1)
        response = _staff_client().get(
            f"{LABELS_URL}?variant_ids={selected.id},{catalog['in_stock'].id}"
        )
        rows = [r for r in response.content.decode("utf-8").split("\r\n")[1:] if r]
        assert {row.split("\t")[0] for row in rows} == {
            selected.barcode,
            catalog["in_stock"].barcode,
        }

    def test_selected_ids_include_out_of_stock(self, catalog):
        response = _staff_client().get(
            f"{LABELS_URL}?variant_ids={catalog['sold_out'].id}"
        )
        rows = [r for r in response.content.decode("utf-8").split("\r\n")[1:] if r]
        assert len(rows) == 1
        assert rows[0].split("\t")[0] == catalog["sold_out"].barcode

    def test_selected_ids_via_repeated_param(self, catalog):
        response = _staff_client().get(
            f"{LABELS_URL}?variant_ids={catalog['sold_out'].id}"
            f"&variant_ids={catalog['in_stock'].id}"
        )
        rows = [r for r in response.content.decode("utf-8").split("\r\n")[1:] if r]
        assert len(rows) == 2

    def test_selected_ids_via_post_json(self, catalog):
        response = _staff_client().post(
            LABELS_URL,
            {"variant_ids": [str(catalog["sold_out"].id)]},
            format="json",
        )
        assert response.status_code == 200
        rows = [r for r in response.content.decode("utf-8").split("\r\n")[1:] if r]
        assert len(rows) == 1
        assert rows[0].split("\t")[0] == catalog["sold_out"].barcode

    def test_invalid_variant_id_is_400(self, catalog):
        response = _staff_client().get(f"{LABELS_URL}?variant_ids=not-a-uuid")
        assert response.status_code == 400
        assert response.data["code"] == "invalid_variant_ids"


@pytest.mark.django_db
class TestBarcodeLookupEndpoint:
    def test_requires_authentication(self, catalog):
        response = APIClient().get(
            LOOKUP_URL.format(catalog["in_stock"].barcode)
        )
        assert response.status_code in (401, 403)

    def test_staff_scan_returns_stock_and_options(self, catalog):
        response = _staff_client().get(
            LOOKUP_URL.format(catalog["in_stock"].barcode)
        )
        assert response.status_code == 200
        data = response.data
        assert data["barcode"] == catalog["in_stock"].barcode
        assert data["sku"] == "EXP-1"
        assert data["product_title"] == "پیراهن مردانه"
        assert data["stock"] == 4
        assert data["is_active"] is True
        assert {o["value"] for o in data["options"]} == {"سفید", "L"}

    def test_unknown_barcode_is_404(self, catalog):
        response = _staff_client().get(LOOKUP_URL.format("2999999999995"))
        assert response.status_code == 404
        assert response.data["code"] == "barcode_not_found"

    def test_soft_deleted_label_resolves_but_is_inactive(self, catalog):
        variant = catalog["sold_out"]
        barcode = variant.barcode
        variant.delete()
        response = _staff_client().get(LOOKUP_URL.format(barcode))
        assert response.status_code == 200
        assert response.data["is_active"] is False
        assert response.data["barcode"] == barcode
