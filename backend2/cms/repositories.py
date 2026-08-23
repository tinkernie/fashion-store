from .models import Page, SiteContent
from common.exceptions import BusinessException

class PageRepository:
    @staticmethod
    def create_page(data: dict) -> Page:
        return Page.objects.create(**data)

    @staticmethod
    def update_page(page: Page, **fields) -> Page:
        allowed = {'title', 'content', 'status', 'seo_metadata', 'slug'}
        for key, value in fields.items():
            if key in allowed:
                setattr(page, key, value)
        page.save()
        return page

    @staticmethod
    def delete_page(page: Page):
        page.delete()   # soft delete


class SiteContentRepository:
    @staticmethod
    def get_or_create_by_key(key: str) -> SiteContent:
        obj, _ = SiteContent.objects.get_or_create(key=key, defaults={'content': {}})
        return obj

    @staticmethod
    def update_content(key: str, content: dict) -> SiteContent:
        obj = SiteContent.objects.get(key=key)
        obj.content = content
        obj.save()
        return obj

    @staticmethod
    def delete_by_key(key: str):
        SiteContent.objects.filter(key=key).delete()