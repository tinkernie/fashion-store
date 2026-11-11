"""Seed the new ledger with an opening balance for existing stock.

Without this, stock that was on the shelf before the ledger existed would have
no movements, and `sum(quantity_delta)` would not match `available_quantity`.
Each non-empty inventory gets one ADJUSTMENT row whose `quantity_after` equals
its current balance.
"""

from django.db import migrations


def create_opening_balances(apps, schema_editor):
    Inventory = apps.get_model("inventory", "Inventory")
    StockMovement = apps.get_model("inventory", "StockMovement")

    rows = [
        StockMovement(
            inventory_id=inventory.id,
            quantity_delta=inventory.available_quantity,
            quantity_after=inventory.available_quantity,
            reason="adjustment",
            note="opening balance (ledger introduced)",
        )
        for inventory in Inventory.objects.exclude(available_quantity=0)
    ]
    StockMovement.objects.bulk_create(rows, batch_size=500)


def remove_opening_balances(apps, schema_editor):
    StockMovement = apps.get_model("inventory", "StockMovement")
    StockMovement.objects.filter(
        reason="adjustment", note="opening balance (ledger introduced)"
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0002_stockmovement"),
    ]

    operations = [
        migrations.RunPython(create_opening_balances, remove_opening_balances),
    ]
