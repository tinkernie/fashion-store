from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, CallbackViewSet, PaymentCallbackResultView

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='user-payments')
callback_router = DefaultRouter()
callback_router.register(r'callbacks', CallbackViewSet, basename='payment-callbacks')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(callback_router.urls)),
    path('payments/callbacks/<str:gateway>/result/', PaymentCallbackResultView.as_view(), name='payment-callback-result'),
]