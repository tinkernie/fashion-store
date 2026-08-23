from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PublicPageViewSet, AdminPageViewSet,
    PublicSiteContentViewSet, AdminSiteContentViewSet
)

# Public
public_page_router = DefaultRouter()
public_page_router.register(r'pages', PublicPageViewSet, basename='public-cms-page')

public_site_router = DefaultRouter()
public_site_router.register(r'site-content', PublicSiteContentViewSet, basename='public-cms-site')

# Admin
admin_page_router = DefaultRouter()
admin_page_router.register(r'admin/cms/pages', AdminPageViewSet, basename='admin-cms-page')

admin_site_router = DefaultRouter()
admin_site_router.register(r'admin/cms/site-content', AdminSiteContentViewSet, basename='admin-cms-site')

urlpatterns = [
    path('', include(public_page_router.urls)),
    path('', include(public_site_router.urls)),
    path('', include(admin_page_router.urls)),
    path('', include(admin_site_router.urls)),
]
