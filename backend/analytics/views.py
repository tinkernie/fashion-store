import uuid
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from .services import AnalyticsService
from .serializers import TrackEventSerializer, SalesSummaryQuerySerializer


class PublicTrackingViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'], serializer_class=TrackEventSerializer)
    def track(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        # Use session_key from request or generate
        session_key = serializer.validated_data.get('session_key')
        if not session_key:
            if not request.session.session_key:
                request.session.save()
            session_key = request.session.get('cart_session_key')  # reuse cart session key? We'll generate if not.
            if not session_key:
                session_key = uuid.uuid4()
                request.session['tracking_session_key'] = session_key
                request.session.save()
        service = AnalyticsService()
        result = service.record_event(
            user=user,
            session_key=session_key,
            type=serializer.validated_data['type'],
            payload=serializer.validated_data.get('payload'),
        )
        return Response(result, status=status.HTTP_201_CREATED)


class AdminAnalyticsViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    service = AnalyticsService()

    @action(detail=False, methods=['get'], serializer_class=SalesSummaryQuerySerializer)
    def sales(self, request):
        serializer = self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        result = self.service.get_sales_summary(
            serializer.validated_data['start_date'],
            serializer.validated_data['end_date'],
        )
        return Response(result)

    @action(detail=False, methods=['get'])
    def popular_products(self, request):
        limit = int(request.query_params.get('limit', 10))
        result = self.service.get_popular_products(limit)
        return Response(result)

    @action(detail=False, methods=['get'])
    def cart_abandonment(self, request):
        result = self.service.get_cart_abandonment()
        return Response(result)

    @action(detail=False, methods=['get'])
    def events(self, request):
        type_filter = request.query_params.get('type')
        user_id = request.query_params.get('user_id')
        limit = int(request.query_params.get('limit', 100))
        result = self.service.get_recent_events(type=type_filter, user_id=user_id, limit=limit)
        return Response(result)
