from django.contrib import admin
from .models import Media


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ['id', 'content_type', 'object_id', 'media_type', 'alt_text', 'position']
    list_filter = ['media_type', 'content_type']
    search_fields = ['alt_text', 'caption']
