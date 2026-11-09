from django.apps import AppConfig


class VariantsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "variants"

    # Barcode auto-generation now lives in Variant.save() (see
    # variants/models.py) instead of a pre_save receiver: a receiver cannot
    # widen save(update_fields=[...]), which could silently drop the value.
