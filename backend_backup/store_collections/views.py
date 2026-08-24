from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from .services import CollectionService
from .selectors import CollectionSelector
from .serializers import (
    CollectionCreateSerializer,
    CollectionUpdateSerializer,
    CollectionDetailSerializer,
    SetProductPositionsSerializer,
    ProductActionSerializer,
)


class PublicCollectionViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def list(self, request):
        collections = CollectionSelector.get_visible_collections()
        serializer = CollectionDetailSerializer(
            collections, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def retrieve(self, request, slug=None):
        collection = CollectionSelector.get_collection_by_slug(slug)
        if not collection:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CollectionDetailSerializer(
            collection, context={"request": request}
        )
        return Response(serializer.data)


class AdminCollectionViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]

    def create(self, request):
        serializer = CollectionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = CollectionService()
        result = service.create_collection(serializer.validated_data)
        return Response(result, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        serializer = CollectionUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        service = CollectionService()
        result = service.update_collection(pk, serializer.validated_data)
        return Response(result)

    def destroy(self, request, pk=None):
        service = CollectionService()
        result = service.delete_collection(pk)
        return Response(result)

    @action(
        detail=True, methods=["post"], serializer_class=SetProductPositionsSerializer
    )
    def set_products(self, request, pk=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = CollectionService()
        result = service.set_product_positions(pk, serializer.validated_data["items"])
        return Response(result)

    @action(
        detail=True,
        methods=["post"],
        url_path="add-product",
        serializer_class=ProductActionSerializer,
    )
    def add_product(self, request, pk=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = CollectionService()
        result = service.add_product(
            pk,
            serializer.validated_data["product_id"],
            serializer.validated_data.get("position", 0),
        )
        return Response(result)

    @action(
        detail=True,
        methods=["post"],
        url_path="remove-product",
        serializer_class=ProductActionSerializer,
    )
    def remove_product(self, request, pk=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = CollectionService()
        result = service.remove_product(pk, serializer.validated_data["product_id"])
        return Response(result)
