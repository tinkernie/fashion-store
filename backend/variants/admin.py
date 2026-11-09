from django.contrib import admin

from .exports import (
    build_label_response,
    optimize_label_queryset,
    truthy,
)
from .models import BarcodeSequence, Variant, VariantOption


class VariantOptionInline(admin.TabularInline):
    model = VariantOption
    extra = 1


@admin.register(Variant)
class VariantAdmin(admin.ModelAdmin):
    list_display = ("sku", "barcode", "product", "price", "status", "availability")
    search_fields = ("sku", "barcode", "product__title")
    list_filter = ("status", "availability")
    inlines = [VariantOptionInline]
    actions = ["export_labels"]

    @admin.action(description="Export labels for BarTender (TSV, ?format=csv for CSV)")
    def export_labels(self, request, queryset):
        return build_label_response(
            optimize_label_queryset(queryset),
            fmt=request.GET.get("format", "tsv"),
        )


@admin.register(BarcodeSequence)
class BarcodeSequenceAdmin(admin.ModelAdmin):
    list_display = ("prefix", "last_value")
    readonly_fields = ("prefix", "last_value")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# `truthy` is re-exported for callers/tests that import it from here.
__all__ = ["VariantAdmin", "BarcodeSequenceAdmin", "VariantOptionInline", "truthy"]
