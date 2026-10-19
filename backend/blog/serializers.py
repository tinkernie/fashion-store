from rest_framework import serializers

ALLOWED_LANGS = ("fa", "en", "ar")
TRANSLATION_LANGS = ("en", "ar")


class AdminTagSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=140)
    name_en = serializers.CharField(max_length=120, required=False, allow_blank=True)
    name_ar = serializers.CharField(max_length=120, required=False, allow_blank=True)


class AdminTagUpdateSerializer(AdminTagSerializer):
    name = serializers.CharField(max_length=120, required=False)


class TranslationInputSerializer(serializers.Serializer):
    language = serializers.ChoiceField(choices=TRANSLATION_LANGS)
    title = serializers.CharField(max_length=300, required=False, allow_blank=True)
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=320)
    body_html = serializers.CharField(required=False)
    excerpt = serializers.CharField(max_length=500, required=False, allow_blank=True)
    meta_title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    meta_description = serializers.CharField(max_length=320, required=False, allow_blank=True)


class AdminPostSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300)
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=320)
    body_html = serializers.CharField(required=False, allow_blank=True)
    excerpt = serializers.CharField(max_length=500, required=False, allow_blank=True)
    meta_title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    meta_description = serializers.CharField(max_length=320, required=False, allow_blank=True)
    cover_image = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    tags = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True, max_length=50
    )
    translations = TranslationInputSerializer(many=True, required=False, default=[])


class AdminPostUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300, required=False, allow_blank=False)
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=320)
    body_html = serializers.CharField(required=False, allow_blank=True)
    excerpt = serializers.CharField(max_length=500, required=False, allow_blank=True)
    meta_title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    meta_description = serializers.CharField(max_length=320, required=False, allow_blank=True)
    cover_image = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    tags = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True, max_length=50
    )
    translations = TranslationInputSerializer(many=True, required=False)

    def validate_translations(self, value):
        langs = [t.get("language") for t in (value or []) if isinstance(t, dict)]
        if len(langs) != len(set(langs)):
            raise serializers.ValidationError("duplicate translation language.")
        for t in value or []:
            lang = t.get("language")
            if lang not in TRANSLATION_LANGS:
                raise serializers.ValidationError(
                    "translation.language must be one of: en, ar."
                )
            has_title = bool((t.get("title") or "").strip())
            has_body = t.get("body_html") is not None
            if not (has_title or has_body):
                raise serializers.ValidationError(
                    "translation '{}' needs a title or body.".format(lang)
                )
        return value
