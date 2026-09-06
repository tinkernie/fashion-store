from rest_framework import serializers


class CategoryCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    slug = serializers.SlugField()
    description = serializers.CharField(required=False, allow_blank=True, default="")
    image = serializers.ImageField(required=False, allow_null=True)
    is_active = serializers.BooleanField(default=True)
    parent_id = serializers.UUIDField(required=False, allow_null=True)


class CategoryUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200, required=False)
    slug = serializers.SlugField(required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False, allow_null=True)
    is_active = serializers.BooleanField(required=False)
    parent_id = serializers.UUIDField(required=False, allow_null=True)


class CategoryAdminDetailSerializer(serializers.Serializer):
    """Detailed serializer including active/inactive status for admin management."""

    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.SlugField()
    description = serializers.CharField(allow_blank=True, default="")
    is_active = serializers.BooleanField()
    parent_id = serializers.UUIDField(allow_null=True)
    image = serializers.SerializerMethodField()

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


class CategoryTreeSerializer(serializers.Serializer):
    """Hierarchical tree serializer for public catalog navigation."""

    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.SlugField()
    description = serializers.CharField(allow_blank=True, default="")
    image = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

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
