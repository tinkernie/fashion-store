from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from .services import CategoryService
from .selectors import CategorySelector
from .serializers import (
    CategoryCreateSerializer,
    CategoryUpdateSerializer,
    CategoryTreeSerializer,
    CategoryAdminDetailSerializer,
)


class PublicCategoryViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def list(self, request):
        """Return active categories as a nested tree."""
        categories = CategorySelector.get_active_tree()
        serializer = CategoryTreeSerializer(
            categories, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def retrieve(self, request, slug=None):
        category = CategorySelector.get_category_by_slug(slug)
        if not category:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CategoryTreeSerializer(category, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="flat")
    def flat(self, request):
        """Return flat list of active categories with parent references."""
        categories = CategorySelector.get_active_flat_list()
        data = [
            {
                "id": str(cat.id),
                "name": cat.name,
                "slug": cat.slug,
                "parent_id": str(cat.parent_id) if cat.parent_id else None,
                "is_active": cat.is_active,
            }
            for cat in categories
        ]
        return Response(data)


class AdminCategoryViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]

    def list(self, request):
        """Fetch all categories (both active and inactive) for the admin panel."""
        categories = CategorySelector.get_all_categories_admin()
        serializer = CategoryAdminDetailSerializer(
            categories, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        category = CategorySelector.get_category_by_id(pk)
        if not category:
            return Response(
                {"detail": "Category not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = CategoryAdminDetailSerializer(
            category, context={"request": request}
        )
        return Response(serializer.data)

    def create(self, request):
        serializer = CategoryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = CategoryService()
        result = service.create_category(serializer.validated_data)
        return Response(result, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        serializer = CategoryUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        service = CategoryService()
        result = service.update_category(pk, serializer.validated_data)
        return Response(result)

    def destroy(self, request, pk=None):
        service = CategoryService()
        result = service.deactivate_category(pk)
        return Response(result)
