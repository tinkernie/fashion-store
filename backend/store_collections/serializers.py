from rest_framework import serializers


class CollectionCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    slug = serializers.SlugField()
    description = serializers.CharField(required=False, allow_blank=True)
    hero_banner = serializers.ImageField(required=False)
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
    hero_banner = serializers.ImageField(source="hero_banner.url", allow_null=True)
    landing_page_content = serializers.CharField()
    seo_metadata = serializers.JSONField()
    priority = serializers.IntegerField()
    is_active = serializers.BooleanField()
    published_from = serializers.DateTimeField()
    published_until = serializers.DateTimeField()
    products = serializers.SerializerMethodField()

    def get_products(self, obj):
        # For now return a list of product IDs; will be enriched when Product API exists
        if hasattr(obj, "product_links"):
            return [
                {"id": str(link.product_id), "position": link.position}
                for link in obj.product_links.all()
            ]
        return []


class SetProductPositionsSerializer(serializers.Serializer):
    items = serializers.ListField(
        child=serializers.DictField(child=serializers.IntegerField(), allow_empty=False)
    )


class ProductActionSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    position = serializers.IntegerField(default=0)
