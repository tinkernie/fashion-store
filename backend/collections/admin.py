from django.contrib import admin
from .models import Collection, CollectionProduct


class CollectionProductInline(admin.TabularInline):
    model = CollectionProduct
    extra = 1
    raw_id_fields = ('product',)


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'priority', 'is_active', 'published_from', 'published_until')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [CollectionProductInline]
