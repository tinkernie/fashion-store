from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .services import OrderService
from .serializers import (
    CreateOrderSerializer,
    StatusTransitionSerializer,
    OrderListSerializer,
)


class UserOrderViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    service = OrderService()

    def list(self, request):
        orders = self.service.get_user_orders(request.user)
        return Response(orders)

    def retrieve(self, request, pk=None):
        # pk is order_number
        result = self.service.get_order_by_number(pk, user=request.user)
        return Response(result)

    @action(detail=False, methods=["post"], serializer_class=CreateOrderSerializer)
    def checkout(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session_key = (
            serializer.validated_data.get("session_key")
            or request.headers.get("X-Cart-Session-Key")
            or request.query_params.get("session_key")
            or request.session.get("cart_session_key")
        )
        order = self.service.create_order_from_cart(
            user=request.user,
            shipping_address=serializer.validated_data["shipping_address"],
            billing_address=serializer.validated_data.get("billing_address"),
            session_key=session_key,
        )
        return Response(order, status=status.HTTP_201_CREATED)


class AdminOrderViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    service = OrderService()

    def list(self, request):
        # Admin can list all orders (not just own). Add filtering later.
        from orders.selectors import OrderSelector

        orders = OrderSelector.get_user_orders(user=None)  # need a method that gets all
        # We'll implement an admin selector method.
        from .selectors import OrderSelector as OS

        all_orders = OS.get_all_orders()
        serializer = OrderListSerializer(all_orders, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        # pk is order_number
        result = self.service.get_order_by_number(pk)  # no user restriction
        return Response(result)

    @action(detail=True, methods=["post"], serializer_class=StatusTransitionSerializer)
    def transition(self, request, pk=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = self.service.transition_status(
            order_id=pk,  # pk is order ID (UUID) – we'll adjust URLs to use UUID for admin transitions
            new_status=serializer.validated_data["status"],
            note=serializer.validated_data.get("note", ""),
            actor=request.user,
        )
        return Response(order)
