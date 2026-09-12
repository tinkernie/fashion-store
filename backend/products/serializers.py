from rest_framework import serializers
from .models import Product

class ProductCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300)
    slug = serializers.SlugField(allow_unicode=True, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.UUIDField(required=False, allow_null=True)
    collection_id = serializers.UUIDField(required=False, allow_null=True)
    price = serializers.IntegerField(min_value=0, required=False)
    discount_price = serializers.IntegerField(min_value=0, required=False, allow_null=True)
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
    price = serializers.IntegerField(min_value=0, required=False)
    discount_price = serializers.IntegerField(min_value=0, required=False, allow_null=True)
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
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    collections = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    imageUrl = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    stock_quantity = serializers.SerializerMethodField()
    inventory_count = serializers.SerializerMethodField()
    variants = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    discount_price = serializers.SerializerMethodField()
    discount_expires_at = serializers.DateTimeField(read_only=True)
    is_discount_active = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id", "title", "name", "slug", "description", "category_id", "category_name", "category_slug", "category",
            "price", "imageUrl", "image_url", "stock_quantity", "inventory_count",
            "status", "seo_metadata", "metadata", "collections", "variants",
            "average_rating", "reviews_count",
            "discount_percent", "discount_price", "discount_expires_at", "is_discount_active",
        )

    def get_variants(self, product):
        if hasattr(product, "variants"):
            from variants.serializers import VariantDetailSerializer
            return VariantDetailSerializer(
                product.variants.filter(deleted_at__isnull=True),
                many=True
            ).data
        return []


    def get_collections(self, product):
        return [
            {"id": str(c.id), "slug": c.slug, "name": c.name}
            for c in product.collections.all()
        ]

    def get_price(self, product):
        if hasattr(product, "variants"):
            first_variant = product.variants.filter(deleted_at__isnull=True).first()
            if first_variant and first_variant.price is not None:
                try:
                    return int(round(float(first_variant.price)))
                except (ValueError, TypeError):
                    return 0
        if product.metadata and "price" in product.metadata:
            try:
                return int(round(float(product.metadata["price"])))
            except (ValueError, TypeError):
                pass
        return 0

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

    def get_average_rating(self, product):
        # Use annotated value if present to avoid N+1
        if hasattr(product, "annotated_avg_rating"):
            avg = product.annotated_avg_rating
            if avg is None:
                return None
            try:
                return round(float(avg), 1)
            except Exception:
                return None
        # Fallback: query directly (for products not fetched via selector)
        from django.db.models import Avg, Q
        from .models import Review
        agg = Review.objects.filter(
            product=product, status="approved", deleted_at__isnull=True
        ).aggregate(avg=Avg("rating"))
        avg = agg["avg"]
        if avg is None:
            return None
        return round(float(avg), 1)

    def get_reviews_count(self, product):
        if hasattr(product, "annotated_reviews_count"):
            try:
                return int(product.annotated_reviews_count or 0)
            except Exception:
                return 0
        from .models import Review
        return Review.objects.filter(
            product=product, status="approved", deleted_at__isnull=True
        ).count()


from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    product_id = serializers.UUIDField(source="product.id", read_only=True)
    product_title = serializers.CharField(source="product.title", read_only=True)
    product_slug = serializers.SlugField(source="product.slug", read_only=True)
    product_image = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()

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

    def get_user_name(self, review):
        if review.user:
            name = f"{review.user.first_name} {review.user.last_name}".strip()
            if name:
                return name
            if review.user.email:
                return review.user.email
        if review.user_name and review.user_name.strip() and review.user_name.strip() != "کاربر خریدار":
            return review.user_name.strip()
        return "کاربر خریدار"

    def get_product_image(self, review):
        product = review.product
        if product.metadata and "image_url" in product.metadata:
            return product.metadata["image_url"]
        if product.metadata and "imageUrl" in product.metadata:
            return product.metadata["imageUrl"]
        return ""


class ReviewCreateSerializer(serializers.Serializer):
    user_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default=None)
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
