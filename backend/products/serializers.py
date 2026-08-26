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
    stock_quantity = serializers.SerializerMethodField()
    inventory_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id", "title", "name", "slug", "description", "category_id", "category_name", "category",
            "price", "imageUrl", "image_url", "stock_quantity", "inventory_count",
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

    def get_stock_quantity(self, product):
        return self._get_total_stock(product)

    def get_inventory_count(self, product):
        return self._get_total_stock(product)

    def _get_total_stock(self, product):
        total = 0
        for variant in product.variants.filter(deleted_at__isnull=True):
            if hasattr(variant, "inventory") and variant.inventory:
                total += variant.inventory.available_quantity
        return total

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


from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    product_id = serializers.UUIDField(source="product.id", read_only=True)
    product_title = serializers.CharField(source="product.title", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = (
            "id",
            "product_id",
            "product_title",
            "product_slug",
            "product_image",
            "user_name",
            "rating",
            "text",
            "status",
            "created_at",
            "updated_at",
        )

    def get_product_image(self, review):
        product = review.product
        if product.metadata and "image_url" in product.metadata:
            return product.metadata["image_url"]
        if product.metadata and "imageUrl" in product.metadata:
            return product.metadata["imageUrl"]
        return ""


class ReviewCreateSerializer(serializers.Serializer):
    user_name = serializers.CharField(max_length=150, required=False, default="کاربر خریدار")
    rating = serializers.IntegerField(min_value=1, max_value=5, default=5)
    text = serializers.CharField(min_length=3)


class AdminReviewUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["pending", "approved", "rejected"], required=False)
    user_name = serializers.CharField(max_length=150, required=False)
    text = serializers.CharField(required=False)
    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)

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
