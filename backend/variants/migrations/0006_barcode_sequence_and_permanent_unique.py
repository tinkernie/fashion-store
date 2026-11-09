"""Barcode hardening.

1. `uq_variant_barcode` replaces `uq_variant_barcode_active`: uniqueness is
   now permanent across soft-deleted rows, because a barcode is printed on a
   physical label and must never be reissued to another variant.
2. Adds `BarcodeSequence`, the row-locked counter used for sequential
   in-store EAN-13 allocation (`20` + counter + check digit).

The guard refuses to continue if duplicate barcodes already exist, because
the new constraint cannot be created in that case. Fix them with
`python manage.py audit_barcodes` (reports duplicates) before migrating.
"""
from django.db import migrations, models
from django.db.models import Count


def check_duplicate_barcodes(apps, schema_editor):
    Variant = apps.get_model("variants", "Variant")
    duplicates = (
        Variant.objects.exclude(barcode__isnull=True)
        .values("barcode")
        .annotate(n=Count("id"))
        .filter(n__gt=1)
        .order_by("barcode")[:10]
    )
    duplicates = list(duplicates)
    if duplicates:
        sample = ", ".join(f"{row['barcode']} x{row['n']}" for row in duplicates)
        raise RuntimeError(
            "Cannot enforce permanent barcode uniqueness: duplicate values "
            f"exist ({sample}). Give each variant a distinct barcode, then "
            "re-run migrate."
        )


class Migration(migrations.Migration):

    dependencies = [
        ("variants", "0005_backfill_variant_barcodes"),
    ]

    operations = [
        migrations.CreateModel(
            name="BarcodeSequence",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("prefix", models.CharField(max_length=3, unique=True)),
                ("last_value", models.PositiveBigIntegerField(default=0)),
            ],
            options={
                "db_table": "barcode_sequence",
            },
        ),
        migrations.RunPython(check_duplicate_barcodes, migrations.RunPython.noop),
        migrations.RemoveConstraint(
            model_name="variant",
            name="uq_variant_barcode_active",
        ),
        migrations.AddConstraint(
            model_name="variant",
            constraint=models.UniqueConstraint(
                fields=("barcode",), name="uq_variant_barcode"
            ),
        ),
    ]
