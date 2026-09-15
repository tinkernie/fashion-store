from django.contrib import admin
from .models import Product, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "image_url", "position", "is_cover", "alt_text")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "status", "category", "created_at")
    prepopulated_fields = {"slug": ("title",)}
    list_filter = ("status", "category")
    search_fields = ("title", "description")
    inlines = [ProductImageInline]


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("product", "position", "is_cover", "created_at")
    list_filter = ("is_cover",)
    search_fields = ("product__title", "alt_text")

