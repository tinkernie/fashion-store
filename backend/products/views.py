from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from .services import ProductService
from .selectors import ProductSelector
from .serializers import (
    ProductCreateSerializer,
    ProductUpdateSerializer,
    ProductDetailSerializer,
)


class PublicProductViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def list(self, request):
        filters = {}
        if "category" in request.query_params:
            filters["category_slug"] = request.query_params["category"]
        if "collection" in request.query_params:
            filters["collection_slug"] = request.query_params["collection"]
        if "search" in request.query_params:
            filters["search"] = request.query_params["search"]
        products = ProductSelector.get_visible_products(filters)
        # manual pagination? We'll use DRF's default pagination via core.pagination.StandardPagination.
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductDetailSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)
        serializer = ProductDetailSerializer(
            products, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def retrieve(self, request, slug=None):
        product = ProductSelector.get_product_by_slug(slug)
        if not product:
            try:
                product = ProductSelector.get_product_by_id(slug)
            except Exception:
                product = None
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductDetailSerializer(product, context={"request": request})
        return Response(serializer.data)


class AdminProductViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]

    def create(self, request):
        serializer = ProductCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = ProductService()
        result = service.create_product(serializer.validated_data)
        return Response(result, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        serializer = ProductUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        service = ProductService()
        result = service.update_product(pk, serializer.validated_data)
        return Response(result)

    def destroy(self, request, pk=None):
        # Two options: soft delete (set deleted_at) or archive (set status). We'll use soft delete.
        service = ProductService()
        result = service.delete_product(pk)
        return Response(result)

    @action(detail=True, methods=["post"], url_path="archive")
    def archive(self, request, pk=None):
        service = ProductService()
        result = service.archive_product(pk)
        return Response(result)

    @action(detail=False, methods=["get"], url_path="admin-list")
    def admin_list(self, request):
        filters = {}
        if "status" in request.query_params:
            filters["status"] = request.query_params["status"]
        if "search" in request.query_params:
            filters["search"] = request.query_params["search"]
        products = ProductSelector.get_all_products_admin(filters)
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductDetailSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)
        serializer = ProductDetailSerializer(
            products, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        product = ProductSelector.get_product_by_id(pk)
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductDetailSerializer(product, context={"request": request})
        return Response(serializer.data)
