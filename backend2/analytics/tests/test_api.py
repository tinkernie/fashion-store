import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .factories import TrackedEventFactory

User = get_user_model()


@pytest.mark.django_db
class TestPublicTracking:
    def test_track_page_view(self):
        client = APIClient()
        resp = client.post('/api/v1/analytics/track/', {
            'type': 'page_view',
            'payload': {'url': '/shop'},
        })
        assert resp.status_code == 201
        # Should have created an event
        from analytics.models import TrackedEvent
        assert TrackedEvent.objects.count() == 1


class TestAdminDashboard:
    def test_sales_summary(self):
        admin = User.objects.create_superuser('admin@test.com', 'pass')
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.get('/api/v1/admin/analytics/sales/?start_date=2025-01-01&end_date=2025-12-31')
        assert resp.status_code == 200
        assert 'total_orders' in resp.data

    def test_popular_products(self):
        admin = User.objects.create_superuser('admin@test.com', 'pass')
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.get('/api/v1/admin/analytics/popular_products/')
        assert resp.status_code == 200
