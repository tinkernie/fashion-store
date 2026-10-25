import os
import uuid
from urllib.parse import urlparse

from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone
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
            links = obj.product_links.select_related(
                "product", "product__category"
            ).prefetch_related(
                "product__variants", "product__variants__inventory"
            ).order_by("position", "id")
            for link in links:
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

                category_data = None
                if getattr(p, "category", None):
                    category_data = {
                        "id": str(p.category.id),
                        "name": p.category.name,
                        "slug": p.category.slug,
                    }

                try:
                    is_discount_active = bool(p.is_discount_active)
                except Exception:
                    is_discount_active = False
                disc_pct = p.discount_percent if is_discount_active else None
                disc_price = None
                if is_discount_active and p.discount_price is not None:
                    try:
                        disc_price = int(p.discount_price)
                    except Exception:
                        disc_price = None
                if is_discount_active and disc_price is None and disc_pct and price != "0":
                    try:
                        disc_price = int(round(float(price) * (100 - disc_pct) / 100.0))
                    except Exception:
                        pass

                stock_quantity = 0
                try:
                    for v in p.variants.all():
                        if getattr(v, "is_placeholder", False):
                            continue
                        inv = getattr(v, "inventory", None)
                        if inv is not None and inv.available_quantity:
                            stock_quantity += int(inv.available_quantity)
                except Exception:
                    pass

                created_at = None
                try:
                    if getattr(p, "created_at", None):
                        created_at = p.created_at.isoformat()
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
                    "discount_expires_at": (
                        p.discount_expires_at.isoformat()
                        if getattr(p, "discount_expires_at", None) else None
                    ),
                    "is_discount_active": is_discount_active,
                    "category": category_data,
                    "is_in_stock": stock_quantity > 0,
                    "stock_quantity": stock_quantity,
                    "created_at": created_at,
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


class BatchAddProductsSerializer(serializers.Serializer):
    """Batch add-products modal payload: links products to the collection and
    optionally applies ONE promotional percentage to all of them. The expiry
    date is always owner-entered (never auto-derived) and mandatory whenever a
    percentage is applied."""

    product_ids = serializers.ListField(
        child=serializers.UUIDField(), allow_empty=False
    )
    discount_percent = serializers.IntegerField(min_value=0, max_value=99)
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    position = serializers.IntegerField(default=0, min_value=0)

    def validate(self, attrs):
        percent = attrs.get("discount_percent") or 0
        expires_at = attrs.get("expires_at")
        if percent > 0 and not expires_at:
            raise serializers.ValidationError(
                "A discount expiry date is required when a percentage is applied."
            )
        if expires_at and expires_at <= timezone.now():
            raise serializers.ValidationError(
                "The discount expiry date must be in the future."
            )
        return attrs
