from django.contrib import admin
from .models import ProductOption, OptionValue


class OptionValueInline(admin.TabularInline):
    model = OptionValue
    extra = 1


@admin.register(ProductOption)
class ProductOptionAdmin(admin.ModelAdmin):
    list_display = ["product", "name", "display_order"]
    inlines = [OptionValueInline]
