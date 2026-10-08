from django.contrib.contenttypes.models import ContentType
from django.core.files.base import ContentFile
from .repositories import MediaRepository
from .selectors import MediaSelector
from .tasks import generate_thumbnails
from common.exceptions import BusinessException
from product_options.models import ProductOption


class MediaService:
    ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
    ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm']
    MAX_FILE_SIZE_MB = 20

    def upload_media(self, obj, file, media_type='image', alt_text='', caption='', position=0) -> dict:
        # Validate file type and size
        self._validate_file(file, media_type)
        # Every image entering the site becomes WebP (originals replaced)
        if media_type == 'image':
            from .webp import to_webp_file

            file = to_webp_file(file)
        content_type = ContentType.objects.get_for_model(obj)
        media = MediaRepository.create_media(
            content_type=content_type,
            object_id=obj.id,
            file=file,
            media_type=media_type,
            alt_text=alt_text,
            caption=caption,
            position=position,
        )
        # If image, trigger async thumbnail generation
        if media_type == 'image':
            generate_thumbnails.delay(str(media.id))
        return self._serialize(media)

    def update_media(self, media_id: str, data: dict) -> dict:
        media = MediaSelector.get_media_by_id(media_id)
        if not media:
            raise BusinessException("Media not found.")
        updated = MediaRepository.update_media(media, **data)
        return self._serialize(updated)

    def delete_media(self, media_id: str) -> dict:
        media = MediaSelector.get_media_by_id(media_id)
        if not media:
            raise BusinessException("Media not found.")
        MediaRepository.delete_media(media)
        return {"message": "Media deleted."}

    def reorder_media(self, obj, ordered_ids: list[str]) -> dict:
        """Reorder media_libm items for a given object to match the order of IDs."""
        content_type = ContentType.objects.get_for_model(obj)
        for position, media_id in enumerate(ordered_ids):
            media = MediaSelector.get_media_by_id(media_id)
            if media and media.content_type == content_type and media.object_id == obj.id:
                MediaRepository.update_media(media, position=position)
        return {"message": "Media reordered."}

    def _validate_file(self, file, media_type):
        import os
        ext = os.path.splitext(file.name)[1].lower().lstrip('.')
        if media_type == 'image' and ext not in self.ALLOWED_IMAGE_EXTENSIONS:
            raise BusinessException(f"Unsupported image format. Allowed: {', '.join(self.ALLOWED_IMAGE_EXTENSIONS)}")
        if media_type == 'video' and ext not in self.ALLOWED_VIDEO_EXTENSIONS:
            raise BusinessException(f"Unsupported video format. Allowed: {', '.join(self.ALLOWED_VIDEO_EXTENSIONS)}")
        if file.size > self.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise BusinessException(f"File too large. Maximum size: {self.MAX_FILE_SIZE_MB}MB")

    def _serialize(self, media) -> dict:
        return {
            'id': str(media.id),
            'url': media.file.url if media.file else None,
            'media_type': media.media_type,
            'alt_text': media.alt_text,
            'caption': media.caption,
            'position': media.position,
            'metadata': media.metadata,
        }
