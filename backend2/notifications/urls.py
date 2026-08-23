from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserNotificationViewSet, AdminNotificationViewSet

user_router = DefaultRouter()
user_router.register(r'notifications', UserNotificationViewSet, basename='user-notifications')

admin_router = DefaultRouter()
admin_router.register(r'admin/notifications', AdminNotificationViewSet, basename='admin-notifications')

urlpatterns = [
    path('', include(user_router.urls)),
    path('', include(admin_router.urls)),
]
