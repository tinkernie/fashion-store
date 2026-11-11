"""Counter (POS) sale endpoints: scan, confirm sale, optional invoice.

Covers the guarantees that matter at the till: stock leaves once, a retried
"Confirm Sale" never deducts twice, reserved online units need an explicit
override, and the invoice modal can only adjust money, not stock.
"""

from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from inventory.models import Inventory, StockMovement
from orders.models import Order
from variants.tests.factories import VariantFactory

User = get_user_model()

SALES_URL = "/api/admin/pos/sales/"
SCAN_URL = "/api/admin/pos/scan/{}/"


def _staff_client(phone="09120000088"):
    staff = User.objects.create_user(phone, password="pass1234", is_staff=True)
    client = APIClient()
    client.force_authenticate(staff)
    return client, staff


@pytest.fixture
def variant(db):
    item = VariantFactory(sku="POS-1", price=Decimal("250000.00"))
    Inventory.objects.create(variant=item, available_quantity=5)
    return item


def _payload(variant, quantity=1, **extra):
    body = {
        "items": [{"variant_id": str(variant.id), "quantity": quantity}],
        "pos_terminal": "counter-1",
    }
    body.update(extra)
    return body


@pytest.mark.django_db
class TestPosCheckout:
    def test_requires_staff(self, variant):
        response = APIClient().post(
            SALES_URL, _payload(variant), format="json"
        )
        assert response.status_code in (401, 403)
        assert Inventory.objects.get(variant=variant).available_quantity == 5

    def test_confirm_sale_deducts_stock_and_creates_paid_pos_order(
        self, variant
    ):
        client, cashier = _staff_client()
        response = client.post(
            SALES_URL,
            _payload(variant, quantity=2, client_reference="ref-100"),
            format="json",
        )
        assert response.status_code == 201
        data = response.data
        assert data["order_number"].startswith("POS-")
        assert data["channel"] == "pos"
        assert data["status"] == Order.Status.PAID
        assert data["subtotal"] == 500000
        assert data["total"] == 500000
        assert data["cashier"]["id"] == str(cashier.id)
        assert data["replayed"] is False

        order = Order.objects.get(id=data["id"])
        assert order.user_id is None
        assert order.cashier_id == cashier.id
        assert order.pos_terminal == "counter-1"
        assert order.client_reference == "ref-100"
        assert order.items.get().quantity == 2

        inventory = Inventory.objects.get(variant=variant)
        assert inventory.available_quantity == 3

        movement = StockMovement.objects.get(order=order)
        assert movement.reason == StockMovement.Reason.SALE
        assert movement.quantity_delta == -2
        assert movement.quantity_after == 3
        assert movement.actor_id == cashier.id

    def test_repeated_client_reference_is_idempotent(self, variant):
        client, _ = _staff_client()
        body = _payload(variant, quantity=2, client_reference="ref-retry")

        first = client.post(SALES_URL, body, format="json")
        second = client.post(SALES_URL, body, format="json")

        assert first.status_code == 201
        assert second.status_code == 200
        assert second.data["replayed"] is True
        assert second.data["id"] == first.data["id"]
        assert Order.objects.count() == 1
        assert Inventory.objects.get(variant=variant).available_quantity == 3
        assert StockMovement.objects.count() == 1

    def test_repeated_scans_merge_into_one_line(self, variant):
        client, _ = _staff_client()
        body = {
            "items": [
                {"variant_id": str(variant.id), "quantity": 1},
                {"variant_id": str(variant.id), "quantity": 2},
            ]
        }
        response = client.post(SALES_URL, body, format="json")
        assert response.status_code == 201
        order = Order.objects.get(id=response.data["id"])
        assert order.items.count() == 1
        assert order.items.get().quantity == 3
        assert Inventory.objects.get(variant=variant).available_quantity == 2

    def test_insufficient_stock_returns_409_and_changes_nothing(self, variant):
        client, _ = _staff_client()
        response = client.post(
            SALES_URL, _payload(variant, quantity=6), format="json"
        )
        assert response.status_code == 409
        assert response.data["code"] == "insufficient_stock"
        assert response.data["lines"][0]["sellable"] == 5
        assert Order.objects.count() == 0
        assert StockMovement.objects.count() == 0
        assert Inventory.objects.get(variant=variant).available_quantity == 5

    def test_reserved_units_need_an_explicit_override(self, variant):
        Inventory.objects.filter(variant=variant).update(reserved_quantity=3)
        client, _ = _staff_client()

        blocked = client.post(
            SALES_URL, _payload(variant, quantity=3), format="json"
        )
        assert blocked.status_code == 409
        assert blocked.data["code"] == "reserved_stock"
        assert blocked.data["lines"][0]["reason"] == "reserved_for_online_order"
        assert Inventory.objects.get(variant=variant).available_quantity == 5

        allowed = client.post(
            SALES_URL,
            _payload(variant, quantity=3, allow_reserved_override=True),
            format="json",
        )
        assert allowed.status_code == 201
        inventory = Inventory.objects.get(variant=variant)
        assert inventory.available_quantity == 2
        assert inventory.reserved_quantity == 3

    def test_draft_variant_cannot_be_sold(self, variant):
        variant.status = "draft"
        variant.save(update_fields=["status"])
        client, _ = _staff_client()
        response = client.post(SALES_URL, _payload(variant), format="json")
        assert response.status_code == 409
        assert response.data["lines"][0]["reason"] == "variant_not_sellable"


@pytest.mark.django_db
class TestPosInvoiceCompletion:
    def _sale(self, client, variant, quantity=1):
        response = client.post(
            SALES_URL, _payload(variant, quantity=quantity), format="json"
        )
        assert response.status_code == 201
        return response.data

    def test_invoice_fields_update_total_and_customer(self, variant):
        client, _ = _staff_client()
        sale = self._sale(client, variant, quantity=2)  # 500,000

        response = client.patch(
            f"{SALES_URL}{sale['id']}/",
            {
                "customer_phone": "09121234567",
                "discount_type": "percent",
                "discount_value": "10",
                "notes": "مشتری عجله دارد",
            },
            format="json",
        )
        assert response.status_code == 200
        assert response.data["discount_amount"] == 50000
        assert response.data["total"] == 450000
        assert response.data["customer_phone"] == "09121234567"

        order = Order.objects.get(id=sale["id"])
        assert order.customer_phone == "09121234567"
        assert order.shipping_address["phone"] == "09121234567"
        assert order.notes == "مشتری عجله دارد"
        # Stock was already committed and must not move again.
        assert Inventory.objects.get(variant=variant).available_quantity == 3
        assert StockMovement.objects.count() == 1

    def test_flat_discount_over_subtotal_is_rejected(self, variant):
        client, _ = _staff_client()
        sale = self._sale(client, variant)
        response = client.patch(
            f"{SALES_URL}{sale['id']}/",
            {"discount_type": "flat", "discount_value": "999999"},
            format="json",
        )
        assert response.status_code == 400
        assert response.data["code"] == "invalid_discount"
        assert Order.objects.get(id=sale["id"]).total == Decimal("250000.00")

    def test_percent_discount_and_value_must_arrive_together(self, variant):
        client, _ = _staff_client()
        sale = self._sale(client, variant)
        response = client.patch(
            f"{SALES_URL}{sale['id']}/",
            {"discount_type": "percent"},
            format="json",
        )
        assert response.status_code == 400

    def test_invalid_phone_is_rejected(self, variant):
        client, _ = _staff_client()
        sale = self._sale(client, variant)
        response = client.patch(
            f"{SALES_URL}{sale['id']}/",
            {"customer_phone": "12345"},
            format="json",
        )
        assert response.status_code == 400

    def test_unknown_sale_is_404(self):
        client, _ = _staff_client()
        response = client.patch(
            f"{SALES_URL}00000000-0000-0000-0000-000000000000/",
            {"notes": "x"},
            format="json",
        )
        assert response.status_code == 404

    def test_online_order_is_not_patchable_as_pos(self, variant):
        from orders.tests.factories import OrderFactory

        client, _ = _staff_client()
        online = OrderFactory()
        response = client.patch(
            f"{SALES_URL}{online.id}/", {"notes": "x"}, format="json"
        )
        assert response.status_code == 409
        assert response.data["code"] == "not_pos_sale"

    def test_completed_invoice_appears_in_admin_orders_list(self, variant):
        client, _ = _staff_client()
        sale = self._sale(client, variant)
        client.patch(
            f"{SALES_URL}{sale['id']}/",
            {"customer_phone": "09121234567"},
            format="json",
        )
        listing = client.get("/api/admin/orders/")
        assert listing.status_code == 200
        found = next(o for o in listing.data if o["id"] == sale["id"])
        assert found["channel"] == "pos"
        assert found["customer_phone"] == "09121234567"
        assert found["customer_name"] == "مشتری حضوری"


@pytest.mark.django_db
class TestPosScan:
    def test_scan_returns_sellable_quantities(self, variant):
        Inventory.objects.filter(variant=variant).update(reserved_quantity=2)
        client, _ = _staff_client()
        response = client.get(SCAN_URL.format(variant.barcode))
        assert response.status_code == 200
        assert response.data["stock"] == 5
        assert response.data["reserved"] == 2
        assert response.data["sellable"] == 3
        assert response.data["is_sellable"] is True
        assert response.data["price"] == 250000

    def test_unknown_barcode_is_404(self):
        client, _ = _staff_client()
        response = client.get(SCAN_URL.format("2999999999995"))
        assert response.status_code == 404
        assert response.data["code"] == "barcode_not_found"

    def test_scan_requires_staff(self, variant):
        response = APIClient().get(SCAN_URL.format(variant.barcode))
        assert response.status_code in (401, 403)
