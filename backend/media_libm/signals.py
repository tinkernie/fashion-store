import logging
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Media
from .webp import ensure_webp_field

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Media)
def media_pre_save_webp(sender, instance, **kwargs):
    if instance.media_type == "image":
        ensure_webp_field(instance, "file")


try:
    from products.models import ProductImage

    @receiver(pre_save, sender=ProductImage)
    def product_image_pre_save_webp(sender, instance, **kwargs):
        ensure_webp_field(instance, "image")
except Exception as e:
    logger.debug("ProductImage model not available for WebP hook: %s", e)


try:
    from categories.models import Category

    @receiver(pre_save, sender=Category)
    def category_pre_save_webp(sender, instance, **kwargs):
        ensure_webp_field(instance, "image")
except Exception as e:
    logger.debug("Category model not available for WebP hook: %s", e)


try:
    from store_collections.models import Collection

    @receiver(pre_save, sender=Collection)
    def collection_pre_save_webp(sender, instance, **kwargs):
        ensure_webp_field(instance, "hero_banner")
except Exception as e:
    logger.debug("Collection model not available for WebP hook: %s", e)
