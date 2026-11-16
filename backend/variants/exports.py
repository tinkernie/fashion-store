"""Variant label export for barcode printing (BarTender).

Produces a 3-column sheet — `barcode`, `product_name`, `options_summary`.
Default format is TSV: BarTender's text-file driver treats every field as a
string, so leading zeros and Persian text survive untouched and nobody can
"accidentally save it from Excel". `format=csv` is available for spreadsheet
users; both are UTF-8 with BOM (utf-8-sig) so Windows/Excel/BarTender render
Persian correctly.

The two formats are deliberately not interchangeable:

* **TSV (machine-facing, BarTender)** — the barcode is the raw digit string.
  A direct database reader must receive clean tokens, so nothing is wrapped.
* **CSV (human-facing, Excel)** — a bare 13-digit EAN-13 is coerced by Excel
  into scientific notation (``2.06024E+12``) and can be persisted that way on
  save. The barcode cell is therefore written as an Excel text formula,
  ``="2060243168255"``, which forces the cell to stay text on double-click.
  The CSV filename is prefixed ``variant-labels-excel-`` so a file meant for a
  keyboard cannot be mistaken for one meant for the printer.

Copies: a variant with 10 units on hand gets **10 identical rows**, because a
label sheet is a print run, not a catalog list — one tag per physical item.
Stock comes from `Inventory.available_quantity`; a variant with no inventory
row, or with 0 on hand (only reachable via `include_out_of_stock=1` or an
explicit selection), still gets one row so the owner can reprint a tag.
Pass `copies=1` to get exactly one row per variant instead.

One row per option combination: editing a product in the admin can leave the
previous variant of a combination active next to its replacement (the product
editor creates the rows for a new matrix but does not retire the ones removed
from it), and each keeps its own barcode. Two rows that print the same product
title and the same options are the same physical label, so only the best
candidate is exported — most stock on hand first, newest on a tie.

Placeholder `-DEFAULT` variants (price basis, never sold, no inventory) are
always excluded, as are variants whose product was soft-deleted (the tags of a
removed product must not be reprinted). Out-of-stock variants are excluded
unless `include_out_of_stock=1` is passed (reprinting tags for a restock).

An explicit `variant_ids` selection (rows ticked in the admin grid) is
honoured as-is: those variants are exported regardless of stock level or the
other filters, because the human made the selection deliberately.
"""
import csv
import io
import uuid

from django.db.models import Prefetch
from django.http import HttpResponse
from django.utils import timezone

from .models import Variant, VariantOption

LABEL_COLUMNS = ("barcode", "product_name", "options_summary")
DEFAULT_SKU_SUFFIX = "-DEFAULT"
OPTIONS_SEPARATOR = " | "
EXCEL_TEXT = '="{barcode}"'


def _clean(value) -> str:
    """Collapse tabs/newlines so one variant can never break the file's rows."""
    return " ".join(str(value if value is not None else "").replace("\t", " ").split())


def excel_text(value: str) -> str:
    """Wrap a barcode so Excel keeps it as text instead of a number.

    Only plain ASCII digits are wrapped. The result is a live formula, so
    anything else (empty, user-supplied, punctuation) is returned untouched
    rather than being turned into formula syntax.
    """
    if value and value.isascii() and value.isdigit():
        return EXCEL_TEXT.format(barcode=value)
    return value


def optimize_label_queryset(queryset):
    """Add everything needed for 3 queries total, no N+1:
    product and inventory via JOIN, option rows via one prefetch."""
    return (
        queryset.filter(
            deleted_at__isnull=True,
            # A soft-deleted product leaves its variants untouched; exporting
            # them would resurrect the tags of a product that is gone.
            product__deleted_at__isnull=True,
        )
        .exclude(sku__endswith=DEFAULT_SKU_SUFFIX)
        .select_related("product", "inventory")
        .prefetch_related(
            Prefetch(
                "variantoption_set",
                queryset=VariantOption.objects.select_related(
                    "option", "option_value"
                ).order_by("option__display_order", "option_id"),
            )
        )
        .order_by("product__title", "sku")
    )


def label_queryset(
    *,
    product_id=None,
    status=None,
    availability=None,
    include_out_of_stock=False,
    variant_ids=None,
):
    qs = Variant.objects.filter(deleted_at__isnull=True)
    variant_ids = [str(v) for v in (variant_ids or []) if str(v).strip()]
    if variant_ids:
        # Explicit selection: ignore stock and the catalog filters below.
        return optimize_label_queryset(qs.filter(id__in=variant_ids))
    if product_id:
        qs = qs.filter(product_id=product_id)
    if status:
        qs = qs.filter(status=status)
    if availability:
        qs = qs.filter(availability=availability)
    if not include_out_of_stock:
        qs = qs.filter(inventory__available_quantity__gt=0)
    return optimize_label_queryset(qs)


def options_summary(variant) -> str:
    parts = [
        f"{item.option.name}: {item.option_value.value}"
        for item in variant.variantoption_set.all()
    ]
    return OPTIONS_SEPARATOR.join(p for p in parts if p.strip())


def available_quantity(variant) -> int:
    """On-hand units for one variant (0 when it has no inventory row)."""
    inventory = getattr(variant, "inventory", None)
    return int(getattr(inventory, "available_quantity", 0) or 0)


def copies_for(variant, mode: str = "stock") -> int:
    """How many identical labels this variant needs.

    Default is one per unit on hand (a print run). `1` switches back to one
    row per variant. Never fewer than one: a zero-stock variant that made it
    into the file (reprint / explicit selection) still deserves its tag.
    """
    if str(mode).strip().lower() in {"1", "one", "single"}:
        return 1
    return max(1, available_quantity(variant))


def _option_signature(variant) -> tuple:
    """Order-independent identity of a variant's printed options."""
    return tuple(
        sorted(
            (str(item.option_id), str(item.option_value_id))
            for item in variant.variantoption_set.all()
        )
    )


def _one_per_combination(queryset) -> list:
    """Collapse variants that would print an identical label.

    Order is preserved (first appearance wins the slot) and the candidate kept
    for a slot is the one with the most stock, then the most recently updated:
    a stale duplicate that kept its barcode but lost its inventory must not
    replace the variant the store is actually selling.
    """
    chosen = {}
    order = []
    for variant in queryset:
        key = (str(variant.product_id), _option_signature(variant))
        score = (available_quantity(variant), variant.updated_at)
        if key not in chosen:
            order.append(key)
            chosen[key] = (score, variant)
        elif score > chosen[key][0]:
            chosen[key] = (score, variant)
    return [chosen[key][1] for key in order]


def label_rows(queryset, *, excel_barcode: bool = False, copies: str = "stock"):
    """Yield `(barcode, product_name, options_summary)` rows for printing.

    `excel_barcode=True` (CSV only) escapes the barcode as a spreadsheet text
    formula; TSV keeps the raw string for BarTender. Each distinct option
    combination yields `copies_for(variant, copies)` identical rows.
    """
    for variant in _one_per_combination(queryset):
        barcode = variant.barcode or ""
        row = (
            excel_text(barcode) if excel_barcode else barcode,
            _clean(variant.product.title if variant.product_id else ""),
            _clean(options_summary(variant)),
        )
        for _ in range(copies_for(variant, copies)):
            yield row


def build_label_response(
    queryset, fmt: str = "tsv", copies: str = "stock"
) -> HttpResponse:
    fmt = (fmt or "tsv").lower()
    is_csv = fmt == "csv"
    delimiter = "," if is_csv else "\t"

    buffer = io.StringIO()
    buffer.write("\ufeff")  # utf-8-sig equivalent: BOM for Windows/Excel
    writer = csv.writer(
        buffer, delimiter=delimiter, lineterminator="\r\n", quoting=csv.QUOTE_MINIMAL
    )
    writer.writerow(LABEL_COLUMNS)
    for row in label_rows(queryset, excel_barcode=is_csv, copies=copies):
        writer.writerow(row)

    stamp = f"{timezone.localtime():%Y%m%d-%H%M}"
    if is_csv:
        content_type = "text/csv"
        filename = f"variant-labels-excel-{stamp}.csv"
    else:
        content_type = "text/tab-separated-values"
        filename = f"variant-labels-{stamp}.tsv"
    response = HttpResponse(buffer.getvalue(), content_type=f"{content_type}; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response["X-Label-Rows"] = str(buffer.getvalue().count("\r\n") - 1)
    return response


def truthy(value) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def parse_variant_ids(request) -> list:
    """Collect an explicit selection from the query string or request body.

    Accepts every shape the admin UI may send:
      ?variant_ids=1,2,5
      ?variant_ids=1&variant_ids=2
      ?variant_ids[]=1&variant_ids[]=2
      POST JSON {"variant_ids": ["...", "..."]}
      POST form  variant_ids=1,2,5

    Raises ValueError for anything that is not a UUID, so the endpoint can
    answer 400 instead of silently exporting the whole catalog.
    """
    raw = []
    source = request.query_params if request.method == "GET" else request.data
    if source is not None and hasattr(source, "getlist"):
        raw = source.getlist("variant_ids") + source.getlist("variant_ids[]")
    if not raw and source is not None:
        value = source.get("variant_ids") or source.get("variant_ids[]")
        if value:
            raw = value if isinstance(value, (list, tuple)) else [value]

    values = []
    for item in raw:
        values.extend(str(item).split(","))

    cleaned = []
    for value in values:
        value = value.strip()
        if not value:
            continue
        try:
            uuid.UUID(value)
        except (ValueError, AttributeError, TypeError):
            raise ValueError(value)
        cleaned.append(value)
    # Preserve order, drop duplicates.
    return list(dict.fromkeys(cleaned))
