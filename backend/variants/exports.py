"""Variant label export for barcode printing (BarTender).

Produces a 4-column sheet — `barcode`, `product_name`, `options_summary`,
`stock_count` — where `stock_count` doubles as the copy count. Default format
is TSV: BarTender's text-file driver treats every field as a string, so
leading zeros and Persian text survive untouched and nobody can "accidentally
save it from Excel". `format=csv` is available for spreadsheet users; both
are UTF-8 with BOM (utf-8-sig) so Windows/Excel/BarTender render Persian
correctly.

Placeholder `-DEFAULT` variants (price basis, never sold, no inventory) are
always excluded. Out-of-stock variants are excluded unless
`include_out_of_stock=1` is passed (reprinting tags for a restock).
"""
import csv
import io

from django.db.models import Prefetch
from django.http import HttpResponse
from django.utils import timezone

from .models import Variant, VariantOption

LABEL_COLUMNS = ("barcode", "product_name", "options_summary", "stock_count")
DEFAULT_SKU_SUFFIX = "-DEFAULT"
OPTIONS_SEPARATOR = " | "


def _clean(value) -> str:
    """Collapse tabs/newlines so one variant can never break the file's rows."""
    return " ".join(str(value if value is not None else "").replace("\t", " ").split())


def optimize_label_queryset(queryset):
    """Add everything needed for 3 queries total, no N+1:
    product + inventory via JOIN, option rows via one prefetch."""
    return (
        queryset.filter(deleted_at__isnull=True)
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
):
    qs = Variant.objects.filter(deleted_at__isnull=True)
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


def label_rows(queryset):
    for variant in queryset:
        inventory = getattr(variant, "inventory", None)
        yield (
            variant.barcode or "",
            _clean(variant.product.title if variant.product_id else ""),
            _clean(options_summary(variant)),
            int(inventory.available_quantity) if inventory else 0,
        )


def build_label_response(queryset, fmt: str = "tsv") -> HttpResponse:
    fmt = (fmt or "tsv").lower()
    is_csv = fmt == "csv"
    delimiter = "," if is_csv else "\t"

    buffer = io.StringIO()
    buffer.write("\ufeff")  # utf-8-sig equivalent: BOM for Windows/Excel
    writer = csv.writer(
        buffer, delimiter=delimiter, lineterminator="\r\n", quoting=csv.QUOTE_MINIMAL
    )
    writer.writerow(LABEL_COLUMNS)
    for row in label_rows(queryset):
        writer.writerow(row)

    extension = "csv" if is_csv else "tsv"
    content_type = "text/csv" if is_csv else "text/tab-separated-values"
    filename = (
        f"variant-labels-{timezone.localtime():%Y%m%d-%H%M}.{extension}"
    )
    response = HttpResponse(buffer.getvalue(), content_type=f"{content_type}; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response["X-Label-Rows"] = str(buffer.getvalue().count("\r\n") - 1)
    return response


def truthy(value) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "on"}
