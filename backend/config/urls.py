from django.contrib import admin
from django.urls import path, include
from django.contrib.sitemaps.views import sitemap
from django.views.decorators.cache import cache_page
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from core.sitemaps import ProductSitemap, CategorySitemap
from core.views_seo import robots_txt

sitemaps = {"products": ProductSitemap, "categories": CategorySitemap}

from django.conf import settings as _dj_settings

urlpatterns = [
    # Django admin is mounted in DEBUG only; production uses the custom
    # admin panel APIs (smaller attack surface, domain logic enforced).
    *([path("admin/", admin.site.urls)] if _dj_settings.DEBUG else []),
    path("robots.txt", robots_txt, name="robots_txt"),
    path("sitemap.xml", cache_page(3600)(sitemap), {"sitemaps": sitemaps}, name="sitemap"),
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
    path("api/", include("users.urls")),
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
    path('api/', include('payments.urls')),
    path('api/', include('media_libm.urls')),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

