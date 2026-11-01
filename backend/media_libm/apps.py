from django.apps import AppConfig


class MediaConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "media_libm"

    def ready(self):
        try:
            import pillow_heif
            pillow_heif.register_heif_opener()
        except Exception:
            pass
        import media_libm.signals  # noqa: F401 - registers WebP pre_save hooks
