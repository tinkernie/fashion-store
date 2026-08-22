import uuid
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .services import CartService
from .serializers import (
    CartAddItemSerializer,
    CartRemoveItemSerializer,
    CartUpdateQuantitySerializer,
    CartMergeSerializer,
    ApplyCouponSerializer,
)


class CartViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    service = CartService()

    def _get_session_key(self, request):
        """Ensure a session key exists for guest users."""
        if not request.session.session_key:
            request.session.save()
        cart_key = request.session.get("cart_session_key")
        if not cart_key:
            cart_key = str(uuid.uuid4())
            request.session["cart_session_key"] = cart_key
            request.session.save()
        return cart_key

    def list(self, request):
        user = request.user if request.user.is_authenticated else None
        session_key = self._get_session_key(request) if not user else None
        result = self.service.get_cart(user=user, session_key=session_key)
        return Response(result)

    @action(detail=False, methods=["post"], serializer_class=CartAddItemSerializer)
    def add_item(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        session_key = self._get_session_key(request) if not user else None
        result = self.service.add_item(
            user=user, session_key=session_key, **serializer.validated_data
        )
        return Response(result, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=["post"],
        url_path="remove-item",
        serializer_class=CartRemoveItemSerializer,
    )
    def remove_item(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        session_key = self._get_session_key(request) if not user else None
        result = self.service.remove_item(
            user=user,
            session_key=session_key,
            variant_id=serializer.validated_data["variant_id"],
        )
        return Response(result)

    @action(
        detail=False,
        methods=["post"],
        url_path="update-quantity",
        serializer_class=CartUpdateQuantitySerializer,
    )
    def update_quantity(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        session_key = self._get_session_key(request) if not user else None
        variant_id = request.data.get("variant_id")
        if not variant_id:
            return Response(
                {"detail": "variant_id required."}, status=status.HTTP_400_BAD_REQUEST
            )
        result = self.service.update_quantity(
            user=user,
            session_key=session_key,
            variant_id=variant_id,
            quantity=serializer.validated_data["quantity"],
        )
        return Response(result)

    @action(detail=False, methods=["post"], url_path="clear")
    def clear(self, request):
        user = request.user if request.user.is_authenticated else None
        session_key = self._get_session_key(request) if not user else None
        self.service.clear_cart(user=user, session_key=session_key)
        return Response({"message": "Cart cleared."})

    @action(
        detail=False,
        methods=["post"],
        url_path="merge",
        serializer_class=CartMergeSerializer,
    )
    def merge(self, request):
        """Merge guest cart into user cart (called after login). Must be authenticated."""
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.service.merge_carts(request.user, serializer.validated_data["session_key"])
        return Response({"message": "Cart merged."})

    @action(detail=False, methods=['post'], serializer_class=ApplyCouponSerializer, url_path='apply-coupon')
    def apply_coupon(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        session_key = self._get_session_key(request) if not user else None
        result = self.service.apply_coupon(user, session_key, serializer.validated_data['code'])
        return Response(result)

    @action(detail=False, methods=['post'], url_path='remove-coupon')
    def remove_coupon(self, request):
        user = request.user if request.user.is_authenticated else None
        session_key = self._get_session_key(request) if not user else None
        result = self.service.remove_coupon(user, session_key)
        return Response(result)
