import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .factories import CollectionFactory

User = get_user_model()


@pytest.mark.django_db
class TestPublicAPI:
    def test_list_visible_collections(self):
        CollectionFactory(name='Summer', slug='summer')
        client = APIClient()
        resp = client.get('/api/v1/collections/')
        assert resp.status_code == 200
        assert len(resp.data) == 1

    def test_retrieve_by_slug(self):
        coll = CollectionFactory(slug='new-arrivals')
        client = APIClient()
        resp = client.get('/api/v1/collections/new-arrivals/')
        assert resp.status_code == 200
        assert resp.data['slug'] == 'new-arrivals'


class TestAdminAPI:
    def test_create_collection(self):
        admin = User.objects.create_superuser('admin@test.com', 'pass')
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.post('/api/v1/admin/collections/', {
            'name': 'Sale', 'slug': 'sale'
        })
        assert resp.status_code == 201

    def test_unauthorized(self):
        client = APIClient()
        resp = client.post('/api/v1/admin/collections/', {
            'name': 'Sale', 'slug': 'sale'
        })
        assert resp.status_code == 401
