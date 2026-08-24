from rest_framework import serializers


class CategoryCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    slug = serializers.SlugField()
    description = serializers.CharField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False)
    is_active = serializers.BooleanField(default=True)
    parent_id = serializers.UUIDField(required=False, allow_null=True)


class CategoryUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200, required=False)
    slug = serializers.SlugField(required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False)
    is_active = serializers.BooleanField(required=False)
    parent_id = serializers.UUIDField(required=False, allow_null=True)


class CategoryTreeSerializer(serializers.Serializer):
    """Output for nested tree representation."""

    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.SlugField()
    description = serializers.CharField()
    image = serializers.ImageField(source="image.url", allow_null=True)
    children = serializers.SerializerMethodField()

    def get_children(self, obj):
        # Recursively serialize active children
        children = obj.get_children().filter(is_active=True)
        if children.exists():
            return CategoryTreeSerializer(
                children, many=True, context=self.context
            ).data
        return []
