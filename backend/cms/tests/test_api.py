import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .factories import PageFactory, SiteContentFactory

User = get_user_model()


@pytest.mark.django_db
class TestPublicAPI:
    def test_get_published_page(self):
        PageFactory(slug='returns', status='published')
        client = APIClient()
        resp = client.get('/api/v1/pages/returns/')
        assert resp.status_code == 200

    def test_draft_not_found(self):
        PageFactory(slug='draft', status='draft')
        client = APIClient()
        resp = client.get('/api/v1/pages/draft/')
        assert resp.status_code == 400  # BusinessException

    def test_site_content(self):
        SiteContentFactory(key='homepage', content={'hero': 'Luxury'})
        client = APIClient()
        resp = client.get('/api/v1/site-content/homepage/')
        assert resp.status_code == 200
        assert resp.data['homepage']['hero'] == 'Luxury'


class TestAdminAPI:
    def test_create_page_as_admin(self):
        admin = User.objects.create_superuser('admin@test.com', 'pass')
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.post('/api/v1/admin/cms/pages/', {
            'title': 'Privacy', 'slug': 'privacy', 'content': [{'type': 'text'}]
        })
        assert resp.status_code == 201

    def test_update_site_content(self):
        admin = User.objects.create_superuser('admin@test.com', 'pass')
        SiteContentFactory(key='footer', content={'links': []})
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.patch('/api/v1/admin/cms/site-content/footer/', {
            'content': {'links': ['/about']}
        }, format='json')
        assert resp.status_code == 200
        assert resp.data['footer']['links'] == ['/about']
