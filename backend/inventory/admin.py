from django.contrib import admin
from .models import Inventory, Reservation, StockMovement


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ["variant", "available_quantity", "reserved_quantity", "status"]
    readonly_fields = ["version"]


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ["inventory", "user", "quantity", "status", "expires_at"]


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    """Read-only ledger view."""

    list_display = [
        "created_at",
        "inventory",
        "reason",
        "quantity_delta",
        "quantity_after",
        "order",
    ]
    list_filter = ["reason", "created_at"]
    search_fields = ["inventory__variant__sku", "order__order_number"]
    readonly_fields = [
        "inventory",
        "quantity_delta",
        "quantity_after",
        "reason",
        "order",
        "reservation",
        "actor",
        "note",
        "created_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
