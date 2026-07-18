from django.contrib import admin
from .models import EmailChangeRequest


@admin.register(EmailChangeRequest)
class EmailChangeRequestAdmin(admin.ModelAdmin):
    list_display = ["user", "new_email", "is_used", "created_at"]
