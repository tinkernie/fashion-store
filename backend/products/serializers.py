from rest_framework import serializers
from .models import Product

class ProductCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300)
    slug = serializers.SlugField(allow_unicode=True, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.UUIDField(required=False, allow_null=True)
    collection_id = serializers.UUIDField(required=False, allow_null=True)
    price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    discount_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    image_url = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(
        choices=["draft", "published", "archived", "active"], default="published"
    )
    seo_metadata = serializers.JSONField(required=False, default=dict)
    metadata = serializers.JSONField(required=False, default=dict)

    def validate(self, attrs):
        if attrs.get("status") == "active":
            attrs["status"] = "published"
        if not attrs.get("slug"):
            import time
            from django.utils.text import slugify
            base = slugify(attrs.get("title", ""), allow_unicode=True) or "product"
            attrs["slug"] = f"{base}-{int(time.time())}"
        return attrs


class ProductUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300, required=False)
    slug = serializers.SlugField(allow_unicode=True, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.UUIDField(required=False, allow_null=True)
    collection_id = serializers.UUIDField(required=False, allow_null=True)
    price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    discount_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    image_url = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(
        choices=["draft", "published", "archived", "active"], required=False
    )
    seo_metadata = serializers.JSONField(required=False)
    metadata = serializers.JSONField(required=False)

    def validate(self, attrs):
        if attrs.get("status") == "active":
            attrs["status"] = "published"
        return attrs


class ProductDetailSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="title", read_only=True)
    category = serializers.CharField(source="category.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    collections = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    imageUrl = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id", "title", "name", "slug", "description", "category_id", "category_name", "category",
            "price", "imageUrl", "image_url",
            "status", "seo_metadata", "metadata", "collections",
        )

    def get_collections(self, product):
        return [
            {"id": str(c.id), "slug": c.slug, "name": c.name}
            for c in product.collections.all()
        ]

    def get_price(self, product):
        if hasattr(product, "variants"):
            first_variant = product.variants.filter(deleted_at__isnull=True).first()
            if first_variant:
                return str(first_variant.price)
        if product.metadata and "price" in product.metadata:
            return str(product.metadata["price"])
        return "0"

    def get_imageUrl(self, product):
        return self._get_image(product)

    def get_image_url(self, product):
        return self._get_image(product)

    def _get_image(self, product):
        if product.metadata and "image_url" in product.metadata:
            return product.metadata["image_url"]
        if product.metadata and "imageUrl" in product.metadata:
            return product.metadata["imageUrl"]
        try:
            from media_libm.selectors import MediaSelector
            main_img = MediaSelector.get_main_image_for_product(product)
            if main_img and main_img.get("url"):
                return main_img["url"]
        except Exception:
            pass
        return ""

# class ProductDetailSerializer(serializers.Serializer):
#     id = serializers.UUIDField(read_only=True)
#     title = serializers.CharField()
#     slug = serializers.SlugField()
#     description = serializers.CharField()
#     category_id = serializers.UUIDField()
#     category_name = serializers.CharField()
#     status = serializers.CharField()
#     seo_metadata = serializers.JSONField()
#     metadata = serializers.JSONField()
#     collections = serializers.ListField(child=serializers.DictField())
