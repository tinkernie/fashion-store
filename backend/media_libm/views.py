from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from django.contrib.contenttypes.models import ContentType
from .services import MediaService
from .selectors import MediaSelector
from .serializers import MediaUploadSerializer, MediaUpdateSerializer, ReorderSerializer
from product_options.selectors import ProductOptionSelector
from products.selectors import ProductSelector


class PublicMediaViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'], url_path=r'products/(?P<product_slug>[-\w]+)/options/(?P<option_id>[^/.]+)/media_libm')
    def for_product_option(self, request, product_slug=None, option_id=None):
        product = ProductSelector.get_product_by_slug(product_slug)
        option = ProductOptionSelector.get_option_by_id(option_id)

        if not product or not option or option.product_id != product.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        media = MediaSelector.get_media_for_object(option)
        return Response(MediaUploadSerializer(media, many=True).data)

        # Validate product exists (optional)
        # media_list = MediaSelector.get_media_for_product_option(option_id)
        # data = [{
        #     'id': str(m.id),
        #     'url': m.file.url,
        #     'media_type': m.media_type,
        #     'alt_text': m.alt_text,
        #     'thumbnail': m.metadata.get('thumbnail'),
        #     'responsive': m.metadata.get('responsive'),
        #     'position': m.position,
        # } for m in media_list]
        # return Response(data)


class AdminMediaViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    service = MediaService()

    # We'll use actions with explicit URLs for flexibility: /admin/media_libm/upload/?content_type=productoption&object_id=...
    @action(detail=False, methods=['post'], serializer_class=MediaUploadSerializer)
    def upload(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"detail": "File is required."}, status=status.HTTP_400_BAD_REQUEST)

        content_type = request.data.get('content_type')
        object_id = request.data.get('object_id')

        # If no object relation specified, perform direct media upload & return URL
        if not content_type or not object_id:
            import os, uuid
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile
            from django.conf import settings

            ext = os.path.splitext(file.name)[1]
            filename = f"products/{uuid.uuid4().hex}{ext}"
            saved_path = default_storage.save(filename, ContentFile(file.read()))
            
            # Format absolute and relative URLs
            media_prefix = getattr(settings, 'MEDIA_URL', '/media_libm/')
            if not media_prefix.startswith('/'):
                media_prefix = '/' + media_prefix
            if not media_prefix.endswith('/'):
                media_prefix = media_prefix + '/'
            
            relative_url = f"{media_prefix}{saved_path}"
            full_url = request.build_absolute_uri(relative_url)

            return Response({
                "url": full_url,
                "image_url": full_url,
                "relative_url": relative_url,
                "filename": filename,
            }, status=status.HTTP_201_CREATED)

        try:
            ct = ContentType.objects.get(model=content_type)
            model_class = ct.model_class()
            obj = model_class.objects.filter(id=object_id).first()
        except ContentType.DoesNotExist:
            return Response({"detail": "Invalid content_type."}, status=status.HTTP_400_BAD_REQUEST)
        if not obj:
            return Response({"detail": "Object not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        media_type = serializer.validated_data.get('media_type', 'image')
        alt_text = serializer.validated_data.get('alt_text', '')
        caption = serializer.validated_data.get('caption', '')
        position = serializer.validated_data.get('position', 0)

        result = self.service.upload_media(obj, file, media_type, alt_text, caption, position)
        return Response(result, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], serializer_class=MediaUpdateSerializer)
    def update_media(self, request, pk=None):
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        result = self.service.update_media(pk, serializer.validated_data)
        return Response(result)

    @action(detail=True, methods=['delete'])
    def delete_media(self, request, pk=None):
        result = self.service.delete_media(pk)
        return Response(result)

    @action(detail=False, methods=['post'], serializer_class=ReorderSerializer)
    def reorder(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        content_type = request.data.get('content_type')
        object_id = request.data.get('object_id')
        if not content_type or not object_id:
            return Response({"detail": "content_type and object_id required."}, status=status.HTTP_400_BAD_REQUEST)
        ct = ContentType.objects.get(model=content_type)
        obj = ct.model_class().objects.filter(id=object_id).first()
        if not obj:
            return Response({"detail": "Object not found."}, status=status.HTTP_404_NOT_FOUND)
        result = self.service.reorder_media(obj, serializer.validated_data['ordered_ids'])
        return Response(result)
