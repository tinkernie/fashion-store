"""Backfill: give every existing variant (active and soft-deleted) a barcode
when it has none (NULL or blank). Rows created after 2025 already report a
barcode through the admin; this closes the historical gap so the owner can
print labels for the whole catalog later.
"""
from django.db import migrations


def backfill(apps, schema_editor):
    from django.db.models import Q

    from variants.barcodes import assign_unique_barcode

    Variant = apps.get_model("variants", "Variant")
    # Historical model: the default manager covers all rows (custom managers
    # are not migrated), which is strict enough — it also avoids reusing
    # barcodes held by soft-deleted variants, even though the live constraint
    # would allow that.
    taken = set(
        Variant.objects.exclude(barcode=None)
        .exclude(barcode="")
        .values_list("barcode", flat=True)
    )

    def is_taken(candidate: str) -> bool:
        return candidate in taken or Variant.objects.filter(barcode=candidate).exists()

    qs = Variant.objects.filter(Q(barcode__isnull=True) | Q(barcode=""))
    for variant in qs.iterator():
        barcode = assign_unique_barcode(is_taken)
        variant.barcode = barcode
        taken.add(barcode)
        variant.save(update_fields=["barcode", "updated_at"])


class Migration(migrations.Migration):

    dependencies = [
        ("variants", "0004_alter_variant_barcode_alter_variant_sku_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill, migrations.RunPython.noop),
    ]
