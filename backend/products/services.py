from .repositories import ProductRepository
from .selectors import ProductSelector
from .models import Product
from common.exceptions import BusinessException
from categories.selectors import CategorySelector

class ProductService:
    def create_product(self, data: dict) -> dict:
        slug = data.get("slug")
        if ProductSelector.get_product_by_slug(slug):
            raise BusinessException("A product with this slug already exists.")

        category_id = data.pop("category_id", None)
        category = None
        if category_id:
            category = CategorySelector.get_category_by_id(category_id)
        if not category:
            from categories.models import Category
            category = Category.objects.filter(deleted_at__isnull=True).first()
            if not category:
                category = Category.objects.create(name="پوشاک و مد", slug="fashion-clothing")
        data["category"] = category

        price = data.pop("price", None)
        discount_price = data.pop("discount_price", None)
        image_url = data.pop("image_url", None)
        collection_id = data.pop("collection_id", None)

        if "metadata" not in data or data["metadata"] is None:
            data["metadata"] = {}
        if price is not None:
            data["metadata"]["price"] = str(price)
        if discount_price is not None:
            data["metadata"]["discount_price"] = str(discount_price)
        if image_url:
            data["metadata"]["image_url"] = image_url
            data["metadata"]["imageUrl"] = image_url

        product = ProductRepository.create_product(**data)

        if collection_id:
            try:
                from store_collections.models import Collection
                col = Collection.objects.filter(id=collection_id).first()
                if col:
                    product.collections.add(col)
            except Exception:
                pass

        # Create default variant for inventory & pricing
        try:
            from variants.models import Variant
            from inventory.models import Inventory
            variant = Variant.objects.create(
                product=product,
                sku=f"{product.slug}-DEFAULT",
                price=price if price is not None else 0,
            )
            Inventory.objects.create(variant=variant, stock_quantity=25)
        except Exception:
            pass

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

        if "category_id" in data:
            cat_id = data.pop("category_id")
            if cat_id:
                category = CategorySelector.get_category_by_id(cat_id)
                if category:
                    data["category"] = category

        price = data.pop("price", None)
        discount_price = data.pop("discount_price", None)
        image_url = data.pop("image_url", None)
        collection_id = data.pop("collection_id", None)

        meta = product.metadata or {}
        if price is not None:
            meta["price"] = str(price)
        if discount_price is not None:
            meta["discount_price"] = str(discount_price)
        if image_url:
            meta["image_url"] = image_url
            meta["imageUrl"] = image_url
        data["metadata"] = meta

        if collection_id:
            try:
                from store_collections.models import Collection
                col = Collection.objects.filter(id=collection_id).first()
                if col:
                    product.collections.set([col])
            except Exception:
                pass

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
