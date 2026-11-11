"""Printable order invoice (A5 receipt).

The HTML is built first and rendered to PDF on demand; nothing is stored, so a
re-download always reflects the current order (phone, discount, notes).
"""

from pathlib import Path

from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone

from common.jalali import format_jalali, format_money
from .models import Order, OrderChannel

STORE_NAME = "پوشاک ماوی"
STORE_ADDRESS = "زنجان - قیدار - خیابان امام - روبروی تالار صدف"
RETURN_POLICY = "امکان تعویض کالا تا ۴۸ ساعت با ارائه فاکتور"

STATUS_LABELS = {
    Order.Status.PENDING: "در انتظار",
    Order.Status.AWAITING_PAYMENT: "در انتظار پرداخت",
    Order.Status.PAID: "پرداخت‌شده",
    Order.Status.PACKING: "در حال بسته‌بندی",
    Order.Status.SHIPPING: "در حال ارسال",
    Order.Status.DELIVERED: "تحویل‌شده",
    Order.Status.CANCELLED: "لغوشده",
    Order.Status.RETURNED: "مرجوع‌شده",
    Order.Status.REFUNDED: "بازپرداخت‌شده",
}

FONT_REGULAR = Path(settings.BASE_DIR) / "static" / "fonts" / "Vazirmatn-Regular.ttf"
FONT_BOLD = Path(settings.BASE_DIR) / "static" / "fonts" / "Vazirmatn-Bold.ttf"


class InvoiceRenderError(Exception):
    """WeasyPrint (or its Pango runtime) is unavailable on this host."""


def _options_text(snapshot: dict) -> str:
    options = snapshot.get("options")
    if not options:
        return ""
    if isinstance(options, str):
        return options
    if isinstance(options, (list, tuple)):
        parts = []
        for item in options:
            if isinstance(item, dict):
                name = item.get("option_name") or item.get("name") or ""
                value = item.get("value") or item.get("option_value") or ""
                parts.append(f"{name}: {value}".strip(": "))
            else:
                parts.append(str(item))
        return "، ".join(part for part in parts if part)
    return str(options)


def _line_items(order: Order) -> list[dict]:
    lines = []
    for index, item in enumerate(order.items.all(), start=1):
        snapshot = item.product_snapshot if isinstance(item.product_snapshot, dict) else {}
        title = snapshot.get("title") or ""
        sku = snapshot.get("sku") or ""
        options = _options_text(snapshot)
        variant = item.variant if getattr(item, "variant_id", None) else None
        if variant is not None:
            title = title or getattr(variant.product, "title", "")
            sku = sku or variant.sku
            if not options:
                options = "، ".join(
                    f"{vo.option.name}: {vo.option_value.value}"
                    for vo in variant.variantoption_set.all()
                )
        lines.append(
            {
                "index": index,
                "title": title or "کالا",
                "options": options,
                "sku": sku,
                "quantity": item.quantity,
                "unit_price": format_money(item.price_snapshot),
                "line_total": format_money(item.line_total),
            }
        )
    return lines


def _cashier_name(order: Order) -> str:
    cashier = order.cashier if order.cashier_id else None
    if cashier is None:
        return ""
    full_name = f"{cashier.first_name} {cashier.last_name}".strip()
    return full_name or getattr(cashier, "phone_number", "") or ""


def build_invoice_context(order: Order) -> dict:
    placed_at = order.placed_at or order.created_at or timezone.now()
    customer_name = ""
    customer_phone = getattr(order, "customer_phone", "") or ""
    if order.user is not None:
        customer_name = f"{order.user.first_name} {order.user.last_name}".strip()
        customer_phone = customer_phone or getattr(order.user, "phone_number", "")
    if not customer_phone and isinstance(order.shipping_address, dict):
        customer_phone = order.shipping_address.get("phone", "") or customer_phone

    items = _line_items(order)
    return {
        "order": order,
        "store_name": STORE_NAME,
        "store_address": STORE_ADDRESS,
        "return_policy": RETURN_POLICY,
        "is_pos": getattr(order, "channel", "online") == OrderChannel.POS,
        "status_label": STATUS_LABELS.get(order.status, order.status),
        "invoice_number": order.order_number,
        "issued_at": format_jalali(placed_at),
        "cashier_name": _cashier_name(order),
        "customer_name": customer_name,
        "customer_phone": customer_phone,
        "customer_display": customer_name or "مشتری حضوری",
        "terminal": getattr(order, "pos_terminal", "") or "",
        "items": items,
        "item_count": sum(line["quantity"] for line in items),
        "subtotal": format_money(order.subtotal),
        "discount": format_money(order.discount_amount),
        "has_discount": bool(order.discount_amount),
        "tax": format_money(order.tax_amount),
        "has_tax": bool(order.tax_amount),
        "shipping": format_money(order.shipping_cost),
        "has_shipping": bool(order.shipping_cost),
        "total": format_money(order.total),
        "notes": order.notes or "",
        "font_regular": FONT_REGULAR.as_uri(),
        "font_bold": FONT_BOLD.as_uri(),
    }


def render_invoice_html(order: Order) -> str:
    return render_to_string(
        "orders/invoice.html", build_invoice_context(order)
    )


def render_invoice_pdf(order: Order) -> bytes:
    html = render_invoice_html(order)
    try:
        from weasyprint import HTML
    except (ImportError, OSError) as exc:  # OSError: Pango/GTK missing
        raise InvoiceRenderError(
            "WeasyPrint is not available on this host."
        ) from exc
    try:
        return HTML(string=html, base_url=str(settings.BASE_DIR)).write_pdf()
    except OSError as exc:  # rendering-time dlopen failure
        raise InvoiceRenderError(
            "WeasyPrint could not load its Pango runtime."
        ) from exc
