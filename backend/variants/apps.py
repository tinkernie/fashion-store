from django.apps import AppConfig


class VariantsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "variants"

    def ready(self):
        # Registers the pre_save hook that gives every variant a barcode.
        from . import signals  # noqa: F401
