from rest_framework import serializers


class ProductCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300)
    slug = serializers.SlugField()
    description = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.UUIDField()
    status = serializers.ChoiceField(
        choices=["draft", "published", "archived"], default="draft"
    )
    seo_metadata = serializers.JSONField(required=False, default=dict)
    metadata = serializers.JSONField(required=False, default=dict)


class ProductUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300, required=False)
    slug = serializers.SlugField(required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.UUIDField(required=False)
    status = serializers.ChoiceField(
        choices=["draft", "published", "archived"], required=False
    )
    seo_metadata = serializers.JSONField(required=False)
    metadata = serializers.JSONField(required=False)


class ProductDetailSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    title = serializers.CharField()
    name = serializers.CharField(source="title", read_only=True)
    slug = serializers.SlugField()
    description = serializers.CharField(allow_blank=True, default="")
    category_id = serializers.UUIDField(read_only=True, default=None)
    category_name = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    category_slug = serializers.SerializerMethodField()
    status = serializers.CharField()
    seo_metadata = serializers.JSONField(default=dict)
    metadata = serializers.JSONField(default=dict)
    price = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    imageUrl = serializers.SerializerMethodField()
    collections = serializers.SerializerMethodField()

    def get_category_name(self, obj):
        if hasattr(obj, "category") and obj.category:
            return obj.category.name
        if isinstance(obj, dict):
            return obj.get("category_name")
        return None

    def get_category(self, obj):
        return self.get_category_name(obj)

    def get_category_slug(self, obj):
        if hasattr(obj, "category") and obj.category:
            return obj.category.slug
        if isinstance(obj, dict):
            return obj.get("category_slug")
        return None

    def get_collections(self, obj):
        if hasattr(obj, "collections"):
            return [
                {"id": str(c.id), "slug": c.slug, "name": c.name}
                for c in obj.collections.all()
            ]
        if isinstance(obj, dict):
            return obj.get("collections", [])
        return []

    def get_price(self, obj):
        if isinstance(obj, dict):
            return obj.get("price", 0)
        if hasattr(obj, "variants"):
            first_var = obj.variants.filter(deleted_at__isnull=True).order_by("price").first()
            if first_var:
                return float(first_var.price)
        return 0

    def get_image(self, obj):
        if isinstance(obj, dict):
            return obj.get("image")
        try:
            from media_libm.selectors import MediaSelector
            return MediaSelector.get_main_image_for_product(obj)
        except Exception:
            return None

    def get_imageUrl(self, obj):
        if isinstance(obj, dict):
            return obj.get("imageUrl") or (obj.get("image", {}).get("url") if isinstance(obj.get("image"), dict) else None)
        img = self.get_image(obj)
        if img and isinstance(img, dict) and img.get("url"):
            return img["url"]
        if obj.metadata and isinstance(obj.metadata, dict) and obj.metadata.get("image"):
            return obj.metadata.get("image")
        return "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
