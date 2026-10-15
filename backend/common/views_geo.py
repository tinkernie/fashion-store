from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from common import geo_iran


class GeoViewSet(viewsets.GenericViewSet):
    """Iranian province/city dropdown data (vendored, cached)."""

    permission_classes = [AllowAny]

    @method_decorator(cache_page(3600 * 24))
    def list(self, request):
        return Response({"provinces": geo_iran.list_provinces()})

    @action(detail=False, methods=["get"], url_path="provinces/(?P<province_id>[^/.]+)/cities")
    @method_decorator(cache_page(3600 * 24))
    def cities(self, request, province_id=None):
        cities = geo_iran.list_cities(province_id)
        if cities is None:
            return Response(
                {"detail": "Unknown province."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response({"province_id": int(province_id), "cities": cities})
