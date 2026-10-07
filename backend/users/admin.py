from django.contrib import admin
from .models import PhoneChangeRequest


@admin.register(PhoneChangeRequest)
class PhoneChangeRequestAdmin(admin.ModelAdmin):
    list_display = ["user", "new_phone", "is_used", "created_at"]
