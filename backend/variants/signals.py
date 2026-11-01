"""Variant signal handlers.

Barcode auto-generation lives here (wired in VariantsConfig.ready) so every
creation path is covered without each caller remembering it:
- admin API (variant repositories)
- the DEFAULT placeholder variant seeded at product creation
- seed scripts and management commands (Variant.objects.create)
"""
from django.db.models.signals import pre_save
from django.dispatch import receiver

from .barcodes import ensure_barcode
from .models import Variant


@receiver(pre_save, sender=Variant)
def auto_generate_barcode(sender, instance, **kwargs):
    """Every variant of every product ends up with its own barcode: variants
    created without one get a random EAN-13-compatible value; explicitly set
    barcodes (admin-entered) are preserved. Blank/NULL on update regenerates.
    """
    ensure_barcode(instance)
