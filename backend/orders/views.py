from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .invoice import InvoiceRenderError, render_invoice_pdf
from .selectors import OrderSelector
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
            shipping_address=serializer.validated_data.get("shipping_address"),
            billing_address=serializer.validated_data.get("billing_address"),
            session_key=session_key,
            address_id=serializer.validated_data.get("address_id"),
            shipping_method=serializer.validated_data.get("shipping_method", "pishtaz"),
        )
        return Response(order, status=status.HTTP_201_CREATED)


class AdminOrderViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    service = OrderService()

    def list(self, request):
        # Admin can list all orders with optional user_id filter for efficient querying
        from .selectors import OrderSelector as OS

        all_orders = OS.get_all_orders()
        user_id = request.query_params.get("user_id")
        if user_id:
            all_orders = all_orders.filter(user_id=user_id)
        serializer = OrderListSerializer(all_orders, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        # pk is order_number
        result = self.service.get_order_by_number(pk)  # no user restriction
        return Response(result)

    @action(detail=True, methods=["get"], url_path="invoice.pdf")
    def invoice_pdf(self, request, pk=None):
        """GET /api/admin/orders/<id-or-number>/invoice.pdf (A5 receipt)."""
        order = OrderSelector.get_order_by_id(pk)
        if not order:
            return Response(
                {"detail": "Order not found.", "code": "order_not_found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            pdf = render_invoice_pdf(order)
        except InvoiceRenderError:
            return Response(
                {
                    "detail": "Invoice PDF rendering is unavailable on this server.",
                    "code": "invoice_render_unavailable",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="{order.order_number}.pdf"'
        )
        response["Cache-Control"] = "private, no-store"
        return response

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
