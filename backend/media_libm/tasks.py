import logging
from celery import shared_task
from PIL import Image
from django.core.files.base import ContentFile
from django.db.utils import OperationalError
from .models import Media
from .webp import WEBP_QUALITY, image_to_webp_bytes, prepare_image

logger = logging.getLogger(__name__)

RESPONSIVE_WIDTHS = [480, 768, 1280]
THUMB_SIZE = (200, 200)


@shared_task(
    bind=True,
    acks_late=True,
    time_limit=120,
    soft_time_limit=90,
    autoretry_for=(OperationalError, ConnectionError, TimeoutError),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=2,
)
def generate_thumbnails(self, media_id: str):
    try:
        media = Media.objects.get(id=media_id)
    except Media.DoesNotExist:
        logger.warning("generate_thumbnails: media %s not found", media_id)
        return

    if media.media_type != 'image':
        return

    try:
        with media.file.open("rb") as fh:
            img = prepare_image(fh)
    except ValueError as exc:
        logger.warning("generate_thumbnails: invalid image %s: %s", media.id, exc)
        return
    except Exception as exc:
        logger.warning("generate_thumbnails: cannot open %s: %s", media.id, exc)
        return
    original_name = media.file.name.rsplit('.', 1)[0]
    metadata = media.metadata.copy() if isinstance(media.metadata, dict) else {}

    def _save_webp(image, name):
        from django.core.files.storage import default_storage

        path = default_storage.save(
            name, ContentFile(image_to_webp_bytes(image, quality=WEBP_QUALITY))
        )
        return default_storage.url(path)

    # Generate thumbnail (200x200) as WebP
    thumb_img = img.copy()
    thumb_img.thumbnail(THUMB_SIZE, Image.Resampling.LANCZOS)
    metadata['thumbnail'] = _save_webp(thumb_img, f"{original_name}_thumb.webp")

    # Generate responsive images as WebP
    responsive = {}
    for width in RESPONSIVE_WIDTHS:
        resp_img = img.copy()
        if resp_img.width > width:
            ratio = width / resp_img.width
            height = int(resp_img.height * ratio)
            resp_img = resp_img.resize((width, height), Image.Resampling.LANCZOS)
        responsive[str(width)] = _save_webp(resp_img, f"{original_name}_{width}w.webp")
    metadata['responsive'] = responsive

    media.metadata = metadata
    media.save(update_fields=['metadata', 'updated_at'])
