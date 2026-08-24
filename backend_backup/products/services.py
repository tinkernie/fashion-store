from .repositories import ProductRepository
from .selectors import ProductSelector
from .models import Product
from common.exceptions import BusinessException


class ProductService:
    def create_product(self, data: dict) -> dict:
        slug = data.get("slug")
        if ProductSelector.get_product_by_slug(slug):
            raise BusinessException("A product with this slug already exists.")
        # Validate category is active? Admin may assign any category.
        product = ProductRepository.create_product(**data)
        return self._serialize(product)

    def update_product(self, product_id, data: dict) -> dict:
        product = ProductSelector.get_product_by_id(product_id)
        if not product:
            raise BusinessException("Product not found.")
        # Check slug uniqueness if changed
        new_slug = data.get("slug")
        if new_slug and new_slug != product.slug:
            existing = ProductSelector.get_product_by_slug(new_slug)
            if existing and existing.id != product.id:
                raise BusinessException("A product with this slug already exists.")
        updated = ProductRepository.update_product(product, **data)
        return self._serialize(updated)

    def archive_product(self, product_id) -> dict:
        product = ProductSelector.get_product_by_id(product_id)
        if not product:
            raise BusinessException("Product not found.")
        product.status = Product.Status.ARCHIVED
        product.save(update_fields=["status", "updated_at"])
        # Optionally soft delete as well
        return {"message": f"Product '{product.title}' archived."}

    def delete_product(self, product_id) -> dict:
        product = ProductSelector.get_product_by_id(product_id)
        if not product:
            raise BusinessException("Product not found.")
        ProductRepository.soft_delete_product(product)
        return {"message": f"Product '{product.title}' deleted."}

    def _serialize(self, product: Product) -> dict:
        from media_libm.selectors import MediaSelector
        image = MediaSelector.get_main_image_for_product(product)
        return {
            "id": str(product.id),
            "title": product.title,
            "slug": product.slug,
            "description": product.description,
            "category_id": str(product.category_id),
            "category_name": product.category.name if product.category else None,
            "status": product.status,
            "seo_metadata": product.seo_metadata,
            "metadata": product.metadata,
            'image': image,
            "collections": [
                {"id": str(c.id), "slug": c.slug, "name": c.name}
                for c in product.collections.all()
            ],
        }
