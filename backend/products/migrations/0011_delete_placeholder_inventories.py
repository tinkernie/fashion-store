from django.db import migrations


def delete_placeholder_inventories(apps, schema_editor):
    """The common/DEFAULT variant never holds stock. Remove legacy rows
    (historically seeded with available_quantity=50) so product totals are
    the sum of real option variants only.

    Reservations pointing at a placeholder's inventory cannot ever be
    committed (the DEFAULT variant is not purchasable), so they are cleared
    first — otherwise the Reservation.inventory PROTECT FK blocks the delete.
    """
    Inventory = apps.get_model("inventory", "Inventory")
    Reservation = apps.get_model("inventory", "Reservation")
    res_deleted, _ = Reservation.objects.filter(
        inventory__variant__sku__endswith="-DEFAULT"
    ).delete()
    placeholder = Inventory.objects.filter(variant__sku__endswith="-DEFAULT")
    deleted, _ = placeholder.delete()
    if res_deleted or deleted:
        print(
            f"Removed {res_deleted} stale reservation row(s) and {deleted} "
            "placeholder inventory row(s)."
        )


def restore_placeholder_inventories(apps, schema_editor):
    """Not reversible; the deleted rows were data corruption, not data."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0010_product_insta_id"),
        ("inventory", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(
            delete_placeholder_inventories, restore_placeholder_inventories
        ),
    ]
