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

    def list(self, request):
        return self.admin_list(request)

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


from .models import Review
from .serializers import (
    ReviewSerializer,
    ReviewCreateSerializer,
    AdminReviewUpdateSerializer,
)


class PublicReviewViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]

    def _get_product(self, product_slug):
        prod = ProductSelector.get_product_by_slug(product_slug)
        if not prod:
            try:
                prod = ProductSelector.get_product_by_id(product_slug)
            except Exception:
                prod = None
        return prod

    def list(self, request, product_slug=None):
        product = self._get_product(product_slug)
        if not product:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        reviews = Review.objects.filter(
            product=product,
            status=Review.Status.APPROVED,
            deleted_at__isnull=True,
        ).select_related("product", "user").order_by("-created_at")
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def create(self, request, product_slug=None):
        product = self._get_product(product_slug)
        if not product:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user and request.user.is_authenticated else None

        custom_name = serializer.validated_data.get("user_name")
        if custom_name and custom_name.strip() and custom_name.strip() != "کاربر خریدار":
            user_display = custom_name.strip()
        elif user:
            user_display = f"{user.first_name} {user.last_name}".strip() or user.email or "کاربر خریدار"
        else:
            user_display = "کاربر خریدار"

        review = Review.objects.create(
            product=product,
            user=user,
            user_name=user_display,
            rating=serializer.validated_data.get("rating", 5),
            text=serializer.validated_data["text"],
            status=Review.Status.PENDING,
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class AdminReviewViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]

    def list(self, request):
        qs = Review.objects.filter(deleted_at__isnull=True).select_related("product", "user")
        status_param = request.query_params.get("status")
        if status_param and status_param != "all":
            qs = qs.filter(status=status_param)
        product_id = request.query_params.get("product_id")
        if product_id:
            qs = qs.filter(product_id=product_id)
        search = request.query_params.get("search")
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(user_name__icontains=search)
                | Q(text__icontains=search)
                | Q(product__title__icontains=search)
            )
        qs = qs.order_by("-created_at")
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ReviewSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ReviewSerializer(qs, many=True)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        review = Review.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not review:
            return Response({"detail": "Review not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminReviewUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for attr, val in serializer.validated_data.items():
            setattr(review, attr, val)
        review.save()
        return Response(ReviewSerializer(review).data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        review = Review.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not review:
            return Response({"detail": "Review not found."}, status=status.HTTP_404_NOT_FOUND)
        review.status = Review.Status.APPROVED
        review.save(update_fields=["status", "updated_at"])
        return Response(ReviewSerializer(review).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        review = Review.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not review:
            return Response({"detail": "Review not found."}, status=status.HTTP_404_NOT_FOUND)
        review.status = Review.Status.REJECTED
        review.save(update_fields=["status", "updated_at"])
        return Response(ReviewSerializer(review).data)

    def destroy(self, request, pk=None):
        review = Review.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not review:
            return Response({"detail": "Review not found."}, status=status.HTTP_404_NOT_FOUND)
        review.delete()
        return Response({"message": "Review deleted."})
