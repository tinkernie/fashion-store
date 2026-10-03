from .models import Page, SiteContent

class PageSelector:
    @staticmethod
    def get_published_page_by_slug(slug: str) -> Page or None:
        return Page.objects.filter(slug=slug, status=Page.Status.PUBLISHED, deleted_at__isnull=True).first()

    @staticmethod
    def get_page_by_slug(slug: str) -> Page or None:
        return Page.objects.filter(slug=slug).first()

    @staticmethod
    def list_published_pages() -> list[Page]:
        return Page.objects.filter(status=Page.Status.PUBLISHED, deleted_at__isnull=True)

    @staticmethod
    def list_all_pages(filters: dict = None):
        qs = Page.objects.filter(deleted_at__isnull=True)
        if filters:
            if filters.get("status") and filters["status"] != "all":
                qs = qs.filter(status=filters["status"])
            search = filters.get("search")
            if search:
                if len(search) > 100:
                    from common.exceptions import BusinessException

                    raise BusinessException("Search query too long (max 100).")
                from django.db.models import Q

                qs = qs.filter(Q(title__icontains=search) | Q(slug__icontains=search))
        return qs.order_by("-updated_at")


class SiteContentSelector:
    @staticmethod
    def get_by_key(key: str) -> dict or None:
        obj = SiteContent.objects.filter(key=key).first()
        return obj.content if obj else None

    @staticmethod
    def get_all_keys() -> list[str]:
        return list(SiteContent.objects.values_list('key', flat=True))