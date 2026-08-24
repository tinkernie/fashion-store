import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from product_options.tests.factories import ProductOptionFactory
from .factories import MediaFactory

User = get_user_model()


@pytest.mark.django_db
class TestPublicAPI:
    def test_get_media_for_option(self):
        option = ProductOptionFactory()
        media = MediaFactory(content_object=option, media_type='image')
        client = APIClient()
        # We need a product slug? The URL pattern expects a product slug and option id.
        product = option.product
        resp = client.get(f'/api/v1/public/products/{product.slug}/options/{option.id}/media_libm/')
        assert resp.status_code == 200
        assert len(resp.data) == 1
        assert resp.data[0]['url'] is not None


class TestAdminAPI:
    def test_upload_media(self, mocker):
        mocker.patch('media_libm.tasks.generate_thumbnails.delay')
        admin = User.objects.create_superuser('admin@test.com', 'pass')
        option = ProductOptionFactory()
        client = APIClient()
        client.force_authenticate(user=admin)
        with open('test_image.jpg', 'wb') as f:
            f.write(b'fake image')
        with open('test_image.jpg', 'rb') as f:
            resp = client.post('/api/v1/admin/media_libm/upload/', {
                'content_type': 'productoption',
                'object_id': str(option.id),
                'file': f,
                'media_type': 'image',
                'alt_text': 'test',
            }, format='multipart')
        assert resp.status_code == 201
