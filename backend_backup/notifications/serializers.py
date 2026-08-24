from rest_framework import serializers


class NotificationListSerializer(serializers.Serializer):
    unread_count = serializers.IntegerField()
    notifications = serializers.ListField(child=serializers.DictField())


class MarkReadSerializer(serializers.Serializer):
    notification_id = serializers.UUIDField()


class PreferenceSerializer(serializers.Serializer):
    email_order_updates = serializers.BooleanField(required=False)
    email_promotions = serializers.BooleanField(required=False)
    email_account = serializers.BooleanField(required=False)
    in_app_order_updates = serializers.BooleanField(required=False)
    in_app_account = serializers.BooleanField(required=False)
