from rest_framework import serializers


class PageSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300)
    slug = serializers.SlugField()
    content = serializers.JSONField(default=list)
    status = serializers.ChoiceField(choices=['draft', 'published'], default='draft')
    seo_metadata = serializers.JSONField(default=dict, required=False)


class PageUpdateSerializer(PageSerializer):
    title = serializers.CharField(max_length=300, required=False)
    slug = serializers.SlugField(required=False)


class SiteContentSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=100)
    content = serializers.JSONField()
