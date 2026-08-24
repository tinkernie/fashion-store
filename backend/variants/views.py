from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from .services import VariantService
from .selectors import VariantSelector
from .serializers import (
    VariantCreateSerializer,
    VariantUpdateSerializer,
    VariantDetailSerializer,
)
from products.selectors import ProductSelector


class PublicVariantViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    lookup_field = "sku"
    lookup_url_kwarg = "sku"

    def _get_product(self, product_slug):
        product = ProductSelector.get_product_by_slug(product_slug)
        if not product:
            try:
                product = ProductSelector.get_product_by_id(product_slug)
            except Exception:
                product = None
        return product

    def list(self, request, product_slug=None):
        product = self._get_product(product_slug)
        if not product:
            return Response(
                {"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND
            )
        variants = VariantSelector.get_visible_variants_for_product(product.id)
        serializer = VariantDetailSerializer(variants, many=True)
        return Response(serializer.data)

    def retrieve(self, request, product_slug=None, sku=None):
        product = self._get_product(product_slug)
        if not product:
            return Response(
                {"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND
            )
        variant = VariantSelector.get_variant_by_sku(sku)
        if not variant or variant.product_id != product.id:
            return Response(
                {"detail": "Variant not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = VariantDetailSerializer(variant)
        return Response(serializer.data)


class AdminVariantViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]

    # Nested under admin/products/{product_id}/variants/ if needed, or flat.
    # We'll make it flat for admin simplicity: /api/v1/admin/variants/{pk}/

    def create(self, request):
        serializer = VariantCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # product_id is required for creation; must be sent as a field
        product_id = request.data.get("product_id")
        if not product_id:
            return Response(
                {"detail": "product_id required."}, status=status.HTTP_400_BAD_REQUEST
            )
        service = VariantService()
        result = service.create_variant(product_id, serializer.validated_data)
        return Response(result, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        serializer = VariantUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        service = VariantService()
        result = service.update_variant(pk, serializer.validated_data)
        return Response(result)

    def destroy(self, request, pk=None):
        service = VariantService()
        result = service.delete_variant(pk)
        return Response(result)

    def list(self, request):
        # Admin list: filter by product_id if provided
        product_id = request.query_params.get("product_id")
        filters = {}
        if "status" in request.query_params:
            filters["status"] = request.query_params["status"]
        variants = VariantSelector.get_all_variants_admin(product_id, filters)
        serializer = VariantDetailSerializer(variants, many=True)
        page = self.paginate_queryset(variants)
        if page is not None:
            return self.get_paginated_response(
                VariantDetailSerializer(page, many=True).data
            )
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        variant = VariantSelector.get_variant_by_id(pk)
        if not variant:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = VariantDetailSerializer(variant)
        return Response(serializer.data)
