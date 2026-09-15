import pytest
from products.models import Product, ProductImage
from products.services import ProductService
from products.selectors import ProductSelector
from products.serializers import ProductDetailSerializer
from categories.models import Category


@pytest.mark.django_db
class TestProductImages:
    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.category = Category.objects.create(name="تست دسته‌بندی", slug="test-cat")
        self.service = ProductService()

    def test_create_product_with_multiple_images(self):
        data = {
            "title": "مانتو کتی شیک",
            "slug": "manto-kati-shik",
            "category_id": str(self.category.id),
            "price": 250000,
            "images": [
                "https://images.unsplash.com/photo-1",
                "https://images.unsplash.com/photo-2",
                "https://images.unsplash.com/photo-3",
            ],
            "status": "published",
        }
        res = self.service.create_product(data)
        assert res["title"] == "مانتو کتی شیک"

        product = ProductSelector.get_product_by_slug("manto-kati-shik")
        assert product is not None
        assert product.images.count() == 3

        first_img = product.images.filter(position=0).first()
        assert first_img.is_cover is True
        assert first_img.image_url == "https://images.unsplash.com/photo-1"

        second_img = product.images.filter(position=1).first()
        assert second_img.is_cover is False
        assert second_img.image_url == "https://images.unsplash.com/photo-2"

        # Serializer checks
        serialized = ProductDetailSerializer(product).data
        assert len(serialized["images"]) == 3
        assert serialized["imageUrl"] == "https://images.unsplash.com/photo-1"

    def test_update_product_reorder_and_change_cover(self):
        product = Product.objects.create(
            title="شلوار بگ",
            slug="shalvar-bag",
            category=self.category,
            status=Product.Status.PUBLISHED,
        )
        ProductImage.objects.create(
            product=product,
            image_url="https://images.unsplash.com/old-1",
            position=0,
            is_cover=True,
        )

        update_payload = {
            "images": [
                {
                    "url": "https://images.unsplash.com/new-1",
                    "position": 0,
                    "is_cover": False,
                },
                {
                    "url": "https://images.unsplash.com/new-2",
                    "position": 1,
                    "is_cover": True,
                },
            ]
        }
        self.service.update_product(str(product.id), update_payload)

        product.refresh_from_db()
        imgs = list(product.images.order_by("position"))
        assert len(imgs) == 2
        assert imgs[0].image_url == "https://images.unsplash.com/new-1"
        assert imgs[0].is_cover is False
        assert imgs[1].image_url == "https://images.unsplash.com/new-2"
        assert imgs[1].is_cover is True

        # Serializer should use is_cover=True image as main imageUrl
        serialized = ProductDetailSerializer(product).data
        assert serialized["imageUrl"] == "https://images.unsplash.com/new-2"
