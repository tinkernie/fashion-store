import pytest
from common.exceptions import BusinessException
from cms.services import CMSService
from .factories import PageFactory, SiteContentFactory


@pytest.mark.django_db
class TestPageService:
    def test_create_page(self):
        service = CMSService()
        result = service.create_page({'title': 'About', 'slug': 'about', 'content': [], 'status': 'draft'})
        assert result['slug'] == 'about'

    def test_duplicate_slug_raises(self):
        PageFactory(slug='about')
        service = CMSService()
        with pytest.raises(BusinessException):
            service.create_page({'title': 'Another', 'slug': 'about'})

    def test_publish_page(self):
        page = PageFactory(slug='faq', status='draft')
        service = CMSService()
        result = service.publish_page('faq')
        assert result['status'] == 'published'

    def test_public_page_not_found_if_draft(self):
        page = PageFactory(slug='hidden', status='draft')
        service = CMSService()
        with pytest.raises(BusinessException):
            service.get_page_public('hidden')


class TestSiteContent:
    def test_get_site_content_missing(self):
        service = CMSService()
        with pytest.raises(BusinessException):
            service.get_site_content('nonexistent')

    def test_update_site_content(self):
        SiteContentFactory(key='header', content={'logo': 'old'})
        service = CMSService()
        result = service.update_site_content('header', {'logo': 'new'})
        assert result['header']['logo'] == 'new'

    def test_delete_site_content(self):
        SiteContentFactory(key='announcement')
        service = CMSService()
        service.delete_site_content('announcement')
        with pytest.raises(BusinessException):
            service.get_site_content('announcement')
