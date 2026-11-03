import pytest
from common.exceptions import BusinessException
from products.services import ProductService
from products.selectors import ProductSelector
from .factories import ProductFactory
from categories.tests.factories import CategoryFactory


@pytest.mark.django_db
class TestProductService:
    def test_create_product(self):
        cat = CategoryFactory(name="Shirts", slug="shirts")
        service = ProductService()
        result = service.create_product(
            {
                "title": "Silk Blouse",
                "slug": "silk-blouse",
                "category_id": str(cat.id),
                "status": "draft",
            }
        )
        assert result["slug"] == "silk-blouse"
        assert result["category_id"] == str(cat.id)

    def test_duplicate_slug_raises(self):
        ProductFactory(slug="unique")
        service = ProductService()
        with pytest.raises(BusinessException):
            service.create_product(
                {
                    "title": "Copy",
                    "slug": "unique",
                    "category_id": str(CategoryFactory().id),
                }
            )

    def test_archive_product(self):
        product = ProductFactory()
        service = ProductService()
        service.archive_product(str(product.id))
        product.refresh_from_db()
        assert product.status == "archived"

    def test_get_visible_only_published(self):
        published = ProductFactory(status="published")
        draft = ProductFactory(status="draft")
        visible = ProductSelector.get_visible_products()
        assert published in visible
        assert draft not in visible

    def test_update_product_reorders_images_and_updates_cover(self):
        cat = CategoryFactory(name="Pants", slug="pants")
        service = ProductService()
        result = service.create_product(
            {
                "title": "Jeans",
                "slug": "mavi-jeans-demo",
                "category_id": str(cat.id),
                "status": "published",
                "images": ["https://cdn.example.com/img1.jpg", "https://cdn.example.com/img2.jpg"],
            }
        )
        prod_id = result["id"]

        from products.models import Product
        prod = Product.objects.get(id=prod_id)
        cover_before = prod.images.filter(is_cover=True).first()
        assert cover_before is not None
        assert cover_before.image_url == "https://cdn.example.com/img1.jpg"

        # Update product by setting img2 as primary / first in array
        service.update_product(
            prod_id,
            {
                "images": ["https://cdn.example.com/img2.jpg", "https://cdn.example.com/img1.jpg"],
                "image_url": "https://cdn.example.com/img2.jpg",
            },
        )

        prod.refresh_from_db()
        cover_after = prod.images.filter(is_cover=True).first()
        assert cover_after is not None
        assert cover_after.image_url == "https://cdn.example.com/img2.jpg"

        ordered_urls = list(prod.images.order_by("position").values_list("image_url", flat=True))
        assert ordered_urls == ["https://cdn.example.com/img2.jpg", "https://cdn.example.com/img1.jpg"]
        assert prod.metadata.get("images") == ["https://cdn.example.com/img2.jpg", "https://cdn.example.com/img1.jpg"]

    def test_update_product_discount_zero_clears_discount(self):
        cat = CategoryFactory()
        service = ProductService()
        result = service.create_product(
            {
                "title": "Jacket",
                "slug": "mavi-jacket-test",
                "category_id": str(cat.id),
                "price": 500000,
                "discount_percent": 20,
            }
        )
        prod_id = result["id"]
        from products.models import Product
        prod = Product.objects.get(id=prod_id)
        assert prod.discount_percent == 20
        assert prod.discount_price == 400000
        assert prod.discount_source == Product.DiscountSource.MANUAL

        # Now update with discount_percent = 0 to clear discount
        service.update_product(
            prod_id,
            {
                "discount_percent": 0,
            },
        )
        prod.refresh_from_db()
        assert prod.discount_percent is None
        assert prod.discount_price is None
        assert prod.discount_source is None
        assert "discount_percent" not in (prod.metadata or {})
        assert "discount_price" not in (prod.metadata or {})
