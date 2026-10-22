from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.exceptions import BusinessException
from users.selectors import UserSelector
from . import services
from .rates import METHODS


class ShippingViewSet(viewsets.GenericViewSet):
    """Checkout shipping: quotes and method catalog (auth required)."""

    permission_classes = [IsAuthenticated]

    def _cart_key(self, request):
        return (
            request.headers.get("X-Cart-Session-Key")
            or request.query_params.get("session_key")
            or (request.data.get("session_key") if isinstance(getattr(request, "data", None), dict) else None)
        )

    @action(detail=False, methods=["get"], url_path="methods")
    def methods(self, request):
        """Static catalog of the two offered methods (no address needed)."""
        return Response({
            "default_method": services.rates.METHOD_PISHTAZ,
            "methods": [
                {
                    "method": m["code"],
                    "name": m["name"],
                    "name_en": m["name_en"],
                    "eta_days": m["eta_days"],
                }
                for m in (METHODS[services.rates.METHOD_PISHTAZ],
                          METHODS[services.rates.METHOD_VIZHEH])
            ],
        })

    @action(detail=False, methods=["get", "post"])
    def quote(self, request):
        """Price both methods for the current cart.

        GET/POST params: address_id (preferred) or province_id.
        Response: selected (default pishtaz) + options[] with full
        Toman breakdown (base[includes folded packaging+store fee]/surcharge/insurance/total).
        """
        data = request.query_params if request.method == "GET" else (request.data or {})
        address_id = data.get("address_id")
        province_id = data.get("province_id")
        province_name = None
        if address_id:
            address = UserSelector.get_address_by_id(request.user, address_id)
            if not address:
                raise BusinessException(
                    "Address not found in your address book.", code="address_not_found"
                )
            province_name = address.province_name
        elif province_id is not None:
            from common import geo_iran

            province_name = geo_iran.province_name(province_id)
            if not province_name:
                raise BusinessException("Unknown province.", code="unknown_province")
        else:
            return Response(
                {"detail": "address_id or province_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        weight_grams, subtotal = services.cart_totals(request.user, self._cart_key(request))
        return Response(services.quote(province_name, weight_grams, subtotal))
