from django.contrib import admin
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product_snapshot", "price_snapshot"]


class StatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ["from_status", "to_status", "timestamp"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["order_number", "channel", "user", "status", "total", "placed_at"]
    list_filter = ["channel", "status", "placed_at"]
    search_fields = ["order_number", "user__email", "customer_phone", "pos_terminal"]
    inlines = [OrderItemInline, StatusHistoryInline]
    readonly_fields = ["order_number"]
