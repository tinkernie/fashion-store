from .models import Page
from .repositories import PageRepository, SiteContentRepository
from .selectors import PageSelector, SiteContentSelector
from common.exceptions import BusinessException

class CMSService:
    # --- Pages ---
    def create_page(self, data: dict) -> dict:
        slug = data.get('slug')
        if PageSelector.get_page_by_slug(slug):
            raise BusinessException("A page with this slug already exists.")
        page = PageRepository.create_page(data)
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
        updated = PageRepository.update_page(page, **data)
        return self._serialize_page(updated)

    def delete_page(self, slug: str) -> dict:
        page = PageSelector.get_page_by_slug(slug)
        if not page:
            raise BusinessException("Page not found.")
        PageRepository.delete_page(page)
        return {"message": f"Page '{slug}' deleted."}

    def publish_page(self, slug: str) -> dict:
        page = PageSelector.get_page_by_slug(slug)
        if not page:
            raise BusinessException("Page not found.")
        PageRepository.update_page(page, status=Page.Status.PUBLISHED)
        return self._serialize_page(page)

    def get_page_public(self, slug: str) -> dict:
        page = PageSelector.get_published_page_by_slug(slug)
        if not page:
            raise BusinessException("Page not found.")
        return self._serialize_page(page)

    def list_pages_public(self) -> list[dict]:
        pages = PageSelector.list_published_pages()
        return [self._serialize_page(p, include_content=False) for p in pages]

    def list_pages_admin(self) -> list[dict]:
        pages = PageSelector.list_all_pages()
        return [self._serialize_page(p) for p in pages]

    # --- Site Content ---
    def get_site_content(self, key: str) -> dict:
        content = SiteContentSelector.get_by_key(key)
        if content is None:
            raise BusinessException("Content key not found.")
        return {key: content}

    def update_site_content(self, key: str, content: dict) -> dict:
        # Ensure key exists
        SiteContentRepository.get_or_create_by_key(key)
        obj = SiteContentRepository.update_content(key, content)
        return {obj.key: obj.content}

    def delete_site_content(self, key: str):
        SiteContentRepository.delete_by_key(key)
        return {"message": f"Site content '{key}' deleted."}

    def _serialize_page(self, page, include_content=True) -> dict:
        data = {
            'slug': page.slug,
            'title': page.title,
            'status': page.status,
            'seo_metadata': page.seo_metadata,
            'updated_at': page.updated_at.isoformat(),
        }
        if include_content:
            data['content'] = page.content
        return data