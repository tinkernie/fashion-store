"""In-store (POS) counter sales.

A counter sale is an `Order` with `channel="pos"`: it goes through the same
admin invoices list, but skips carts, reservations, shipping and payments.
Stock leaves the shop at the moment "Confirm Sale" is pressed, recorded in the
append-only StockMovement ledger.
"""

from decimal import Decimal, ROUND_HALF_UP

from django.db import IntegrityError, transaction
from django.utils import timezone

from common.exceptions import BusinessException
from inventory.models import StockMovement
from inventory.repositories import InventoryRepository
from inventory.services import InventoryService
from variants.models import Variant

from .models import Order, OrderChannel, OrderStatusHistory
from .repositories import OrderRepository
from .services import OrderService

POS_STORE_ADDRESS = "زنجان - قیدار - خیابان امام - روبروی تالار صدف - پوشاک ماوی"


class PosSaleError(Exception):
    """Domain error carrying the exact JSON shape the counter UI expects."""

    def __init__(self, detail, *, code="pos_error", status_code=400, lines=None):
        super().__init__(detail)
        self.detail = detail
        self.code = code
        self.status_code = status_code
        self.lines = lines or []

    def payload(self) -> dict:
        body = {"detail": self.detail, "code": self.code}
        if self.lines:
            body["lines"] = self.lines
        return body


class PosService:
    def __init__(self):
        self.inventory_service = InventoryService()
        self.order_service = OrderService()

    # ------------------------------------------------------------------ sale

    def checkout(
        self,
        *,
        cashier,
        items,
        client_reference: str = None,
        pos_terminal: str = "",
        allow_reserved_override: bool = False,
    ) -> dict:
        """Ring up a basket and deduct stock atomically.

        `items` is the validated list of {"variant_id", "quantity"} dicts;
        repeated scans of the same variant are merged into one line.
        """
        if cashier is None:
            raise BusinessException("A cashier is required.")
        quantities = {}
        for line in items or []:
            variant_id = str(line["variant_id"])
            quantities[variant_id] = quantities.get(variant_id, 0) + int(
                line["quantity"]
            )
        if not quantities:
            raise PosSaleError("The sale has no items.", code="empty_sale")

        client_reference = (client_reference or "").strip() or None
        try:
            with transaction.atomic():
                return self._checkout(
                    cashier=cashier,
                    quantities=quantities,
                    client_reference=client_reference,
                    pos_terminal=pos_terminal or "",
                    allow_reserved_override=allow_reserved_override,
                )
        except IntegrityError:
            # Two identical retries raced past the lookup; the unique
            # client_reference decided the winner. Return that sale.
            replay = self._find_by_reference(client_reference)
            if replay is not None:
                return self._replayed(replay)
            raise

    def _checkout(
        self,
        *,
        cashier,
        quantities: dict,
        client_reference,
        pos_terminal,
        allow_reserved_override,
    ) -> dict:
        if client_reference:
            existing = (
                Order.objects.select_for_update()
                .filter(client_reference=client_reference)
                .first()
            )
            if existing is not None:
                if existing.channel != OrderChannel.POS:
                    raise PosSaleError(
                        "This client_reference belongs to a non-POS order.",
                        code="client_reference_conflict",
                        status_code=409,
                    )
                return self._replayed(existing)

        variants = {
            str(variant.id): variant
            for variant in Variant.objects.select_for_update()
            .filter(id__in=list(quantities), deleted_at__isnull=True)
            .select_related("product")
            .prefetch_related(
                "variantoption_set__option", "variantoption_set__option_value"
            )
        }

        problems = []
        for variant_id in sorted(quantities):
            if variant_id not in variants:
                problems.append(
                    {
                        "variant_id": variant_id,
                        "sku": None,
                        "requested": quantities[variant_id],
                        "reason": "variant_not_found",
                    }
                )
        if problems:
            raise PosSaleError(
                "Some scanned variants no longer exist.",
                code="variant_not_found",
                status_code=409,
                lines=problems,
            )

        lines = []
        for variant_id in sorted(quantities):
            variant = variants[variant_id]
            quantity = quantities[variant_id]
            if variant.is_placeholder or variant.status != Variant.Status.PUBLISHED:
                problems.append(
                    {
                        "variant_id": variant_id,
                        "sku": variant.sku,
                        "requested": quantity,
                        "reason": "variant_not_sellable",
                    }
                )
                continue

            # Lock (or create at zero) inside the same transaction.
            inventory = InventoryRepository.lock_inventory(variant_id)
            available = inventory.available_quantity
            reserved = inventory.reserved_quantity
            sellable = available - reserved

            if available < quantity:
                problems.append(
                    {
                        "variant_id": variant_id,
                        "sku": variant.sku,
                        "requested": quantity,
                        "available": available,
                        "reserved": reserved,
                        "sellable": sellable,
                        "reason": "insufficient_stock",
                    }
                )
                continue
            if not allow_reserved_override and sellable < quantity:
                problems.append(
                    {
                        "variant_id": variant_id,
                        "sku": variant.sku,
                        "requested": quantity,
                        "available": available,
                        "reserved": reserved,
                        "sellable": sellable,
                        "reason": "reserved_for_online_order",
                    }
                )
                continue

            unit_price = Decimal(str(variant.price))
            lines.append(
                {
                    "variant": variant,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "line_total": unit_price * quantity,
                    "options": ", ".join(
                        f"{item.option.name}: {item.option_value.value}"
                        for item in variant.variantoption_set.all()
                    ),
                }
            )

        if problems:
            has_reserved = any(
                p["reason"] == "reserved_for_online_order" for p in problems
            )
            raise PosSaleError(
                "Units are reserved for online orders; resend with the override "
                "flag to sell them."
                if has_reserved
                else "Not enough stock to complete the sale.",
                code="reserved_stock" if has_reserved else "insufficient_stock",
                status_code=409,
                lines=problems,
            )

        subtotal = sum(
            (line["line_total"] for line in lines), Decimal("0.00")
        )
        now = timezone.now()
        store_address = {
            "type": "pos",
            "title": "فروش حضوری در فروشگاه",
            "full_name": "",
            "phone": "",
            "province": "زنجان",
            "city": "قیدار",
            "address": POS_STORE_ADDRESS,
            "postal_code": "",
        }

        order = OrderRepository.create_order(
            user_id=None,
            data={
                "order_number": OrderRepository.generate_order_number(
                    OrderChannel.POS
                ),
                "status": Order.Status.PAID,
                "channel": OrderChannel.POS,
                "cashier": cashier,
                "pos_terminal": pos_terminal,
                "client_reference": client_reference,
                "subtotal": subtotal,
                "discount_amount": Decimal("0.00"),
                "tax_amount": Decimal("0.00"),
                "shipping_cost": Decimal("0.00"),
                "total": subtotal,
                "shipping_address": store_address,
                "billing_address": dict(store_address),
                "shipping_method": "pickup",
                "shipping_detail": {"method": "pickup", "total": 0},
                "placed_at": now,
                "paid_at": now,
            },
            items_data=[
                {
                    "variant_id": line["variant"].id,
                    "product_id": line["variant"].product_id,
                    "product_snapshot": {
                        "title": line["variant"].product.title,
                        "options": line["options"],
                        "sku": line["variant"].sku,
                        "image": None,
                    },
                    "quantity": line["quantity"],
                    "price_snapshot": line["unit_price"],
                    "line_total": line["line_total"],
                }
                for line in lines
            ],
        )

        OrderStatusHistory.objects.create(
            order=order,
            from_status=None,
            to_status=Order.Status.PAID,
            note="counter sale",
        )

        for line in lines:
            self.inventory_service.apply_movement(
                str(line["variant"].id),
                -line["quantity"],
                StockMovement.Reason.SALE,
                order=order,
                actor=cashier,
                note=order.order_number,
                enforce_sellable=not allow_reserved_override,
            )

        result = self.order_service.serialize_order(order)
        result["replayed"] = False
        return result

    def _find_by_reference(self, client_reference):
        if not client_reference:
            return None
        return Order.objects.filter(client_reference=client_reference).first()

    def _replayed(self, order: Order) -> dict:
        if order.channel != OrderChannel.POS:
            raise PosSaleError(
                "This client_reference belongs to a non-POS order.",
                code="client_reference_conflict",
                status_code=409,
            )
        result = self.order_service.serialize_order(order)
        result["replayed"] = True
        return result

    # --------------------------------------------------------------- invoice

    @transaction.atomic
    def update_invoice(
        self,
        order_id,
        *,
        customer_phone=None,
        discount_type=None,
        discount_value=None,
        notes=None,
    ) -> dict:
        """Persist the optional invoice fields after stock was already taken."""
        order = Order.objects.select_for_update().filter(id=order_id).first()
        if order is None:
            raise PosSaleError("Sale not found.", code="sale_not_found", status_code=404)
        if order.channel != OrderChannel.POS:
            raise PosSaleError(
                "Only counter sales can be completed here.",
                code="not_pos_sale",
                status_code=409,
            )

        update_fields = []
        if customer_phone is not None:
            order.customer_phone = customer_phone.strip()
            address = dict(order.shipping_address or {})
            address["phone"] = order.customer_phone
            order.shipping_address = address
            update_fields += ["customer_phone", "shipping_address"]

        if notes is not None:
            order.notes = notes.strip()
            update_fields.append("notes")

        if discount_type:
            if discount_value is None:
                raise PosSaleError(
                    "discount_value is required with discount_type.",
                    code="discount_incomplete",
                )
            subtotal = Decimal(str(order.subtotal))
            discount_value = Decimal(str(discount_value))
            if discount_type == "percent":
                if discount_value > 100:
                    raise PosSaleError(
                        "Discount percentage cannot exceed 100.",
                        code="invalid_discount",
                    )
                discount = (
                    subtotal * discount_value / Decimal("100")
                ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            else:
                discount = discount_value.quantize(Decimal("0.01"))
            if discount > subtotal:
                raise PosSaleError(
                    "Discount cannot exceed the subtotal.",
                    code="invalid_discount",
                )
            order.discount_amount = discount
            order.total = (
                subtotal
                - discount
                + Decimal(str(order.shipping_cost or 0))
                + Decimal(str(order.tax_amount or 0))
            )
            update_fields += ["discount_amount", "total"]

        if update_fields:
            order.save(update_fields=update_fields + ["updated_at"])

        return self.order_service.serialize_order(order)
