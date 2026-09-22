from django.http import HttpResponse
from django.views.decorators.http import require_GET


@require_GET
def robots_txt(request):
    from django.conf import settings
    frontend = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
    lines = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /api/admin/",
        "Disallow: /api/cart/",
        "Disallow: /admin/",
        f"Sitemap: {frontend}/sitemap.xml",
        f"Sitemap: {request.build_absolute_uri('/sitemap.xml')}",
        "",
        "Crawl-delay: 1",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")
