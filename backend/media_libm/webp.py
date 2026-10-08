import os
from io import BytesIO
from PIL import Image, ImageOps
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import InMemoryUploadedFile


def to_webp_file(file, quality: int = 82) -> InMemoryUploadedFile | ContentFile:
    """
    Converts any incoming image to WebP format, preserving transparency and correcting EXIF orientation.
    Returns an InMemoryUploadedFile with .webp extension and 'image/webp' content-type.
    """
    file.seek(0)
    img = Image.open(file)
    img = ImageOps.exif_transpose(img)

    if img.mode in ("RGBA", "LA"):
        pass
    elif img.mode == "P":
        img = img.convert("RGBA" if "transparency" in img.info else "RGB")
    else:
        img = img.convert("RGB")

    buf = BytesIO()
    img.save(buf, format="WEBP", quality=quality, method=6)
    buf.seek(0)

    orig_name = getattr(file, "name", "image.jpg")
    base_name = os.path.splitext(orig_name)[0]
    webp_name = f"{base_name}.webp"

    return InMemoryUploadedFile(
        file=buf,
        field_name=getattr(file, "field_name", None),
        name=webp_name,
        content_type="image/webp",
        size=buf.getbuffer().nbytes,
        charset=None,
    )


def ensure_webp_field(instance, field_name: str, quality: int = 82):
    """
    Ensures that a FileField / ImageField on a model instance is converted to WebP before save.
    Skips if empty or already a WebP image.
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
    except Exception:
        pass
