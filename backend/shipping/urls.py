from django.urls import path

from .views import ShippingViewSet

methods_view = ShippingViewSet.as_view({"get": "methods"})
quote_view = ShippingViewSet.as_view({"get": "quote", "post": "quote"})

urlpatterns = [
    path("shipping/methods/", methods_view, name="shipping-methods"),
    path("shipping/quote/", quote_view, name="shipping-quote"),
]
