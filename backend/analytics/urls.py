from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicTrackingViewSet, AdminAnalyticsViewSet

public_router = DefaultRouter()
public_router.register(r'analytics', PublicTrackingViewSet, basename='public-analytics')

admin_router = DefaultRouter()
admin_router.register(r'admin/analytics', AdminAnalyticsViewSet, basename='admin-analytics')

urlpatterns = [
    path('', include(public_router.urls)),
    path('', include(admin_router.urls)),
]
