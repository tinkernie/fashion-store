from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from .services import ProductOptionService, OptionValueService
from .selectors import ProductOptionSelector
from .serializers import (
    ProductOptionSerializer,
    OptionValueSerializer,
    ProductOptionDetailSerializer,
)
from products.selectors import ProductSelector

class PublicProductOptionViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    lookup_field = 'product_slug'   # custom lookup

    def list(self, request, product_slug=None):
        product = ProductSelector.get_product_by_slug(product_slug)
        if not product:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        options = ProductOptionSelector.get_options_for_product(product.id)
        serializer = ProductOptionDetailSerializer(options, many=True)
        return Response(serializer.data)


class AdminProductOptionViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    # URL: /api/v1/admin/products/{product_id}/options/

    def get_product_id(self):
        return self.kwargs.get('product_id')

    def create(self, request, product_id=None):
        serializer = ProductOptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = ProductOptionService()
        result = service.create_option(product_id, serializer.validated_data)
        return Response(result, status=status.HTTP_201_CREATED)

    def partial_update(self, request, product_id=None, pk=None):
        serializer = ProductOptionSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        service = ProductOptionService()
        result = service.update_option(pk, serializer.validated_data)
        return Response(result)

    def destroy(self, request, product_id=None, pk=None):
        service = ProductOptionService()
        result = service.delete_option(pk)
        return Response(result)

    @action(detail=True, methods=['post'], url_path='values')
    def create_value(self, request, product_id=None, pk=None):
        serializer = OptionValueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = OptionValueService()
        result = service.create_value(pk, serializer.validated_data)
        return Response(result, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['put', 'patch'], url_path='values/(?P<value_id>[^/.]+)')
    def update_value(self, request, product_id=None, pk=None, value_id=None):
        serializer = OptionValueSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        service = OptionValueService()
        result = service.update_value(value_id, serializer.validated_data)
        return Response(result)

    @action(detail=True, methods=['delete'], url_path='values/(?P<value_id>[^/.]+)')
    def delete_value(self, request, product_id=None, pk=None, value_id=None):
        service = OptionValueService()
        result = service.delete_value(value_id)
        return Response(result)