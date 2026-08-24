from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import WishlistService
from .serializers import WishlistAddItemSerializer, WishlistRemoveItemSerializer


class WishlistViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    service = WishlistService()

    def list(self, request):
        result = self.service.get_wishlist(request.user)
        return Response(result)

    @action(detail=False, methods=["post"], serializer_class=WishlistAddItemSerializer)
    def add_item(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = self.service.add_item(
            request.user, serializer.validated_data["product_id"]
        )
        return Response(result, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=["post"],
        url_path="remove-item",
        serializer_class=WishlistRemoveItemSerializer,
    )
    def remove_item(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = self.service.remove_item(
            request.user, serializer.validated_data["product_id"]
        )
        return Response(result)

    @action(detail=False, methods=["post"], url_path="clear")
    def clear(self, request):
        result = self.service.clear_wishlist(request.user)
        return Response(result)
