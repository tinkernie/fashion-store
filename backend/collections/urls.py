from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicCollectionViewSet, AdminCollectionViewSet

public_router = DefaultRouter()
public_router.register(r'', PublicCollectionViewSet, basename='public-collection')

admin_router = DefaultRouter()
admin_router.register(r'admin/collections', AdminCollectionViewSet, basename='admin-collection')

urlpatterns = [
    path('collections/', include(public_router.urls)),
    path('', include(admin_router.urls)),
]