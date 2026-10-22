from django.db.models.signals import pre_save
from django.dispatch import receiver

from .models import Product
from .services import allocate_insta_id


@receiver(pre_save, sender=Product)
def assign_insta_id(sender, instance, **kwargs):
    """Scope every insertion path (admin, API, shell, fixtures) unless the
    value was set deliberately (e.g. import scripts pinning codes)."""
    if getattr(instance, "insta_id", None) is None:
        instance.insta_id = allocate_insta_id()
