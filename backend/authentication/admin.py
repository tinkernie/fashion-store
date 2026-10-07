from django.contrib import admin
from .models import OtpCode


@admin.register(OtpCode)
class OtpCodeAdmin(admin.ModelAdmin):
    list_display = ["phone_number", "purpose", "is_used", "attempts", "expires_at", "created_at"]
    list_filter = ["purpose", "is_used"]
    search_fields = ["phone_number"]
