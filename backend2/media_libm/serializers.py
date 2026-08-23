from rest_framework import serializers
from .models import Media


class MediaUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    media_type = serializers.ChoiceField(choices=['image', 'video', 'thumbnail', '360'], default='image')
    alt_text = serializers.CharField(required=False, allow_blank=True, max_length=500)
    caption = serializers.CharField(required=False, allow_blank=True)
    position = serializers.IntegerField(default=0, min_value=0)


class MediaUpdateSerializer(serializers.Serializer):
    alt_text = serializers.CharField(required=False, allow_blank=True, max_length=500)
    caption = serializers.CharField(required=False, allow_blank=True)
    position = serializers.IntegerField(required=False, min_value=0)


class ReorderSerializer(serializers.Serializer):
    ordered_ids = serializers.ListField(child=serializers.UUIDField())
