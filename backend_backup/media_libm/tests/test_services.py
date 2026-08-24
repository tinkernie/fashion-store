import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from media_libm.services import MediaService
from media_libm.selectors import MediaSelector
from .factories import MediaFactory
from product_options.tests.factories import ProductOptionFactory
from common.exceptions import BusinessException


@pytest.mark.django_db
class TestMediaService:
    def test_upload_image(self, mocker):
        mocker.patch('media_libm.tasks.generate_thumbnails.delay')
        option = ProductOptionFactory()
        service = MediaService()
        file = SimpleUploadedFile('test.jpg', b'file_content', content_type='image/jpeg')
        result = service.upload_media(option, file, 'image', alt_text='Test')
        assert result['media_type'] == 'image'
        assert result['url'] is not None
        # Check media_libm exists
        media = MediaSelector.get_media_by_id(result['id'])
        assert media is not None

    def test_upload_invalid_extension(self):
        option = ProductOptionFactory()
        service = MediaService()
        file = SimpleUploadedFile('test.txt', b'text')
        with pytest.raises(BusinessException):
            service.upload_media(option, file, 'image')

    def test_reorder(self):
        option = ProductOptionFactory()
        m1 = MediaFactory(content_object=option, position=0)
        m2 = MediaFactory(content_object=option, position=1)
        service = MediaService()
        service.reorder_media(option, [str(m2.id), str(m1.id)])
        m1.refresh_from_db()
        m2.refresh_from_db()
        assert m1.position == 1
        assert m2.position == 0
