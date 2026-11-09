"""Read-only barcode audit: run before/after the permanent-uniqueness
migration and whenever label printing looks off."""
from collections import Counter

from django.core.management.base import BaseCommand
from django.db.models import Count

from variants.barcodes import is_valid_ean13
from variants.models import Variant


class Command(BaseCommand):
    help = "Report barcode coverage, duplicates, and EAN-13 validity (read-only)."

    def handle(self, *args, **options):
        rows = list(
            Variant.all_objects.values_list("sku", "barcode", "deleted_at")
        )
        total = len(rows)
        blank = [sku for sku, barcode, _ in rows if not barcode]
        values = [barcode for _, barcode, _ in rows if barcode]
        lengths = Counter(len(value) for value in values)
        invalid = [
            (sku, barcode)
            for sku, barcode, _ in rows
            if barcode and not is_valid_ean13(str(barcode))
        ]
        duplicates = (
            Variant.all_objects.exclude(barcode__isnull=True)
            .exclude(barcode="")
            .values("barcode")
            .annotate(n=Count("id"))
            .filter(n__gt=1)
            .order_by("barcode")
        )

        self.stdout.write(f"variants (incl. soft-deleted): {total}")
        self.stdout.write(f"missing barcode: {len(blank)}")
        self.stdout.write(
            "length distribution: "
            + (", ".join(f"{length} chars={n}" for length, n in sorted(lengths.items())) or "none")
        )
        self.stdout.write(f"not valid EAN-13: {len(invalid)}")
        for sku, barcode in invalid[:20]:
            self.stdout.write(f"  - {sku}: {barcode}")

        duplicate_rows = list(duplicates)
        self.stdout.write(f"duplicate barcodes: {len(duplicate_rows)}")
        for row in duplicate_rows[:20]:
            self.stdout.write(f"  - {row['barcode']} x{row['n']}")

        if blank or invalid or duplicate_rows:
            self.stdout.write(
                self.style.WARNING(
                    "Legacy/invalid values are left untouched by design; only "
                    "duplicates block the permanent-uniqueness migration."
                )
            )
        else:
            self.stdout.write(self.style.SUCCESS("Barcodes are clean."))
