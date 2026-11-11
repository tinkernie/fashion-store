import uuid

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from variants.lookup import scanner_payload
from variants.selectors import VariantSelector

from .pos_serializers import PosInvoiceUpdateSerializer, PosSaleCreateSerializer
from .pos_services import PosSaleError, PosService


class PosViewSet(viewsets.GenericViewSet):
    """Counter endpoints. Staff-only, same guard as the rest of /api/admin/."""

    permission_classes = [IsAdminUser]

    @action(detail=False, methods=["get"], url_path=r"scan/(?P<barcode>[^/.]+)")
    def scan(self, request, barcode=None):
        """GET /api/admin/pos/scan/<barcode>/ — one scanner beep."""
        variant = VariantSelector.get_variant_by_barcode(barcode)
        if not variant:
            return Response(
                {"detail": "Barcode not found.", "code": "barcode_not_found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(scanner_payload(variant))

    @action(detail=False, methods=["post"], url_path="sales")
    def create_sale(self, request):
        """POST /api/admin/pos/sales/ — confirm the basket and take stock."""
        serializer = PosSaleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            result = PosService().checkout(
                cashier=request.user,
                items=data["items"],
                client_reference=data.get("client_reference"),
                pos_terminal=data.get("pos_terminal", ""),
                allow_reserved_override=data.get(
                    "allow_reserved_override", False
                ),
            )
        except PosSaleError as exc:
            return Response(exc.payload(), status=exc.status_code)
        return Response(
            result,
            status=(
                status.HTTP_200_OK
                if result.get("replayed")
                else status.HTTP_201_CREATED
            ),
        )

    @action(
        detail=False,
        methods=["patch"],
        url_path=r"sales/(?P<order_id>[^/.]+)",
    )
    def update_invoice(self, request, order_id=None):
        """PATCH /api/admin/pos/sales/<order_id>/ — optional invoice details."""
        try:
            uuid.UUID(str(order_id))
        except (TypeError, ValueError):
            return Response(
                {"detail": "Sale not found.", "code": "sale_not_found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = PosInvoiceUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            result = PosService().update_invoice(
                order_id, **serializer.validated_data
            )
        except PosSaleError as exc:
            return Response(exc.payload(), status=exc.status_code)
        return Response(result)
