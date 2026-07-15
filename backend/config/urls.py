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
]
