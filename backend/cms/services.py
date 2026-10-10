from django.core.cache import cache
from .models import Page
from .repositories import PageRepository, SiteContentRepository
from .selectors import PageSelector, SiteContentSelector
from common.exceptions import BusinessException

PAGE_CACHE_TTL = 300
SITE_CACHE_TTL = 300


def _invalidate_page_cache(slug=None):
    try:
        if slug:
            cache.delete(f"cms:page:{slug}")
        cache.delete("cms:pages:published")
    except Exception:
        pass


def _invalidate_site_cache(key=None):
    try:
        if key:
            cache.delete(f"cms:site:{key}")
    except Exception:
        pass

class CMSService:
    # --- Pages ---
    def create_page(self, data: dict) -> dict:
        slug = data.get('slug')
        if PageSelector.get_page_by_slug(slug):
            raise BusinessException("A page with this slug already exists.")
        from django.db import IntegrityError

        try:
            page = PageRepository.create_page(data)
        except IntegrityError:
            raise BusinessException("A page with this slug already exists.")
        return self._serialize_page(page)

    def update_page(self, slug: str, data: dict) -> dict:
        page = PageSelector.get_page_by_slug(slug)
        if not page:
            raise BusinessException("Page not found.")
        # If slug is changing, validate uniqueness
        new_slug = data.get('slug')
        if new_slug and new_slug != slug:
            if PageSelector.get_page_by_slug(new_slug):
                raise BusinessException("A page with this slug already exists.")
        from django.db import IntegrityError as _IE

        try:
            updated = PageRepository.update_page(page, **data)
        except _IE:
            raise BusinessException("A page with this slug already exists.")
        _invalidate_page_cache(slug)
        _invalidate_page_cache(updated.slug)
        return self._serialize_page(updated)

    def delete_page(self, slug: str) -> dict:
        page = PageSelector.get_page_by_slug(slug)
        if not page:
            raise BusinessException("Page not found.")
        PageRepository.delete_page(page)
        _invalidate_page_cache(slug)
        return {"message": f"Page '{slug}' deleted."}

    def publish_page(self, slug: str) -> dict:
        page = PageSelector.get_page_by_slug(slug)
        if not page:
            raise BusinessException("Page not found.")
        PageRepository.update_page(page, status=Page.Status.PUBLISHED)
        _invalidate_page_cache(slug)
        return self._serialize_page(page)

    def get_page_public(self, slug: str, preview: bool = False, user=None) -> dict:
        # preview=true allows staff to see drafts without publishing
        if preview and user and getattr(user, "is_staff", False):
            page = PageSelector.get_page_by_slug(slug)
            if not page or page.deleted_at is not None:
                raise BusinessException("Page not found.")
            return self._serialize_page(page)
        cache_key = f"cms:page:{slug}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        page = PageSelector.get_published_page_by_slug(slug)
        if not page:
            raise BusinessException("Page not found.")
        data = self._serialize_page(page)
        try:
            cache.set(cache_key, data, PAGE_CACHE_TTL)
        except Exception:
            pass
        return data

    def list_pages_public(self) -> list[dict]:
        cached = cache.get("cms:pages:published")
        if cached is not None:
            return cached
        pages = PageSelector.list_published_pages()
        data = [self._serialize_page(p, include_content=False) for p in pages]
        try:
            cache.set("cms:pages:published", data, PAGE_CACHE_TTL)
        except Exception:
            pass
        return data

    def list_pages_admin(self, filters: dict = None):
        # Step 5: return queryset for DRF pagination in view
        return PageSelector.list_all_pages(filters)

    # --- Site Content ---
    @classmethod
    def get_default_content(cls, key: str) -> dict:
        if key == "announcement":
            return {
                "enabled": True,
                "badge": "جشنواره",
                "text": "ارسال رایگان برای تمام سفارش‌های بالای ۷۰۰ هزار تومان به سراسر کشور",
                "link": "/women",
            }
        elif key in ("hero", "homepage"):
            return {
                "badge": "کالکشن جدید ۲۰۲۶",
                "headline": "استایل لوکس و مینیمال برای زندگی مدرن",
                "subtitle": "طراحی‌های اختصاصی و دوخت باکیفیت برای درخشش شما در هر موقعیت",
                "cta_label": "مشاهده جدیدترین‌ها",
                "cta_link": "/women",
                "image_url": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
            }
        elif key == "footer":
            return {
                "description": "فروشگاه تخصصی پوشاک مد و فشن با تمرکز بر کیفیت برتر، طراحی مدرن و ارسال سریع.",
                "phone": "۰۲۱-۸۸۸۸۷۷۶۶",
                "email": "info@fashionstore.com",
                "address": "تهران، خیابان ولیعصر، برج مد و تجارت، طبقه ۵",
                "working_hours": "شنبه تا پنج‌شنبه: ۹ صبح الی ۹ شب",
            }
        elif key == "header":
            return {
                "logo_text": "ماوی",
                "menu_items": [],
            }
        elif key == "discount_section":
            return cls.get_discount_section_default()
        return {}

    def get_site_content(self, key: str) -> dict:
        from .models import SiteContent as SiteContentModel

        if key not in SiteContentModel.ALLOWED_KEYS:
            raise BusinessException(
                f"Unknown key '{key}'. Allowed: {', '.join(SiteContentModel.ALLOWED_KEYS)}."
            )

        cache_key = f"cms:site:{key}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        content = SiteContentSelector.get_by_key(key)
        if content is None:
            return {key: self.get_default_content(key)}
        data = {key: content}
        try:
            cache.set(cache_key, data, SITE_CACHE_TTL)
        except Exception:
            pass
        return data

    def update_site_content(self, key: str, content: dict) -> dict:
        # Step 4: lock keys at service layer too (serializers can be bypassed)
        from .models import SiteContent as SiteContentModel

        if key not in SiteContentModel.ALLOWED_KEYS:
            raise BusinessException(
                f"Unknown key '{key}'. Allowed: {', '.join(SiteContentModel.ALLOWED_KEYS)}."
            )
        # Ensure key exists
        SiteContentRepository.get_or_create_by_key(key)
        obj = SiteContentRepository.update_content(key, content)
        _invalidate_site_cache(key)
        return {obj.key: obj.content}

    def delete_site_content(self, key: str):
        SiteContentRepository.delete_by_key(key)
        _invalidate_site_cache(key)
        return {"message": f"Site content '{key}' deleted."}

    @staticmethod
    def get_discount_section_default() -> dict:
        return {
            "enabled": False,
            "title": "",
            "subtitle": "",
            "cta_text": "",
            "cta_link": "/products/?has_discount=true",
            "collection_slug": None,
            "background_image": "",
            "expires_at": None,
        }

    def _serialize_page(self, page, include_content=True) -> dict:
        from django.conf import settings

        meta = page.seo_metadata or {}
        base = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
        meta_title = meta.get("meta_title") or meta.get("title") or f"{page.title} | Luxe"
        meta_title = str(meta_title)[:70]
        meta_desc = meta.get("meta_description") or meta.get("description") or ""
        meta_desc = str(meta_desc)[:160]
        canonical = f"{base}/pages/{page.slug}"
        data = {
            'slug': page.slug,
            'title': page.title,
            'status': page.status,
            'seo_metadata': page.seo_metadata,
            'meta_title': meta_title,
            'meta_description': meta_desc,
            'canonical_url': canonical,
            'hreflang': [
                {"hreflang": "fa-IR", "href": canonical},
                {"hreflang": "x-default", "href": canonical},
            ],
            'updated_at': page.updated_at.isoformat(),
        }
        if include_content:
            data['content'] = page.content
        return data