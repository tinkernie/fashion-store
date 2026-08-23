from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminCouponViewSet

router = DefaultRouter()
router.register(r'admin/coupons', AdminCouponViewSet, basename='admin-coupons')

urlpatterns = [
    path('', include(router.urls)),
]
