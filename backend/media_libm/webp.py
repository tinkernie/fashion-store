import logging
import os
from io import BytesIO
from PIL import Image, ImageOps
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import InMemoryUploadedFile

logger = logging.getLogger(__name__)

# Single source of truth for the whole WebP pipeline (upload service,
# pre-save signals, thumbnail task all import from here).
WEBP_QUALITY = 82
WEBP_METHOD = 6
# Stored originals are downscaled to this long edge: full quality for
# storefront/zoom use, but no 20 MB phone photos on disk or wire.
MAX_STORED_DIMENSION = 2048
# Hard guard before Pillow allocates: hostile/gigantic files are rejected
# instead of blowing up worker memory (Pillow's own limit is far higher).
MAX_IMAGE_PIXELS = 50_000_000


def prepare_image(file) -> Image.Image:
    """Open, validate and normalize an uploaded image.

    EXIF orientation corrected, transparency preserved, mode normalized,
    oversized originals downscaled to MAX_STORED_DIMENSION. Raises
    ValueError with a human message for corrupt/oversized files.
    """
    try:
        file.seek(0)
    except Exception:
        pass
    try:
        img = Image.open(file)
        width, height = img.size
    except Exception:
        raise ValueError("Invalid image file.")
    if width <= 0 or height <= 0 or width * height > MAX_IMAGE_PIXELS:
        raise ValueError("Image dimensions are too large.")
    try:
        img.load()
    except Exception:
        raise ValueError("Invalid or truncated image file.")
    img = ImageOps.exif_transpose(img)

    if img.mode in ("RGBA", "LA"):
        pass
    elif img.mode == "P":
        img = img.convert("RGBA" if "transparency" in img.info else "RGB")
    else:
        img = img.convert("RGB")

    long_edge = max(img.width, img.height)
    if long_edge > MAX_STORED_DIMENSION:
        ratio = MAX_STORED_DIMENSION / long_edge
        img = img.resize(
            (max(1, int(img.width * ratio)), max(1, int(img.height * ratio))),
            Image.Resampling.LANCZOS,
        )
    return img


def image_to_webp_bytes(img: Image.Image, quality: int = WEBP_QUALITY) -> bytes:
    buf = BytesIO()
    img.save(buf, format="WEBP", quality=quality, method=WEBP_METHOD)
    return buf.getvalue()


def to_webp_file(file, quality: int = WEBP_QUALITY) -> InMemoryUploadedFile:
    """
    Converts any incoming image to WebP, preserving transparency, correcting
    EXIF orientation and downscaling huge originals (see prepare_image).
    Returns an InMemoryUploadedFile with .webp extension and 'image/webp'
    content-type. Raises ValueError for invalid files.
    """
    img = prepare_image(file)
    content = image_to_webp_bytes(img, quality=quality)
    buf = BytesIO(content)
    buf.seek(0)

    orig_name = getattr(file, "name", "image.jpg")
    base_name = os.path.splitext(os.path.basename(orig_name))[0] or "image"
    webp_name = f"{base_name}.webp"

    return InMemoryUploadedFile(
        file=buf,
        field_name=getattr(file, "field_name", None),
        name=webp_name,
        content_type="image/webp",
        size=len(content),
        charset=None,
    )


def ensure_webp_field(instance, field_name: str, quality: int = WEBP_QUALITY):
    """
    Ensures that a FileField / ImageField on a model instance is converted to WebP before save.
    Skips if empty or already a WebP image. Conversion failures are logged
    (and leave the original file) instead of failing the whole save.
    """
    field_file = getattr(instance, field_name, None)
    if not field_file or not getattr(field_file, "file", None):
        return

    name = getattr(field_file, "name", "")
    if name.lower().endswith(".webp"):
        return

    try:
        webp_file = to_webp_file(field_file.file, quality=quality)
        field_file.save(webp_file.name, webp_file, save=False)
    except ValueError as exc:
        logger.warning("WebP conversion skipped for %s.%s (%s): %s",
                       type(instance).__name__, field_name, name, exc)
    except Exception as exc:  # never break a product/category save
        logger.warning("WebP conversion failed for %s.%s (%s): %s",
                       type(instance).__name__, field_name, name, exc)
