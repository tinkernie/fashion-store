from django.contrib import admin
from mptt.admin import MPTTModelAdmin
from .models import Category


@admin.register(Category)
class CategoryAdmin(MPTTModelAdmin):
    list_display = ("name", "slug", "is_active", "parent")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")
