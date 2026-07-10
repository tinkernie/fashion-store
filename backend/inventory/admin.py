from django.contrib import admin
from .models import Inventory, Reservation

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['variant', 'available_quantity', 'reserved_quantity', 'status']
    readonly_fields = ['version']

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['inventory', 'user', 'quantity', 'status', 'expires_at']