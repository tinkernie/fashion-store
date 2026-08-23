from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from .services import CouponService
from .serializers import CouponCreateSerializer, CouponUpdateSerializer, ApplyCouponSerializer


class AdminCouponViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    service = CouponService()

    def create(self, request):
        serializer = CouponCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = self.service.create_coupon(serializer.validated_data)
        return Response(result, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        serializer = CouponUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        result = self.service.update_coupon(pk, serializer.validated_data)
        return Response(result)

    def destroy(self, request, pk=None):
        result = self.service.delete_coupon(pk)
        return Response(result)

    def list(self, request):
        from .selectors import CouponSelector
        coupons = CouponSelector.get_all_coupons_admin()
        data = [self.service._serialize(c) for c in coupons]
        return Response(data)

    def retrieve(self, request, pk=None):
        from .selectors import CouponSelector
        coupon = CouponSelector.get_coupon_by_id(pk)
        if not coupon:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(self.service._serialize(coupon))
