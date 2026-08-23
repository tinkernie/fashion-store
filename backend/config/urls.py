from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [

    # drf schema swagger -> api document
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),

    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui',
    ),

    path(
        'api/redoc/',
        SpectacularRedocView.as_view(url_name='schema'),
        name='redoc',
    ),

    # ina baraye khode site hast
    path('api/v1/auth/', include('authentication.urls')),
    path('api/v1/users/', include('users.urls')),
    path('api/v1/', include('categories.urls')),
    path('api/v1/', include('collections.urls')),
    path('api/v1/', include('products.urls')),
    path('api/v1/', include('product_options.urls')),
    path('api/v1/', include('variants.urls')),
    path('api/v1/', include('inventory.urls')),
    path('api/v1/', include('cart.urls')),
    path('api/v1/', include('wishlist.urls')),
    path('api/v1/', include('orders.urls')),
]
