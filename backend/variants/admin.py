from django.contrib import admin
from .models import Variant, VariantOption


class VariantOptionInline(admin.TabularInline):
    model = VariantOption
    extra = 1


@admin.register(Variant)
class VariantAdmin(admin.ModelAdmin):
    list_display = ("sku", "product", "price", "status", "availability")
    search_fields = ("sku", "barcode", "product__title")
    list_filter = ("status", "availability")
    inlines = [VariantOptionInline]
