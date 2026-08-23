from django.contrib import admin
from .models import Page, SiteContent


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug', 'status', 'updated_at']
    prepopulated_fields = {'slug': ('title',)}
    search_fields = ['title', 'content']


@admin.register(SiteContent)
class SiteContentAdmin(admin.ModelAdmin):
    list_display = ['key', 'updated_at']
