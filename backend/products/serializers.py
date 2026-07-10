from rest_framework import serializers

class ProductCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300)
    slug = serializers.SlugField()
    description = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=['draft', 'published', 'archived'], default='draft')
    seo_metadata = serializers.JSONField(required=False, default=dict)
    metadata = serializers.JSONField(required=False, default=dict)

class ProductUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300, required=False)
    slug = serializers.SlugField(required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.UUIDField(required=False)
    status = serializers.ChoiceField(choices=['draft', 'published', 'archived'], required=False)
    seo_metadata = serializers.JSONField(required=False)
    metadata = serializers.JSONField(required=False)

class ProductDetailSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    title = serializers.CharField()
    slug = serializers.SlugField()
    description = serializers.CharField()
    category_id = serializers.UUIDField()
    category_name = serializers.CharField()
    status = serializers.CharField()
    seo_metadata = serializers.JSONField()
    metadata = serializers.JSONField()
    collections = serializers.ListField(child=serializers.DictField())