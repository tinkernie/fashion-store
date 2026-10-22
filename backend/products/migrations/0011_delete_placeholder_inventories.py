from django.db import migrations


def delete_placeholder_inventories(apps, schema_editor):
    """The common/DEFAULT variant never holds stock. Remove legacy rows
    (historically seeded with available_quantity=50) so product totals are
    the sum of real option variants only."""
    Inventory = apps.get_model("inventory", "Inventory")
    deleted, _ = Inventory.objects.filter(
        variant__sku__endswith="-DEFAULT"
    ).delete()
    if deleted:
        print(f"Removed {deleted} placeholder inventory rows.")


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
