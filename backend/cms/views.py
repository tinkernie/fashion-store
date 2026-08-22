from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from .services import CMSService
from .serializers import PageSerializer, PageUpdateSerializer, SiteContentSerializer

class PublicPageViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    service = CMSService()
    lookup_field = 'slug'

    def retrieve(self, request, slug=None):
        result = self.service.get_page_public(slug)
        return Response(result)

    def list(self, request):
        pages = self.service.list_pages_public()
        return Response(pages)


class AdminPageViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    service = CMSService()

    def create(self, request):
        serializer = PageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = self.service.create_page(serializer.validated_data)
        return Response(result, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):   # pk is slug
        serializer = PageUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        result = self.service.update_page(pk, serializer.validated_data)
        return Response(result)

    def destroy(self, request, pk=None):
        result = self.service.delete_page(pk)
        return Response(result)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        result = self.service.publish_page(pk)
        return Response(result)

    def list(self, request):
        pages = self.service.list_pages_admin()
        return Response(pages)

    def retrieve(self, request, pk=None):
        # admin can retrieve any page by slug
        from .selectors import PageSelector
        page = PageSelector.get_page_by_slug(pk)
        if not page:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(self.service._serialize_page(page))


class PublicSiteContentViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    service = CMSService()
    lookup_field = 'key'

    def retrieve(self, request, key=None):
        result = self.service.get_site_content(key)
        return Response(result)


class AdminSiteContentViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    service = CMSService()

    def create(self, request):
        serializer = SiteContentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = self.service.update_site_content(
            serializer.validated_data['key'],
            serializer.validated_data['content']
        )
        return Response(result, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):   # pk is key
        serializer = SiteContentSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        result = self.service.update_site_content(
            pk,
            serializer.validated_data.get('content', {})
        )
        return Response(result)

    def destroy(self, request, pk=None):
        result = self.service.delete_site_content(pk)
        return Response(result)