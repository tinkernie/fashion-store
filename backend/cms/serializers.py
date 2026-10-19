from rest_framework import serializers

ALLOWED_BLOCK_TYPES = ("hero", "text", "product_grid", "team", "faq", "banner", "gallery")

ALLOWED_SITE_KEYS = ("homepage", "hero", "header", "footer", "announcement", "discount_section", "homepage_blog_section")


def validate_page_blocks(content):
    if not isinstance(content, list):
        raise serializers.ValidationError("Page content must be a list of blocks.")
    for idx, block in enumerate(content):
        if not isinstance(block, dict):
            raise serializers.ValidationError(f"Block #{idx} must be an object with type + props.")
        btype = block.get("type")
        if btype not in ALLOWED_BLOCK_TYPES:
            raise serializers.ValidationError(
                f"Block #{idx}: unknown type '{btype}'. Allowed: {', '.join(ALLOWED_BLOCK_TYPES)}."
            )
        props = block.get("props", block.get("value", block.get("content")))
        if props is None:
            raise serializers.ValidationError(f"Block #{idx} ({btype}) needs props/value.")
    return content


def validate_site_content_by_key(key, content):
    if not isinstance(content, dict):
        raise serializers.ValidationError("SiteContent content must be an object.")
    if key == "announcement":
        if "text" not in content or not str(content.get("text", "")).strip():
            raise serializers.ValidationError("announcement.content.text is required.")
        if "enabled" in content and not isinstance(content["enabled"], bool):
            raise serializers.ValidationError("announcement.content.enabled must be boolean.")
    elif key == "discount_section":
        if "enabled" in content and not isinstance(content["enabled"], bool):
            raise serializers.ValidationError("discount_section.content.enabled must be boolean.")
        for f in ("title", "cta_text", "cta_link"):
            if f in content and content[f] is not None and not isinstance(content[f], str):
                raise serializers.ValidationError(f"discount_section.content.{f} must be string.")
        if "collection_slug" in content and content["collection_slug"] is not None and not isinstance(
            content["collection_slug"], str
        ):
            raise serializers.ValidationError("discount_section.content.collection_slug must be string.")
    elif key == "homepage_blog_section":
        if "enabled" in content and not isinstance(content["enabled"], bool):
            raise serializers.ValidationError("homepage_blog_section.content.enabled must be boolean.")
        titles = content.get("titles")
        if titles is not None:
            if not isinstance(titles, dict):
                raise serializers.ValidationError("homepage_blog_section.content.titles must be an object (fa/en/ar).")
            for code, val in titles.items():
                if code not in ("fa", "en", "ar"):
                    raise serializers.ValidationError(
                        "homepage_blog_section.content.titles supports keys fa/en/ar, got '{}'.".format(code)
                    )
                if not isinstance(val, str):
                    raise serializers.ValidationError("homepage_blog_section.content.titles.{} must be string.".format(code))
        if "max_items" in content and content["max_items"] is not None:
            if not isinstance(content["max_items"], int) or not (1 <= content["max_items"] <= 12):
                raise serializers.ValidationError("homepage_blog_section.content.max_items must be int in 1..12.")
    elif key in ("homepage", "hero"):
        slides = content.get("slides")
        if slides is not None:
            if not isinstance(slides, list):
                raise serializers.ValidationError("slides must be a list.")
            for i, s in enumerate(slides):
                if not isinstance(s, dict) or not (s.get("image") or s.get("image_url")):
                    raise serializers.ValidationError(f"slide #{i} needs image or image_url.")
    return content


class PageSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300)
    slug = serializers.SlugField()
    content = serializers.JSONField(default=list)
    status = serializers.ChoiceField(choices=['draft', 'published'], default='draft')
    seo_metadata = serializers.JSONField(default=dict, required=False)

    def validate_content(self, value):
        return validate_page_blocks(value)


class PageUpdateSerializer(PageSerializer):
    title = serializers.CharField(max_length=300, required=False)
    slug = serializers.SlugField(required=False)
    content = serializers.JSONField(required=False)

    def validate_content(self, value):
        return validate_page_blocks(value)


class SiteContentSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=100)
    content = serializers.JSONField()

    def validate_key(self, value):
        if value not in ALLOWED_SITE_KEYS:
            raise serializers.ValidationError(
                f"Unknown key '{value}'. Allowed: {', '.join(ALLOWED_SITE_KEYS)}."
            )
        return value

    def validate(self, attrs):
        key = attrs.get("key") or getattr(self.instance, "key", None)
        content = attrs.get("content")
        if key and content is not None:
            validate_site_content_by_key(key, content)
        return attrs
