from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import ScopedRateThrottle
from .services import PaymentService
from .serializers import InitiatePaymentSerializer

class PaymentViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payment"
    service = PaymentService()

    @action(detail=False, methods=['post'], serializer_class=InitiatePaymentSerializer)
    def initiate(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = self.service.initiate_payment(
            user=request.user,
            order_id=serializer.validated_data['order_id'],
            gateway=serializer.validated_data.get('gateway', 'dummy'),
        )
        return Response(result, status=status.HTTP_200_OK)


class CallbackViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payment_callback"

    @action(detail=False, methods=['post'], url_path='(?P<gateway>[\w-]+)')
    def callback(self, request, gateway=None):
        # H10: gateway allowlist is enforced in service, but also validate path param length
        if gateway and len(gateway) > 30:
            return Response({"detail": "Invalid gateway"}, status=status.HTTP_400_BAD_REQUEST)
        service = PaymentService()
        result = service.verify_callback(gateway, request.data)
        return Response(result)
