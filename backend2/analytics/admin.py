from django.contrib import admin
from .models import TrackedEvent


@admin.register(TrackedEvent)
class TrackedEventAdmin(admin.ModelAdmin):
    list_display = ['type', 'user', 'session_key', 'timestamp']
    list_filter = ['type', 'timestamp']
    search_fields = ['payload']
