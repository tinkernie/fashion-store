from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicMediaViewSet, AdminMediaViewSet

public_router = DefaultRouter()
public_router.register(r'public', PublicMediaViewSet, basename='public-media_libm')

admin_router = DefaultRouter()
admin_router.register(r'admin/media_libm', AdminMediaViewSet, basename='admin-media_libm')

urlpatterns = [
    path('', include(public_router.urls)),
    path('', include(admin_router.urls)),
]
