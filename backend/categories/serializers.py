from rest_framework import serializers


class CategoryCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    slug = serializers.SlugField()
    description = serializers.CharField(required=False, allow_blank=True, default="")
    image = serializers.ImageField(required=False, allow_null=True)
    is_active = serializers.BooleanField(default=True)
    parent_id = serializers.UUIDField(required=False, allow_null=True)
    seo_metadata = serializers.JSONField(required=False, default=dict)


class CategoryUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200, required=False)
    slug = serializers.SlugField(required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False, allow_null=True)
    is_active = serializers.BooleanField(required=False)
    parent_id = serializers.UUIDField(required=False, allow_null=True)
    seo_metadata = serializers.JSONField(required=False)


class CategoryAdminDetailSerializer(serializers.Serializer):
    """Detailed serializer including active/inactive status for admin management."""

    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.SlugField()
    description = serializers.CharField(allow_blank=True, default="")
    is_active = serializers.BooleanField()
    parent_id = serializers.UUIDField(allow_null=True)
    image = serializers.SerializerMethodField()
    seo_metadata = serializers.JSONField(required=False, default=dict)
    meta_title = serializers.SerializerMethodField()
    meta_description = serializers.SerializerMethodField()
    canonical_url = serializers.SerializerMethodField()
    hreflang = serializers.SerializerMethodField()

    def get_image(self, obj):
        if hasattr(obj, 'image') and obj.image:
            try:
                if obj.image.name:
                    request = self.context.get("request")
                    if request:
                        return request.build_absolute_uri(obj.image.url)
                    return obj.image.url
            except ValueError:
                # No file associated
                return None
        return None

    def get_meta_title(self, obj):
        meta = getattr(obj, "seo_metadata", {}) or {}
        if meta.get("meta_title"):
            return meta["meta_title"]
        return f"{obj.name} — دسته {obj.name} | Luxe"[:70]

    def get_meta_description(self, obj):
        meta = getattr(obj, "seo_metadata", {}) or {}
        if meta.get("meta_description"):
            return meta["meta_description"][:160]
        desc = (obj.description or "").strip()
        if len(desc) > 160:
            desc = desc[:157] + "..."
        if not desc:
            return f"خرید {obj.name} از فروشگاه لوکس با بهترین قیمت و ارسال سریع."[:160]
        return desc

    def get_canonical_url(self, obj):
        from django.conf import settings
        base = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
        return f"{base}/categories/{obj.slug}"

    def get_hreflang(self, obj):
        from django.conf import settings
        base = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
        return [{"hreflang": "fa-IR", "href": f"{base}/categories/{obj.slug}"}, {"hreflang": "x-default", "href": f"{base}/categories/{obj.slug}"}]


class CategoryTreeSerializer(serializers.Serializer):
    """Hierarchical tree serializer for public catalog navigation."""

    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.SlugField()
    description = serializers.CharField(allow_blank=True, default="")
    image = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    meta_title = serializers.SerializerMethodField()
    meta_description = serializers.SerializerMethodField()
    canonical_url = serializers.SerializerMethodField()
    hreflang = serializers.SerializerMethodField()

    def get_image(self, obj):
        if hasattr(obj, 'image') and obj.image:
            try:
                if obj.image.name:
                    request = self.context.get("request")
                    if request:
                        return request.build_absolute_uri(obj.image.url)
                    return obj.image.url
            except ValueError:
                return None
        return None

    def get_children(self, obj):
        # Retrieve active children recursively
        children = obj.get_children().filter(is_active=True)
        if children.exists():
            return CategoryTreeSerializer(
                children, many=True, context=self.context
            ).data
        return []

    def get_meta_title(self, obj):
        meta = getattr(obj, "seo_metadata", {}) or {}
        if meta.get("meta_title"):
            return meta["meta_title"]
        return f"{obj.name} — دسته {obj.name} | Luxe"[:70]

    def get_meta_description(self, obj):
        meta = getattr(obj, "seo_metadata", {}) or {}
        if meta.get("meta_description"):
            return meta["meta_description"][:160]
        desc = (obj.description or "").strip()
        if len(desc) > 160:
            desc = desc[:157] + "..."
        if not desc:
            return f"خرید {obj.name} از فروشگاه لوکس."[:160]
        return desc

    def get_canonical_url(self, obj):
        from django.conf import settings
        base = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
        return f"{base}/categories/{obj.slug}"

    def get_hreflang(self, obj):
        from django.conf import settings
        base = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
        return [{"hreflang": "fa-IR", "href": f"{base}/categories/{obj.slug}"}, {"hreflang": "x-default", "href": f"{base}/categories/{obj.slug}"}]
