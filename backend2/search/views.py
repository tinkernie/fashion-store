from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .services import SearchService
from .serializers import SearchSerializer


class SearchViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'], serializer_class=SearchSerializer)
    def products(self, request):
        serializer = self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        # Build filters dict from validated data
        data = serializer.validated_data
        filters = {}
        if data.get('category'):
            filters['category_slug'] = data['category']
        if data.get('collection'):
            filters['collection_slug'] = data['collection']
        if data.get('min_price') or data.get('max_price'):
            filters['min_price'] = data.get('min_price')
            filters['max_price'] = data.get('max_price')
        if data.get('options'):
            filters['options'] = data['options']

        service = SearchService()
        result = service.search(
            query=data.get('q'),
            filters=filters,
            sort=data.get('sort'),
            page=data.get('page', 1),
            page_size=data.get('page_size', 20),
        )
        return Response(result)
