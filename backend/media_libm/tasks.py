import logging
from celery import shared_task
from io import BytesIO
from PIL import Image
from django.core.files.base import ContentFile
from django.db.utils import OperationalError
from .models import Media

logger = logging.getLogger(__name__)

RESPONSIVE_WIDTHS = [480, 768, 1280]


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

    img = Image.open(media.file)
    img_format = img.format or 'JPEG'
    original_name = media.file.name.rsplit('.', 1)[0]
    metadata = media.metadata.copy()

    # Generate thumbnail (200x200)
    thumb_img = img.copy()
    thumb_img.thumbnail((200, 200), Image.Resampling.LANCZOS)
    thumb_io = BytesIO()
    thumb_img.save(thumb_io, format='JPEG')
    thumb_name = f"{original_name}_thumb.jpg"
    # Save thumbnail to the same storage
    from django.core.files.storage import default_storage
    thumb_path = default_storage.save(thumb_name, ContentFile(thumb_io.getvalue()))
    metadata['thumbnail'] = default_storage.url(thumb_path)

    # Generate responsive images
    responsive = {}
    for width in RESPONSIVE_WIDTHS:
        resp_img = img.copy()
        if resp_img.width > width:
            ratio = width / resp_img.width
            height = int(resp_img.height * ratio)
            resp_img = resp_img.resize((width, height), Image.Resampling.LANCZOS)
        resp_io = BytesIO()
        resp_img.save(resp_io, format=img_format)
        resp_name = f"{original_name}_{width}w.{img_format.lower()}"
        resp_path = default_storage.save(resp_name, ContentFile(resp_io.getvalue()))
        responsive[str(width)] = default_storage.url(resp_path)
    metadata['responsive'] = responsive

    media.metadata = metadata
    media.save(update_fields=['metadata', 'updated_at'])
