from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from .services import InventoryService
from .selectors import InventorySelector
from .serializers import (
    InventorySerializer,
    AdjustStockSerializer,
    SetQuantitySerializer,
    SafetyStockSerializer,
    ReservationExpirationSerializer,
)


class AdminInventoryViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    lookup_field = "variant_id"  # use variant_id as the identifier

    def retrieve(self, request, variant_id=None):
        inventory = InventorySelector.get_by_variant_id(variant_id)
        if not inventory:
            return Response(
                {"detail": "Inventory not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = InventorySerializer(inventory)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["post"],
        serializer_class=AdjustStockSerializer,
        url_path="adjust-stock",
    )
    def adjust_stock(self, request, variant_id=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = InventoryService()
        result = service.adjust_stock(variant_id, serializer.validated_data["delta"])
        return Response(result)

    @action(
        detail=True,
        methods=["post"],
        serializer_class=AdjustStockSerializer,
        url_path="adjust_stock",
    )
    def adjust_stock_underscore(self, request, variant_id=None):
        return self.adjust_stock(request, variant_id=variant_id)

    @action(
        detail=True,
        methods=["post"],
        serializer_class=SetQuantitySerializer,
        url_path="set-quantity",
    )
    def set_quantity(self, request, variant_id=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = InventoryService()
        result = service.set_quantity(variant_id, serializer.validated_data["quantity"])
        return Response(result)

    @action(
        detail=True,
        methods=["post"],
        serializer_class=SetQuantitySerializer,
        url_path="set_quantity",
    )
    def set_quantity_underscore(self, request, variant_id=None):
        return self.set_quantity(request, variant_id=variant_id)

    @action(
        detail=True,
        methods=["post"],
        serializer_class=SafetyStockSerializer,
        url_path="safety-stock",
    )
    def set_safety_stock(self, request, variant_id=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = InventoryService()
        result = service.set_safety_stock(
            variant_id, serializer.validated_data["safety_stock"]
        )
        return Response(result)

    @action(
        detail=True,
        methods=["post"],
        serializer_class=ReservationExpirationSerializer,
        url_path="reservation-expiration",
    )
    def set_expiration(self, request, variant_id=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = InventoryService()
        result = service.set_reservation_expiration(
            variant_id, serializer.validated_data["minutes"]
        )
        return Response(result)
