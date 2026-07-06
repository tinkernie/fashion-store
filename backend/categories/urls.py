from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicCategoryViewSet, AdminCategoryViewSet

public_router = DefaultRouter()
public_router.register(r'', PublicCategoryViewSet, basename='public-category')

admin_router = DefaultRouter()
admin_router.register(r'admin/categories', AdminCategoryViewSet, basename='admin-category')

urlpatterns = [
    path('categories/', include(public_router.urls)),
    path('', include(admin_router.urls)),
]