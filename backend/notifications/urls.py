from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserNotificationViewSet,
    AdminNotificationViewSet,
    UserStockAlertViewSet,
    AdminStockAlertViewSet,
)

user_router = DefaultRouter()
user_router.register(r'notifications', UserNotificationViewSet, basename='user-notifications')
user_router.register(r'stock-alerts', UserStockAlertViewSet, basename='user-stock-alerts')

admin_router = DefaultRouter()
admin_router.register(r'admin/notifications', AdminNotificationViewSet, basename='admin-notifications')
admin_router.register(r'admin/stock-alerts', AdminStockAlertViewSet, basename='admin-stock-alerts')

urlpatterns = [
    path('', include(user_router.urls)),
    path('', include(admin_router.urls)),
]
