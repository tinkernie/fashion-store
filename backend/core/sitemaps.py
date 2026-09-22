from django.contrib.sitemaps import Sitemap
from products.models import Product
from categories.models import Category


class ProductSitemap(Sitemap):
    changefreq = "daily"
    priority = 0.9

    def items(self):
        return Product.objects.filter(status="published", deleted_at__isnull=True).select_related("category").prefetch_related("images")

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        from django.conf import settings
        base = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
        return f"{base}/products/{obj.slug}"

    def get_urls(self, page=1, site=None, protocol=None):
        # Add image sitemap entries with priority/images
        from django.contrib.sitemaps import Sitemap as BaseSitemap
        urls = super().get_urls(page, site, protocol)
        # Enhance with images
        for url_info in urls:
            # url_info is dict with 'item', 'location', etc.
            try:
                item = url_info.get("item")
                if item and hasattr(item, "images"):
                    imgs = item.images.filter(deleted_at__isnull=True).order_by("position")[:5]
                    img_urls = []
                    for img in imgs:
                        u = img.url
                        if u:
                            # Make absolute
                            from django.conf import settings
                            if not u.startswith("http"):
                                base = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
                                u = f"{base}{u}" if u.startswith("/") else f"{base}/{u}"
                            img_urls.append({"loc": u, "caption": item.title})
                    # Fallback to metadata image
                    if not img_urls and item.metadata and item.metadata.get("image_url"):
                        img_urls.append({"loc": item.metadata["image_url"], "caption": item.title})
                    if img_urls:
                        url_info["images"] = img_urls
            except Exception:
                pass
        return urls


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

    def priority(self, obj):
        # Root categories higher priority
        try:
            if not obj.parent:
                return 0.8
            return 0.6
        except Exception:
            return 0.7
