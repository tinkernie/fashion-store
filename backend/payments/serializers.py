from rest_framework import serializers

class InitiatePaymentSerializer(serializers.Serializer):
    order_id = serializers.CharField()
    gateway = serializers.CharField(default='dummy')

class CallbackSerializer(serializers.Serializer):
    gateway = serializers.CharField()   # part of URL? We'll pass via header or URL.
    # The request data is raw JSON; we'll pass it directly.