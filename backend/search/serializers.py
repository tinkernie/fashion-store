from rest_framework import serializers


class SearchSerializer(serializers.Serializer):
    q = serializers.CharField(required=False, allow_blank=True)
    search = serializers.CharField(required=False, allow_blank=True, write_only=True)  # Step2: alias for q (frontend uses ?search)
    category = serializers.CharField(required=False)
    collection = serializers.CharField(required=False)
    min_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    max_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    # Options passed as JSON string: e.g., '{"Color":["Red","Blue"],"Size":["M"]}'
    options = serializers.JSONField(required=False)
    sort = serializers.ChoiceField(
        choices=['price_asc', 'price_desc', 'newest', 'name', 'relevance'],
        required=False,
    )
    page = serializers.IntegerField(default=1, min_value=1)
    page_size = serializers.IntegerField(default=20, min_value=1, max_value=20)  # Step2: capped to 20 per M5

    def validate(self, attrs):
        # Step2: map ?search= to q alias
        if not attrs.get("q") and attrs.get("search"):
            attrs["q"] = attrs.pop("search")
        else:
            attrs.pop("search", None)
        return attrs
