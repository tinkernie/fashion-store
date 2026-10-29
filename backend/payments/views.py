from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from django.conf import settings
from django.http import HttpResponseRedirect
from urllib.parse import urlencode
from common.exceptions import BusinessException
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
            request=request,
        )
        return Response(result, status=status.HTTP_200_OK)


class CallbackViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payment_callback"

    @action(detail=False, methods=['post'], url_path=r'(?P<gateway>[\w-]+)')
    def callback(self, request, gateway=None):
        # H10: gateway allowlist is enforced in service, but also validate path param length
        if gateway and len(gateway) > 30:
            return Response({"detail": "Invalid gateway"}, status=status.HTTP_400_BAD_REQUEST)
        service = PaymentService()
        result = service.verify_callback(gateway, request.data)
        return Response(result)


class PaymentCallbackResultView(APIView):
    """GET landing for redirect-style gateways (Zarinpal StartPay return).

    Verifies server-side, then 302-redirects the browser to the frontend
    result route with the outcome in the query string. Errors never enumerate:
    they collapse to status=error in the redirect."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payment_callback"

    def _redirect_url(self, **params):
        base = settings.FRONTEND_URL.rstrip('/') + getattr(settings, 'ZARINPAL_RETURN_PATH', '/payment-result')
        clean = {k: str(v) for k, v in params.items() if v}
        return f"{base}?{urlencode(clean)}" if clean else base

    def get(self, request, gateway=None):
        if not gateway or len(gateway) > 30:
            return HttpResponseRedirect(self._redirect_url(status='invalid_gateway'))
        try:
            data = dict(request.query_params.items())
            result = PaymentService().verify_callback(gateway, data)
        except BusinessException:
            return HttpResponseRedirect(self._redirect_url(status='error'))
        payment = result.get('payment') or {}
        return HttpResponseRedirect(self._redirect_url(
            order=payment.get('order_number'),
            payment=payment.get('id'),
            status=payment.get('status'),
            ref=payment.get('gateway_reference'),
        ))
