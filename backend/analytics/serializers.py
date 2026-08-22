from rest_framework import serializers


class TrackEventSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=['page_view', 'product_view'])
    payload = serializers.JSONField(required=False, default=dict)
    session_key = serializers.UUIDField(required=False)


class SalesSummaryQuerySerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()
