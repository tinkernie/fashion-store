from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.throttling import ScopedRateThrottle
from django.contrib.auth import get_user_model
from .services import UserService
from .selectors import UserSelector
from .serializers import (
    UserProfileSerializer,
    UpdateProfileSerializer,
    ChangePhoneSerializer,
    ConfirmPhoneSerializer,
    AdminUserSerializer,
    AdminUserUpdateSerializer,
    AssignGroupsSerializer,
)
from .permissions import IsSelf

User = get_user_model()


class UserProfileViewSet(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated, IsSelf]

    def get_object(self):
        return self.request.user

    def get_throttles(self):
        if self.action in ["change_phone", "confirm_phone"]:
            self.throttle_scope = "auth"
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def list(self, request):
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        serializer = UpdateProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = UserService()
        updated_user = service.update_profile(
            self.get_object(), serializer.validated_data
        )
        output_serializer = UserProfileSerializer(updated_user)
        return Response(output_serializer.data)

    def update(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    @action(detail=False, methods=["post"], serializer_class=ChangePhoneSerializer)
    def change_phone(self, request):
        serializer = ChangePhoneSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = UserService()
        result = service.change_phone_request(
            request.user, serializer.validated_data["new_phone"]
        )
        return Response(result)

    @action(detail=False, methods=["post"], serializer_class=ConfirmPhoneSerializer)
    def confirm_phone(self, request):
        serializer = ConfirmPhoneSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = UserService()
        result = service.confirm_phone_change(
            request.user,
            serializer.validated_data["new_phone"],
            serializer.validated_data["code"],
        )
        return Response(result)


class AdminUserViewSet(viewsets.GenericViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer

    def list(self, request):
        filters = {}
        if "is_active" in request.query_params:
            filters["is_active"] = request.query_params["is_active"].lower() == "true"
        if "search" in request.query_params:
            filters["search"] = request.query_params["search"]
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
        updated_user = service.admin_update_user(
            pk, serializer.validated_data, request.user
        )
        output_serializer = self.get_serializer(updated_user)
        return Response(output_serializer.data)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        service = UserService()
        result = service.deactivate_user(pk, request.user)
        return Response(result)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        service = UserService()
        result = service.activate_user(pk, request.user)
        return Response(result)

    @action(detail=True, methods=["post"], serializer_class=AssignGroupsSerializer)
    def assign_groups(self, request, pk=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = UserService()
        result = service.assign_groups(
            pk, serializer.validated_data["group_ids"], request.user
        )
        return Response(result)

    @action(detail=True, methods=["get"])
    def orders(self, request, pk=None):
        """Dedicated admin user orders endpoint: GET /api/admin/users/<id>/orders/"""
        user = UserSelector.get_user_by_id(pk)
        if not user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        from orders.models import Order
        from orders.services import OrderService

        orders = (
            Order.objects.filter(user=user)
            .order_by("-placed_at")
            .prefetch_related("items", "status_history")
        )
        data = [OrderService()._serialize_order(order) for order in orders]
        return Response(data)
