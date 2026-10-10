import os
import uuid
from urllib.parse import urlparse

from django.conf import settings
from django.core.files.base import ContentFile
from rest_framework import serializers


MAX_BANNER_BYTES = 10 * 1024 * 1024
ALLOWED_BANNER_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}


def _banner_name_from_url(path: str) -> str:
    base = os.path.basename(path.rstrip("/")) or ("banner-%s" % uuid.uuid4().hex[:8])
    stem, ext = os.path.splitext(base)
    ext = ext.lower()
    if ext not in ALLOWED_BANNER_EXTS:
        ext = ".jpg"
        base = (stem or "banner") + ext
    return base


def resolve_banner_url(url: str):
    """Turn an image URL string into a Django file for hero_banner.

    Same-server media URLs (/media_libm/...) are read straight from
    MEDIA_ROOT (no re-download); remote http(s) URLs are fetched with
    tight timeout/size guards. Raises ValidationError on any problem.
    """
    parsed = urlparse(url)
    path = parsed.path or ""
    if parsed.scheme not in ("http", "https", "") or (parsed.scheme == "" and not path):
        raise serializers.ValidationError("Enter a valid image URL or upload a file.")

    media_prefix = getattr(settings, "MEDIA_URL", "/media_libm/")
    if path.startswith(media_prefix):
        local = os.path.join(
            str(getattr(settings, "MEDIA_ROOT", "")), path[len(media_prefix):].lstrip("/")
        )
        if not os.path.isfile(local):
            raise serializers.ValidationError("Image URL does not match any stored media file.")
        if os.path.getsize(local) > MAX_BANNER_BYTES:
            raise serializers.ValidationError("Image file is too large (max 10 MB).")
        try:
            with open(local, "rb") as fh:
                content = fh.read()
        except OSError:
            raise serializers.ValidationError("Image file could not be read.")
        if not content:
            raise serializers.ValidationError("Image file is empty.")
        return ContentFile(content, name=_banner_name_from_url(path))

    if parsed.scheme not in ("http", "https"):
        raise serializers.ValidationError("Enter a valid image URL or upload a file.")
    import requests

    try:
        resp = requests.get(url, timeout=10, stream=True)
    except Exception:
        raise serializers.ValidationError("Image URL could not be downloaded.")
    if resp.status_code != 200:
        raise serializers.ValidationError("Image URL could not be downloaded.")
    content_type = (resp.headers.get("Content-Type") or "").split(";")[0].strip().lower()
    if not content_type.startswith("image/"):
        raise serializers.ValidationError("URL does not point to an image file.")
    length = resp.headers.get("Content-Length")
    if length and length.isdigit() and int(length) > MAX_BANNER_BYTES:
        raise serializers.ValidationError("Image file is too large (max 10 MB).")
    try:
        content = resp.content
    except Exception:
        raise serializers.ValidationError("Image URL could not be downloaded.")
    if len(content) > MAX_BANNER_BYTES:
        raise serializers.ValidationError("Image file is too large (max 10 MB).")
    if not content:
        raise serializers.ValidationError("Downloaded image is empty.")
    return ContentFile(content, name=_banner_name_from_url(path))


class HeroBannerField(serializers.ImageField):
    """hero_banner accepts either a multipart file upload or an image URL
    string (typically a media-library URL returned by the uploader)."""

    def to_internal_value(self, data):
        if isinstance(data, str):
            data = data.strip()
            if not data:
                return None
            data = resolve_banner_url(data)
        return super().to_internal_value(data)


class CollectionCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    slug = serializers.SlugField()
    description = serializers.CharField(required=False, allow_blank=True)
    hero_banner = HeroBannerField(required=False, allow_null=True)
    landing_page_content = serializers.CharField(required=False, allow_blank=True)
    seo_metadata = serializers.JSONField(required=False, default=dict)
    priority = serializers.IntegerField(default=0)
    is_active = serializers.BooleanField(default=True)
    published_from = serializers.DateTimeField(required=False, allow_null=True)
    published_until = serializers.DateTimeField(required=False, allow_null=True)


class CollectionUpdateSerializer(CollectionCreateSerializer):
    name = serializers.CharField(max_length=200, required=False)
    slug = serializers.SlugField(required=False)


class CollectionDetailSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField()
    slug = serializers.SlugField()
    description = serializers.CharField()
    hero_banner = serializers.SerializerMethodField()
    landing_page_content = serializers.CharField()
    seo_metadata = serializers.JSONField()
    priority = serializers.IntegerField()
    is_active = serializers.BooleanField()
    published_from = serializers.DateTimeField()
    published_until = serializers.DateTimeField()
    products = serializers.SerializerMethodField()

    def get_hero_banner(self, obj):
        if obj.hero_banner:
            try:
                return obj.hero_banner.url
            except ValueError:
                return None
        return None

    def get_products(self, obj):
        if hasattr(obj, "product_links"):
            results = []
            for link in obj.product_links.select_related("product").all():
                p = link.product
                price = "0"
                if hasattr(p, "variants"):
                    first_v = p.variants.filter(deleted_at__isnull=True).first()
                    if first_v:
                        price = str(first_v.price)
                if price == "0" and p.metadata and "price" in p.metadata:
                    price = str(p.metadata["price"])
                
                image_url = ""
                if p.metadata and "image_url" in p.metadata:
                    image_url = p.metadata["image_url"]
                elif p.metadata and "imageUrl" in p.metadata:
                    image_url = p.metadata["imageUrl"]
                else:
                    try:
                        from media_libm.selectors import MediaSelector
                        main_img = MediaSelector.get_main_image_for_product(p)
                        if main_img and main_img.get("url"):
                            image_url = main_img["url"]
                    except Exception:
                        pass

                is_discount_active = bool(p.is_discount_active)
                disc_pct = p.discount_percent if is_discount_active else None
                disc_price = int(p.discount_price) if (is_discount_active and p.discount_price is not None) else None
                if is_discount_active and disc_price is None and disc_pct and price != "0":
                    try:
                        disc_price = int(round(float(price) * (100 - disc_pct) / 100.0))
                    except Exception:
                        pass

                results.append({
                    "id": str(p.id),
                    "title": p.title,
                    "name": p.title,
                    "slug": p.slug,
                    "price": price,
                    "discount_price": disc_price,
                    "discount_percent": disc_pct,
                    "discount_expires_at": p.discount_expires_at.isoformat() if p.discount_expires_at else None,
                    "is_discount_active": is_discount_active,
                    "image_url": image_url,
                    "imageUrl": image_url,
                    "position": link.position,
                })
            return results
        return []


class ProductPositionSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    position = serializers.IntegerField(min_value=0)


class SetProductPositionsSerializer(serializers.Serializer):
    items = ProductPositionSerializer(many=True, allow_empty=False)


# class SetProductPositionsSerializer(serializers.Serializer):
#     items = serializers.ListField(
#         child=serializers.DictField(child=serializers.IntegerField(), allow_empty=False)
#     )


class ProductActionSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    position = serializers.IntegerField(default=0)
