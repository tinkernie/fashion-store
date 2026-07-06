from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth import get_user_model
from .services import UserService
from .selectors import UserSelector
from .serializers import (
    UserProfileSerializer, UpdateProfileSerializer,
    ChangeEmailSerializer, ConfirmEmailSerializer,
    AdminUserSerializer, AdminUserUpdateSerializer, AssignGroupsSerializer,
)
from .permissions import IsSelf

User = get_user_model()

class UserProfileViewSet(mixins.RetrieveModelMixin,
                         mixins.UpdateModelMixin,
                         viewsets.GenericViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated, IsSelf]

    def get_object(self):
        # Always return the current authenticated user for 'me' actions
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        serializer = UpdateProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = UserService()
        updated_user = service.update_profile(self.get_object(), serializer.validated_data)
        output_serializer = UserProfileSerializer(updated_user)
        return Response(output_serializer.data)

    def update(self, request, *args, **kwargs):
        # Same as partial_update for PUT
        return self.partial_update(request, *args, **kwargs)

    @action(detail=False, methods=['post'], serializer_class=ChangeEmailSerializer)
    def change_email(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = UserService()
        result = service.change_email_request(
            request.user,
            serializer.validated_data['new_email'],
            serializer.validated_data['password']
        )
        return Response(result)

    @action(detail=False, methods=['post'], serializer_class=ConfirmEmailSerializer)
    def confirm_email(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = UserService()
        result = service.confirm_email_change(str(serializer.validated_data['token']))
        return Response(result)


class AdminUserViewSet(viewsets.GenericViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer

    def list(self, request):
        filters = {}
        if 'is_active' in request.query_params:
            filters['is_active'] = request.query_params['is_active'].lower() == 'true'
        if 'search' in request.query_params:
            filters['search'] = request.query_params['search']
        qs = UserSelector.list_users(filters)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        user = UserSelector.get_user_by_id(pk)
        if not user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        user = UserSelector.get_user_by_id(pk)
        if not user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminUserUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        service = UserService()
        updated_user = service.admin_update_user(pk, serializer.validated_data, request.user)
        output_serializer = self.get_serializer(updated_user)
        return Response(output_serializer.data)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        service = UserService()
        result = service.deactivate_user(pk, request.user)
        return Response(result)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        service = UserService()
        result = service.activate_user(pk, request.user)
        return Response(result)

    @action(detail=True, methods=['post'], serializer_class=AssignGroupsSerializer)
    def assign_groups(self, request, pk=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = UserService()
        result = service.assign_groups(pk, serializer.validated_data['group_ids'], request.user)
        return Response(result)