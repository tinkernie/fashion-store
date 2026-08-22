from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    # drf schema swagger -> api document
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    # ina baraye khode site hast
    path("api/auth/", include("authentication.urls")),
    path("api/users/", include("users.urls")),
    path("api/", include("categories.urls")),
    path("api/", include("store_collections.urls")),
    path("api/", include("products.urls")),
    path("api/", include("product_options.urls")),
    path("api/", include("variants.urls")),
    path("api/", include("inventory.urls")),
    path("api/", include("cart.urls")),
    path("api/", include("wishlist.urls")),
    path("api/", include("orders.urls")),
    path('api/', include('cms.urls')),
    path('api/', include('notifications.urls')),
    path('api/', include('analytics.urls')),
    path('api/', include('search.urls')),
    path('api/', include('coupons.urls')),
    path('api/', include('media_libm.urls')),

    # v1 prefixes
    path("api/v1/auth/", include("authentication.urls")),
    path("api/v1/users/", include("users.urls")),
    path("api/v1/", include("categories.urls")),
    path("api/v1/", include("store_collections.urls")),
    path("api/v1/", include("products.urls")),
    path("api/v1/", include("product_options.urls")),
    path("api/v1/", include("variants.urls")),
    path("api/v1/", include("inventory.urls")),
    path("api/v1/", include("cart.urls")),
    path("api/v1/", include("wishlist.urls")),
    path("api/v1/", include("orders.urls")),
    path('api/v1/', include('cms.urls')),
    path('api/v1/', include('notifications.urls')),
    path('api/v1/', include('analytics.urls')),
    path('api/v1/', include('search.urls')),
    path('api/v1/', include('coupons.urls')),
    path('api/v1/', include('media_libm.urls')),
]
