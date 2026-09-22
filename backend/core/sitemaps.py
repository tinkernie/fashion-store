from django.contrib.sitemaps import Sitemap
from products.models import Product
from categories.models import Category


class ProductSitemap(Sitemap):
    changefreq = "daily"
    priority = 0.9

    def items(self):
        return Product.objects.filter(status="published", deleted_at__isnull=True).select_related("category")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        from django.conf import settings
        base = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
        return f"{base}/products/{obj.slug}"


class CategorySitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return Category.objects.filter(is_active=True, deleted_at__isnull=True)

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        from django.conf import settings
        base = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
        return f"{base}/categories/{obj.slug}"
