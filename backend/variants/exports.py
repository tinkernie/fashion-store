"""Variant label export for barcode printing (BarTender).

Produces a 3-column sheet — `barcode`, `product_name`, `options_summary`.
Default format is TSV: BarTender's text-file driver treats every field as a
string, so leading zeros and Persian text survive untouched and nobody can
"accidentally save it from Excel". `format=csv` is available for spreadsheet
users; both are UTF-8 with BOM (utf-8-sig) so Windows/Excel/BarTender render
Persian correctly.

Label copy counts are deliberately not part of the file: labels are printed
one per row and the printer/counter decides how many to run.

Placeholder `-DEFAULT` variants (price basis, never sold, no inventory) are
always excluded. Out-of-stock variants are excluded unless
`include_out_of_stock=1` is passed (reprinting tags for a restock).

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


def _clean(value) -> str:
    """Collapse tabs/newlines so one variant can never break the file's rows."""
    return " ".join(str(value if value is not None else "").replace("\t", " ").split())


def optimize_label_queryset(queryset):
    """Add everything needed for 3 queries total, no N+1:
    product via JOIN, option rows via one prefetch."""
    return (
        queryset.filter(deleted_at__isnull=True)
        .exclude(sku__endswith=DEFAULT_SKU_SUFFIX)
        .select_related("product")
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


def label_rows(queryset):
    for variant in queryset:
        yield (
            variant.barcode or "",
            _clean(variant.product.title if variant.product_id else ""),
            _clean(options_summary(variant)),
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
