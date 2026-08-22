from django.contrib.contenttypes.models import ContentType
from .models import Media
from product_options.models import ProductOption


class MediaSelector:
    @staticmethod
    def get_media_for_object(obj) -> list[Media]:
        content_type = ContentType.objects.get_for_model(obj)
        return Media.objects.filter(
            content_type=content_type,
            object_id=obj.id,
            deleted_at__isnull=True
        ).order_by('position')

    @staticmethod
    def get_media_by_id(media_id: str) -> Media or None:
        return Media.objects.filter(id=media_id, deleted_at__isnull=True).first()

    @staticmethod
    def get_media_for_product_option(option_id: str) -> list[Media]:
        option = ProductOption.objects.filter(id=option_id).first()
        if not option:
            return []
        return MediaSelector.get_media_for_object(option)

    @staticmethod
    def get_main_image_for_product(product) -> dict or None:
        # Get first product option (e.g., Color)
        option = product.options.filter(deleted_at__isnull=True).first()
        if not option:
            return None
        media = MediaSelector.get_media_for_object(option)
        if media:
            first = media[0]
            return {
                'url': first.file.url,
                'alt_text': first.alt_text,
                'thumbnail': first.metadata.get('thumbnail'),
            }
        return None
