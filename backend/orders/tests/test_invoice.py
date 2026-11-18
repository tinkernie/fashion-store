"""Invoice PDF: Jalali formatting, HTML content, and the download endpoint.

The real PDF render only runs where the Pango runtime exists (Linux/CI); on a
bare Windows dev box the endpoint is exercised with a stubbed renderer.
"""

from datetime import datetime, timezone
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from common.jalali import (
    format_jalali,
    format_money,
    gregorian_to_jalali,
    to_persian_digits,
)
from inventory.models import Inventory
from orders.invoice import RETURN_POLICY, build_invoice_context, render_invoice_html
from orders.pos_services import PosService
from orders.tests.factories import OrderFactory
from product_options.tests.factories import OptionValueFactory, ProductOptionFactory
from products.tests.factories import ProductFactory
from variants.models import VariantOption
from variants.tests.factories import VariantFactory

User = get_user_model()


def _weasyprint_usable() -> bool:
    try:
        from weasyprint import HTML  # noqa: F401

        return True
    except Exception:
        return False


requires_weasyprint = pytest.mark.skipif(
    not _weasyprint_usable(), reason="WeasyPrint/Pango runtime not installed"
)


class TestJalaliFormatting:
    def test_nowruz_conversion(self):
        assert gregorian_to_jalali(2024, 3, 20) == (1403, 1, 1)
        assert gregorian_to_jalali(2026, 3, 21) == (1405, 1, 1)
        assert gregorian_to_jalali(2026, 8, 23) == (1405, 6, 1)

    def test_date_uses_tehran_time_and_persian_digits(self):
        # 20:30 UTC is already the next day in Tehran (UTC+03:30).
        stamp = datetime(2026, 11, 11, 20, 30, tzinfo=timezone.utc)
        assert format_jalali(stamp) == "۱۴۰۵/۰۸/۲۱ - ۰۰:۰۰"

    def test_money_uses_persian_digits_and_thousands_mark(self):
        assert format_money(Decimal("250000.00")) == "۲۵۰٬۰۰۰ تومان"
        assert format_money(None) == ""
        assert to_persian_digits("POS-12") == "POS-۱۲"


@pytest.fixture
def staff(db):
    return User.objects.create_user(
        "09120000099", password="pass1234", is_staff=True, first_name="زهرا"
    )


@pytest.fixture
def sale(db, staff):
    variant = VariantFactory(
        sku="INV-1", price=Decimal("250000.00"), barcode="INV-BAR-1"
    )
    Inventory.objects.create(variant=variant, available_quantity=4)
    service = PosService()
    order = service.checkout(
        cashier=staff,
        items=[{"variant_id": variant.id, "quantity": 2}],
        pos_terminal="counter-2",
    )
    return service.update_invoice(
        order["id"],
        customer_phone="09121234567",
        discount_type="flat",
        discount_value=Decimal("50000"),
        notes="تحویل به آقای احمدی",
    )


@pytest.mark.django_db
class TestInvoiceContent:
    def test_pos_receipt_uses_3x6_page_and_four_columns(self, sale):
        from orders.models import Order

        order = Order.objects.get(id=sale["id"])
        html = render_invoice_html(order)

        assert "size: 3in 6in" in html
        assert "margin: 0.3in 0.5in" in html
        assert "پوشاک ماوی" in html
        assert order.order_number in html
        assert "فاکتور فروش حضوری" in html
        for header in ("شرح کالا", "قیمت واحد", "تعداد", "مبلغ"):
            assert header in html
        assert "جمع کالاها (۲ قلم)" in html
        assert "مبلغ قابل پرداخت" in html
        assert "۴۵۰٬۰۰۰ تومان" in html  # 500,000 - 50,000
        assert "۵۰٬۰۰۰ تومان" in html  # discount line
        assert "با تشکر از خرید شما" in html

    def test_pos_receipt_omits_identity_policy_and_sku(self, sale):
        from orders.models import Order

        order = Order.objects.get(id=sale["id"])
        html = render_invoice_html(order)

        assert RETURN_POLICY not in html
        for dropped in ("مشتری", "تلفن", "فروشنده", "صندوق"):
            assert dropped not in html
        assert "09121234567" not in html
        assert "زهرا" not in html  # cashier
        assert "counter-2" not in html
        assert "INV-1" not in html  # internal SKU
        assert "تحویل به آقای احمدی" not in html  # POS notes stay internal

    def test_pos_receipt_description_joins_title_and_options(self, db, staff):
        from orders.models import Order

        product = ProductFactory(title="پالتو فوتر الیزه 3 دکمه")
        option = ProductOptionFactory(product=product, name="سایز")
        value = OptionValueFactory(option=option, value="44")
        variant = VariantFactory(
            product=product, sku="DESC-1", barcode="DESC-BAR-1", price=Decimal("250000.00")
        )
        VariantOption.objects.create(variant=variant, option=option, option_value=value)
        Inventory.objects.create(variant=variant, available_quantity=2)
        sale = PosService().checkout(
            cashier=staff, items=[{"variant_id": variant.id, "quantity": 1}]
        )

        order = Order.objects.get(id=sale["id"])
        context = build_invoice_context(order)
        assert context["items"][0]["description"] == "پالتو فوتر الیزه 3 دکمه - سایز: 44"
        assert context["items"][0]["option_parts"] == [
            {"name": "سایز", "value": "44", "ltr": True}
        ]

        html = render_invoice_html(order)
        assert "پالتو فوتر الیزه 3 دکمه" in html
        # numeric sizes are marked LTR so bidi cannot reverse "44-135"
        assert '<span class="val" dir="ltr">44</span>' in html

    def test_html_contains_jalali_issue_date(self, sale):
        from orders.models import Order

        order = Order.objects.get(id=sale["id"])
        context = build_invoice_context(order)
        assert context["issued_at"].startswith("۱۴۰۵/")
        assert "تاریخ صدور" in render_invoice_html(order)

    def test_online_order_without_items_still_renders(self, db):
        order = OrderFactory()
        html = render_invoice_html(order)
        assert order.order_number in html
        assert RETURN_POLICY in html


@pytest.mark.django_db
class TestInvoiceEndpoint:
    def url(self, order_id):
        return f"/api/admin/orders/{order_id}/invoice.pdf"

    def test_requires_staff(self, sale):
        response = APIClient().get(self.url(sale["id"]))
        assert response.status_code in (401, 403)

    def test_unknown_order_is_404(self, staff):
        client = APIClient()
        client.force_authenticate(staff)
        response = client.get(self.url("00000000-0000-0000-0000-000000000000"))
        assert response.status_code == 404
        assert response.data["code"] == "order_not_found"

    def test_pdf_response_headers(self, sale, staff, monkeypatch):
        monkeypatch.setattr(
            "orders.views.render_invoice_pdf",
            lambda order: b"%PDF-1.4\nstub\n",
        )
        client = APIClient()
        client.force_authenticate(staff)
        response = client.get(self.url(sale["id"]))

        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"
        filename = sale["order_number"]
        assert (
            response["Content-Disposition"]
            == f'attachment; filename="{filename}.pdf"'
        )
        assert response["Cache-Control"] == "private, no-store"
        assert response.content == b"%PDF-1.4\nstub\n"

    def test_order_number_also_resolves(self, sale, staff, monkeypatch):
        monkeypatch.setattr(
            "orders.views.render_invoice_pdf", lambda order: b"%PDF-1.4\n"
        )
        client = APIClient()
        client.force_authenticate(staff)
        response = client.get(self.url(sale["order_number"]))
        assert response.status_code == 200

    def test_renderer_unavailable_returns_503(self, sale, staff, monkeypatch):
        from orders.invoice import InvoiceRenderError

        def boom(order):
            raise InvoiceRenderError("no pango")

        monkeypatch.setattr("orders.views.render_invoice_pdf", boom)
        client = APIClient()
        client.force_authenticate(staff)
        response = client.get(self.url(sale["id"]))
        assert response.status_code == 503
        assert response.data["code"] == "invoice_render_unavailable"

    @requires_weasyprint
    def test_real_pdf_render(self, sale, staff):
        client = APIClient()
        client.force_authenticate(staff)
        response = client.get(self.url(sale["id"]))
        assert response.status_code == 200
        pdf = response.content
        assert pdf.startswith(b"%PDF")
        assert len(pdf) > 4000
