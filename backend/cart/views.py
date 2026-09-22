import uuid
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .services import CartService
from .serializers import (
    CartAddItemSerializer,
    CartUpdateQuantitySerializer,
    CartMergeSerializer,
    ApplyCouponSerializer,
)


class CartViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    service = CartService()

    def _get_session_key(self, request):
        """Ensure a session key exists for guest users."""
        client_key = (
            request.headers.get("X-Cart-Session-Key")
            or request.query_params.get("session_key")
            or (request.data.get("session_key") if hasattr(request, "data") and isinstance(request.data, dict) else None)
        )
        if client_key:
            return str(client_key)

        if not request.session.session_key:
            request.session.save()
        cart_key = request.session.get("cart_session_key")
        if not cart_key:
            cart_key = str(uuid.uuid4())
            request.session["cart_session_key"] = cart_key
            request.session.modified = True
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
        serializer_class=CartAddItemSerializer,
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

    @action(detail=False, methods=["get"], url_path="related")
    def related(self, request):
        """GET /api/cart/related/?limit=8 - cross-sell based on cart items"""
        user = request.user if request.user.is_authenticated else None
        session_key = self._get_session_key(request) if not user else None
        from cart.models import Cart
        from products.models import Product
        from products.selectors import ProductSelector
        from products.serializers import RelatedProductCardSerializer

        # Get cart
        try:
            cart = None
            if user and user.is_authenticated:
                cart = Cart.objects.filter(user=user).first()
            elif session_key:
                cart = Cart.objects.filter(session_key=session_key).first()
            if not cart or not cart.items.exists():
                return Response([])

            # Collect product ids from cart
            cart_product_ids = set()
            cart_products = []
            for item in cart.items.select_related("variant__product"):
                prod = item.variant.product if item.variant else None
                if prod and prod.id not in cart_product_ids:
                    cart_product_ids.add(prod.id)
                    cart_products.append(prod)
                # Also try to get product directly if variant missing
                if not prod and item.variant and item.variant.product_id:
                    try:
                        p = Product.objects.filter(id=item.variant.product_id).first()
                        if p and p.id not in cart_product_ids:
                            cart_product_ids.add(p.id)
                            cart_products.append(p)
                    except Exception:
                        pass

            if not cart_products:
                return Response([])

            try:
                limit = int(request.query_params.get("limit", 8))
            except ValueError:
                limit = 8
            limit = min(max(limit, 1), 12)

            # Use selector union logic, exclude cart products
            related = ProductSelector.get_related_for_cart(
                cart_products, limit=limit, exclude_ids=cart_product_ids
            )
            serializer = RelatedProductCardSerializer(related, many=True, context={"request": request})
            return Response(serializer.data)
        except Exception as e:
            # Return empty on error to avoid breaking cart flow
            return Response([])
