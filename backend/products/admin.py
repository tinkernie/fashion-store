from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'status', 'category', 'created_at')
    prepopulated_fields = {'slug': ('title',)}
    list_filter = ('status', 'category')
    search_fields = ('title', 'description')