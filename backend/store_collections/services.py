from django.db import transaction
from .repositories import CollectionRepository
from .selectors import CollectionSelector
from common.exceptions import BusinessException


class CollectionService:
    def create_collection(self, data: dict) -> dict:
        slug = data.get("slug")
        if CollectionSelector.get_collection_by_slug(slug):  # check active only
            raise BusinessException("A collection with this slug already exists.")
        from django.db import IntegrityError

        try:
            collection = CollectionRepository.create_collection(**data)
        except IntegrityError:
            raise BusinessException("A collection with this slug already exists.")
        return self._serialize(collection)

    def update_collection(self, collection_id, data: dict) -> dict:
        collection = CollectionSelector.get_collection_by_id(collection_id)
        if not collection:
            raise BusinessException("Collection not found.")
        from django.db import IntegrityError as _IE

        # Owner-driven deactivation reverts every discount this collection owns.
        deactivating = (
            "is_active" in data
            and data["is_active"] is False
            and collection.is_active
        )
        try:
            with transaction.atomic():
                updated = CollectionRepository.update_collection(collection, **data)
                if deactivating:
                    from products.services import ProductService

                    reverted = ProductService.clear_collection_discounts(collection.id)
        except _IE:
            raise BusinessException("A collection with this slug already exists.")
        result = self._serialize(updated)
        if deactivating:
            result["reverted_discounts"] = reverted
        return result

    def delete_collection(self, collection_id) -> dict:
        from .models import Collection
        collection = Collection.all_objects.filter(id=collection_id).first()
        if not collection:
            raise BusinessException("Collection not found.")
        with transaction.atomic():
            from products.services import ProductService

            ProductService.clear_collection_discounts(collection.id)
            CollectionRepository.hard_delete_collection(collection)
        return {"message": f"Collection '{collection.name}' deleted."}

    def set_product_positions(self, collection_id, product_positions: list) -> dict:
        collection = CollectionSelector.get_collection_by_id(collection_id)
        if not collection:
            raise BusinessException("Collection not found.")
        CollectionRepository.set_product_positions(collection, product_positions)
        return {"message": "Product positions updated."}

    def add_product(self, collection_id, product_id, position: int = 0) -> dict:
        collection = CollectionSelector.get_collection_by_id(collection_id)
        if not collection:
            raise BusinessException("Collection not found.")
        CollectionRepository.add_product(collection, product_id, position)
        return {"message": "Product added to collection."}

    def remove_product(self, collection_id, product_id) -> dict:
        from products.models import Product

        collection = CollectionSelector.get_collection_by_id(collection_id)
        if not collection:
            raise BusinessException("Collection not found.")
        with transaction.atomic():
            product = (
                Product.objects.select_for_update()
                .filter(id=product_id, deleted_at__isnull=True)
                .first()
            )
            # Single-product removal also reverts the discount this collection owns.
            owned_here = False
            if product and product.discount_source == Product.DiscountSource.COLLECTION:
                owned_here = str(product.discount_collection_id) == str(collection.id)
                if owned_here:
                    product.clear_discount()
            CollectionRepository.remove_product(collection, product_id)
        message = "Product removed from collection."
        if owned_here:
            message += " Its collection discount was reverted."
        return {"message": message}

    def batch_add_products(
        self, collection_id, product_ids, discount_percent: int,
        expires_at=None, position: int = 0,
    ) -> dict:
        """Owner batch modal: link many products and (optionally) apply ONE
        collection discount percentage with an owner-entered expiry date.

        - percent > 0: stamps discount + provenance (source=collection,
          collection_id=this collection); re-adding applies last-write-wins.
        - percent == 0: clears only discounts owned by THIS collection.
        - Campaign conflict (active campaign discount) => the whole batch is
          rejected with the conflicting product ids; two systems never mix."""
        from products.models import Product
        from products.services import ProductService

        collection = CollectionSelector.get_collection_by_id(collection_id)
        if not collection:
            raise BusinessException("Collection not found.")

        seen, unique_ids = set(), []
        for pid in product_ids:
            key = str(pid)
            if key not in seen:
                seen.add(key)
                unique_ids.append(pid)

        with transaction.atomic():
            products = list(
                Product.objects.select_for_update().filter(
                    id__in=unique_ids, deleted_at__isnull=True
                )
            )
            found = {str(p.id) for p in products}
            missing = [str(pid) for pid in unique_ids if str(pid) not in found]
            if missing:
                raise BusinessException(f"Products not found: {', '.join(missing)}.")

            # Legacy rows (pre-migration) have source None but behave like
            # campaign discounts, so they are treated as campaign-owned here.
            campaign_conflicts = [
                str(p.id)
                for p in products
                if discount_percent > 0
                and p.is_discount_active
                and p.discount_source != Product.DiscountSource.COLLECTION
            ]

            if campaign_conflicts:
                raise BusinessException(
                    "These products have active Discount Campaign discounts; "
                    "remove them from the campaign first: "
                    + ", ".join(campaign_conflicts)
                )

            items_report = []
            cleared = 0
            discounted = []
            for product in products:
                CollectionRepository.add_product(collection, product.id, position)
                if discount_percent > 0:
                    previous = (
                        product.discount_percent
                        if product.discount_source == Product.DiscountSource.COLLECTION
                        and str(product.discount_collection_id) == str(collection.id)
                        else None
                    )
                    discounted.append(product)
                    items_report.append({
                        "product_id": str(product.id),
                        "previous_percent": previous,
                        "applied_percent": discount_percent,
                    })
                else:
                    owned_here = (
                        product.discount_source == Product.DiscountSource.COLLECTION
                        and str(product.discount_collection_id) == str(collection.id)
                    )
                    if owned_here:
                        product.clear_discount()
                        cleared += 1

            if discounted:
                from products.services import ProductService

                ProductService.apply_collection_discount(
                    discounted, discount_percent, expires_at, collection_id=collection.id
                )

        return {
            "message": (
                f"{len(items_report)} product(s) discounted and added to collection."
                if items_report
                else f"{len(products)} product(s) added to collection."
            ),
            "collection_id": str(collection.id),
            "discount_percent": discount_percent,
            "expires_at": expires_at.isoformat() if expires_at else None,
            "discounted_count": len(items_report),
            "cleared_discounts": cleared,
            "items": items_report,
        }

    def _serialize(self, collection) -> dict:
        return {
            "id": str(collection.id),
            "name": collection.name,
            "slug": collection.slug,
            "description": collection.description,
            "hero_banner": (
                collection.hero_banner.url if collection.hero_banner else None
            ),
            "landing_page_content": collection.landing_page_content,
            "seo_metadata": collection.seo_metadata,
            "priority": collection.priority,
            "is_active": collection.is_active,
            "published_from": collection.published_from,
            "published_until": collection.published_until,
        }
