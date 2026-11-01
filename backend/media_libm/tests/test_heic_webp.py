import io
import pytest
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from common.exceptions import BusinessException
from media_libm.webp import prepare_image, to_webp_file, ensure_webp_field
from media_libm.services import MediaService

User = get_user_model()


def _create_heif_bytes(width=160, height=120, color='blue') -> bytes:
    img = Image.new('RGB', (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format='HEIF')
    return buf.getvalue()


@pytest.mark.django_db
class TestHeicWebpPipeline:
    def test_prepare_image_heic(self):
        heif_data = _create_heif_bytes(200, 150)
        file_obj = io.BytesIO(heif_data)
        img = prepare_image(file_obj)
        assert img.size == (200, 150)
        assert img.mode in ('RGB', 'RGBA')

    def test_to_webp_file_conversion(self):
        heif_data = _create_heif_bytes(100, 100)
        upload = SimpleUploadedFile("IMG_15PROMAX.HEIC", heif_data, content_type="image/heic")
        webp_upload = to_webp_file(upload)

        assert webp_upload.name == "IMG_15PROMAX.webp"
        assert webp_upload.content_type == "image/webp"
        assert webp_upload.size > 0

        # Verify output is a valid WebP image readable by Pillow
        webp_upload.seek(0)
        verified_img = Image.open(webp_upload)
        assert verified_img.format == "WEBP"
        assert verified_img.size == (100, 100)

    def test_to_webp_file_lowercase_heif(self):
        heif_data = _create_heif_bytes(80, 80)
        upload = SimpleUploadedFile("iphone_photo.heif", heif_data, content_type="image/heif")
        webp_upload = to_webp_file(upload)
        assert webp_upload.name == "iphone_photo.webp"
        assert webp_upload.content_type == "image/webp"

    def test_media_service_validation_heic_allowed(self):
        service = MediaService()
        heif_data = _create_heif_bytes(50, 50)
        upload_heic = SimpleUploadedFile("product_shot.heic", heif_data, content_type="image/heic")
        upload_heif = SimpleUploadedFile("product_shot.HEIF", heif_data, content_type="image/heif")

        # Must not raise
        service._validate_file(upload_heic, "image")
        service._validate_file(upload_heif, "image")

    def test_media_service_validation_mime_inference(self):
        service = MediaService()
        heif_data = _create_heif_bytes(50, 50)
        # Extensionless blob with MIME type
        blob_upload = SimpleUploadedFile("blob", heif_data, content_type="image/heic")
        service._validate_file(blob_upload, "image")

    def test_media_service_validation_rejects_unsupported(self):
        service = MediaService()
        upload_txt = SimpleUploadedFile("malicious.exe", b"binary", content_type="application/octet-stream")
        with pytest.raises(BusinessException, match="Unsupported image format"):
            service._validate_file(upload_txt, "image")

    def test_admin_direct_upload_heic(self):
        admin = User.objects.create_superuser(phone_number="09121112233", password="SecurePass123!")
        client = APIClient()
        client.force_authenticate(user=admin)

        heif_data = _create_heif_bytes(320, 240)
        upload = SimpleUploadedFile("IPHONE_PRODUCT.HEIC", heif_data, content_type="image/heic")

        resp = client.post("/api/admin/media_libm/upload/", {"file": upload}, format="multipart")
        assert resp.status_code == 201
        data = resp.json()
        assert data["url"].endswith(".webp")
        assert data["filename"].endswith(".webp")
        assert data["width"] == 320
        assert data["height"] == 240

    def test_ensure_webp_field_heic(self):
        class DummyInstance:
            class DummyFile:
                def __init__(self, name, content):
                    self.name = name
                    self.file = io.BytesIO(content)
                def save(self, name, content_file, save=False):
                    self.name = name
                    self.file = content_file

            def __init__(self, name, content):
                self.image = self.DummyFile(name, content)

        heif_data = _create_heif_bytes(100, 100)
        instance = DummyInstance("iphone_banner.heic", heif_data)
        ensure_webp_field(instance, "image")
        assert instance.image.name == "iphone_banner.webp"
        assert instance.image.file.name == "iphone_banner.webp"
