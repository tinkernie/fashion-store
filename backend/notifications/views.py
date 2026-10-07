from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .services import NotificationService
from .selectors import NotificationSelector
from .serializers import MarkReadSerializer, PreferenceSerializer


class UserNotificationViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    service = NotificationService()

    def list(self, request):
        unread_only = request.query_params.get('unread', 'false').lower() == 'true'
        data = self.service.get_notifications(request.user, unread_only=unread_only)
        return Response(data)

    @action(detail=False, methods=['post'], serializer_class=MarkReadSerializer, url_path='mark-read')
    def mark_read(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.service.mark_as_read(request.user, serializer.validated_data['notification_id'])
        return Response({'message': 'Marked as read'})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        self.service.mark_all_as_read(request.user)
        return Response({'message': 'All notifications marked as read'})

    # Preferences
    @action(detail=False, methods=['get', 'patch'], url_path='preferences',
            serializer_class=PreferenceSerializer)
    def preferences(self, request):
        if request.method == 'GET':
            data = self.service.get_preferences(request.user)
            return Response(data)
        elif request.method == 'PATCH':
            serializer = self.get_serializer(data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            data = self.service.update_preferences(request.user, serializer.validated_data)
            return Response(data)


class AdminNotificationViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    pagination_class = None  # will use manual pagination via paginator

    # Admin can view all notifications (maybe filter by user) - M2: paginated, filtered
    def list(self, request):
        from .models import Notification
        from core.pagination import StandardPagination
        qs = Notification.objects.all().order_by('-created_at')
        # M2: allow filtering by user_id to avoid leaking all PII, require explicit filter
        user_id = request.query_params.get('user_id')
        if user_id:
            qs = qs.filter(user_id=user_id)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        if page is not None:
            data = [{
                'id': str(n.id),
                'user_phone': n.user.phone_number if n.user else "کاربر عمومی",
                'type': n.type,
                'subject': n.subject,
                'is_read': n.is_read,
                'created_at': n.created_at.isoformat(),
            } for n in page]
            return paginator.get_paginated_response(data)
        # Fallback if pagination disabled
        data = [{
            'id': str(n.id),
            'user_phone': n.user.phone_number if n.user else "کاربر عمومی",
            'type': n.type,
            'subject': n.subject,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat(),
        } for n in qs[:100]]
        return Response(data)
