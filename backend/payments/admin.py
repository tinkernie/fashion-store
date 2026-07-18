from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['authority', 'order', 'amount', 'gateway', 'status', 'created_at']
    list_filter = ['status', 'gateway']
    search_fields = ['authority', 'gateway_reference', 'order__order_number']