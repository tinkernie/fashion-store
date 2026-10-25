from django.db import transaction
from django.db import connection
from django.utils import timezone
from .repositories import ProductRepository
from .selectors import ProductSelector
from .models import Product
from common.exceptions import BusinessException
from categories.selectors import CategorySelector

SEQUENCE_NAME = "product_insta_id_seq"


def allocate_insta_id() -> int:
    """Next sequential public code. Postgres: DB-backed sequence survives
    concurrent admin creations; SQLite (dev/tests): max+1 under the unique
    constraint."""
    if connection.vendor == "postgresql":
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT nextval('{SEQUENCE_NAME}')")
            return int(cursor.fetchone()[0])
    with transaction.atomic():
        from django.db.models import Max

        last = Product.objects.aggregate(max_id=Max("insta_id"))["max_id"] or 0
        return last + 1


class ProductService:
    def create_product(self, data: dict) -> dict:
        from django.db import IntegrityError

        slug = data.get("slug")
        # Active-scope check (any status: drafts count too). Soft-deleted
        # slugs are reusable and pass this check.
        if slug and Product.objects.filter(slug=slug, deleted_at__isnull=True).exists():
            raise BusinessException("A product with this slug already exists.")

        category_id = data.pop("category_id", None)
        category = None
        if category_id:
            category = CategorySelector.get_category_by_id(category_id)
            if not category:
                raise BusinessException("Category not found for given category_id.")
        if not category:
            # Fallback only when no category_id supplied (legacy support)
            from categories.models import Category
            category = Category.objects.filter(deleted_at__isnull=True).first()
            if not category:
                category = Category.objects.create(name="پوشاک و مد", slug="fashion-clothing")
        data["category"] = category

        price = data.pop("price", None)
        discount_price = data.pop("discount_price", None)
        image_url = data.pop("image_url", None)
        images = data.pop("images", None)
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

        try:
            product = ProductRepository.create_product(**data)
        except IntegrityError:
            raise BusinessException("A product with this slug already exists.")

        if images and isinstance(images, list):
            self._save_product_images(product, images)

        if collection_id:
            try:
                from store_collections.models import Collection
                col = Collection.objects.filter(id=collection_id).first()
                if col:
                    product.collections.add(col)
            except Exception:
                pass

        # Common/price-basis variant ("{slug}-DEFAULT"). Placeholder only:
        # billing/fulfilment never runs through it, so it deliberately gets
        # NO Inventory row - real stock lives on the option variants created
        # afterwards (missing row = cart rejects with "Out of stock").
        try:
            from variants.models import Variant
            # Use product weight if provided, else default 1g per spec
            variant_weight = data.get("weight", 1) if isinstance(data.get("weight"), int) else 1
            # Also check product instance weight
            if hasattr(product, "weight") and product.weight:
                variant_weight = product.weight
            Variant.objects.create(
                product=product,
                sku=f"{product.slug}-DEFAULT",
                price=price if price is not None else 0,
                weight=variant_weight,
                status=Variant.Status.PUBLISHED,
                availability=Variant.Availability.IN_STOCK,
            )
        except Exception:
            pass

        # Invalidate product list caches
        try:
            from django.core.cache import cache
            cache.delete_pattern("luxe:products:*")
        except Exception:
            pass
        return self._serialize(product)

    def update_product(self, product_id, data: dict) -> dict:
        product = ProductSelector.get_product_by_id(product_id)
        if not product:
            raise BusinessException("Product not found.")
        # Check slug uniqueness if changed (any active status; deleted reusable)
        from django.db import IntegrityError

        new_slug = data.get("slug")
        if new_slug and new_slug != product.slug:
            existing = Product.objects.filter(slug=new_slug, deleted_at__isnull=True).exclude(id=product.id).first()
            if existing:
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
        images = data.pop("images", None)
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

        try:
            updated = ProductRepository.update_product(product, **data)
        except IntegrityError:
            raise BusinessException("A product with this slug already exists.")

        if price is not None:
            # Keep the storefront price in sync: the product-managed DEFAULT
            # variant carries the selling price (serializers read variant
            # price first). Per-variant pricing stays editable via the
            # variant endpoints; only the DEFAULT variant follows here.
            try:
                from variants.models import Variant as _Variant

                # The DEFAULT variant was keyed by the slug at creation time;
                # match old and new slugs in case both changed at once.
                candidate_skus = {f"{updated.slug}-DEFAULT"}
                if new_slug:
                    candidate_skus.add(f"{new_slug}-DEFAULT")
                if product.slug:
                    candidate_skus.add(f"{product.slug}-DEFAULT")
                default_variant = _Variant.objects.filter(
                    product=updated,
                    sku__in=list(candidate_skus),
                    deleted_at__isnull=True,
                ).first()
                if default_variant is not None:
                    default_variant.price = price
                    default_variant.save(update_fields=["price", "updated_at"])
            except Exception:
                pass

        if images is not None and isinstance(images, list):
            self._save_product_images(updated, images)

        try:
            from django.core.cache import cache
            cache.delete_pattern("luxe:products:*")
            cache.delete_pattern("luxe:categories:*")
        except Exception:
            pass
        return self._serialize(updated)

    def _save_product_images(self, product, images: list):
        from .models import ProductImage
        product.images.all().delete()
        if not images:
            return

        parsed = []
        has_cover = False
        for idx, img_item in enumerate(images):
            if isinstance(img_item, dict):
                img_url = img_item.get("url") or img_item.get("image_url") or ""
                pos = img_item.get("position", idx)
                is_cov = bool(img_item.get("is_cover", False))
                alt = img_item.get("alt_text", "")
            else:
                img_url = str(img_item).strip() if img_item else ""
                pos = idx
                is_cov = (idx == 0)
                alt = ""
            if not img_url:
                continue
            if is_cov:
                has_cover = True
            parsed.append({
                "image_url": img_url,
                "position": pos,
                "is_cover": is_cov,
                "alt_text": alt,
            })

        if parsed and not has_cover:
            parsed[0]["is_cover"] = True

        for p_img in parsed:
            ProductImage.objects.create(
                product=product,
                image_url=p_img["image_url"],
                position=p_img["position"],
                is_cover=p_img["is_cover"],
                alt_text=p_img["alt_text"],
            )

    @staticmethod
    def _purge_campaign_caches() -> None:
        """Purge product-list caches after campaign mutations.

        NOTE: deliberately NOT cache.clear() — sessions live in the default
        cache backend, so a full flush would log out every user. Instead we
        purge the product rails plus Django's view-level cache entries
        (cache_page stores under views.decorators.cache.*).
        """
        try:
            from django.core.cache import cache
            cache.delete_pattern("luxe:products:*")
            cache.delete_pattern("views.decorators.cache.*")
        except Exception:
            pass

    @classmethod
    def apply_collection_discount(
        cls, products: list, discount_percent: int, expires_at=None, collection_id=None
    ) -> None:
        """Collection-owned discount writer (rate = one batch, owner-entered
        expiry). Provenance is stamped so collection discounts can be reverted
        surgically and can never mix with campaign discounts."""
        cls._apply_percent_to_products(
            products,
            discount_percent,
            expires_at,
            source=Product.DiscountSource.COLLECTION,
            collection_id=collection_id,
        )
        cls._purge_campaign_caches()

    @classmethod
    def clear_collection_discounts(cls, collection_id) -> int:
        """Reverts every discount owned by the given collection."""
        rows = list(
            Product.objects.filter(
                deleted_at__isnull=True,
                discount_source=Product.DiscountSource.COLLECTION,
                discount_collection_id=collection_id,
                discount_percent__isnull=False,
            )
        )
        for product in rows:
            product.clear_discount()
        if rows:
            cls._purge_campaign_caches()
        return len(rows)

    @staticmethod
    def _base_price(product: Product) -> int:
        """Single source of truth for discount calculation (matches serializer)."""
        try:
            variant = product.variants.filter(deleted_at__isnull=True, price__gt=0).first()
            if not variant:
                variant = product.variants.filter(deleted_at__isnull=True).first()
            if variant and variant.price is not None and float(variant.price) > 0:
                return int(round(float(variant.price)))
        except Exception:
            pass
        try:
            if product.metadata and "price" in product.metadata:
                val = float(product.metadata["price"])
                if val > 0:
                    return int(round(val))
        except Exception:
            pass
        return 0

    @transaction.atomic
    def activate_discount_section(
        self, product_ids: list, discount_percent: int, expires_at=None
    ) -> dict:
        """Bulk campaign: one percentage applied to all selected products at once."""
        if not isinstance(discount_percent, int) or not 1 <= discount_percent <= 99:
            raise BusinessException("Discount must be an integer between 1 and 99.")
        if not product_ids:
            raise BusinessException("Select at least one product.")
        # Deduplicate while preserving order
        seen, unique_ids = set(), []
        for pid in product_ids:
            key = str(pid)
            if key not in seen:
                seen.add(key)
                unique_ids.append(pid)

        products = list(
            Product.objects.select_for_update().filter(
                id__in=unique_ids, deleted_at__isnull=True
            )
        )
        found = {str(p.id) for p in products}
        missing = [str(pid) for pid in unique_ids if str(pid) not in found]
        if missing:
            raise BusinessException(f"Products not found: {', '.join(missing)}.")

        # Add/overwrite semantics: activate never clears products outside the
        # given set, so re-activating can never silently drop campaign items.
        # Full removal is explicit via remove-one / deactivate endpoints.
        blocked = self._filter_collection_conflicts(products)
        if blocked:
            raise BusinessException(
                "These products have active collection discounts; remove the "
                "discount via the collection first: " + ", ".join(str(b) for b in blocked)
            )
        self._apply_percent_to_products(products, discount_percent, expires_at)

        self._purge_campaign_caches()
        return {
            "message": f"Discount of {discount_percent}% applied to {len(products)} products.",
            "discount_percent": discount_percent,
            "product_ids": [str(p.id) for p in products],
            "expires_at": expires_at.isoformat() if expires_at else None,
        }

    @staticmethod
    def _filter_collection_conflicts(products: list) -> list:
        """Direction guard (Campaign ⇱ Collection): returns ids of products
        whose current discount belongs to a collection."""
        return [
            p.id
            for p in products
            if p.has_active_collection_discount
        ]
    @classmethod
    def _apply_percent_to_products(
        cls,
        products: list,
        discount_percent: int,
        expires_at=None,
        source: str = Product.DiscountSource.CAMPAIGN,
        collection_id=None,
    ) -> None:
        """Shared bulk writer: one percentage for many products (no per-product calls).
        Stamps provenance so campaign/collection discounts never mix."""
        for product in products:
            base = cls._base_price(product)
            product.discount_percent = discount_percent
            product.discount_price = product.calculate_discount_price(base)
            product.discount_expires_at = expires_at
            product.discount_source = source
            product.discount_collection_id = collection_id
            meta = dict(product.metadata) if product.metadata else {}
            meta["discount_percent"] = discount_percent
            meta["discount_source"] = source
            if product.discount_price:
                meta["discount_price"] = str(int(product.discount_price))
            product.metadata = meta
            product.save(
                update_fields=[
                    "discount_percent", "discount_price", "discount_expires_at",
                    "discount_source", "discount_collection_id",
                    "metadata", "updated_at",
                ]
            )

    @staticmethod
    def _current_campaign_percent():
        """Returns int or None (Optional[] avoided for py3.9 compat in signature)."""
        """The running campaign's percentage (all campaign items share one)."""
        row = (
            Product.objects.filter(
                deleted_at__isnull=True, discount_percent__isnull=False
            )
            .exclude(discount_source=Product.DiscountSource.COLLECTION)
            .values_list("discount_percent", flat=True)
            .first()
        )
        return row

    @transaction.atomic
    def add_product_to_section(self, product_id, discount_percent: int = None) -> dict:
        """Incremental add: one product joins the running campaign (no full re-select)."""
        product = Product.objects.select_for_update().filter(
            id=product_id, deleted_at__isnull=True
        ).first()
        if not product:
            raise BusinessException("Product not found.")
        campaign_expires_at = None
        if discount_percent is None:
            discount_percent = self._current_campaign_percent()
            if discount_percent is None:
                raise BusinessException(
                    "No active campaign: pass discount_percent for the first product."
                )
            # New joiners inherit the running campaign's deadline
            campaign_expires_at = (
                Product.objects.filter(
                    deleted_at__isnull=True, discount_percent__isnull=False
                )
                .exclude(discount_expires_at__isnull=True)
                .exclude(discount_source=Product.DiscountSource.COLLECTION)
                .values_list("discount_expires_at", flat=True)
                .first()
            )
        if not isinstance(discount_percent, int) or not 1 <= discount_percent <= 99:
            raise BusinessException("Discount must be an integer between 1 and 99.")
        if product.has_active_collection_discount:
            raise BusinessException(
                "This product has an active collection discount; remove the "
                "discount via the collection first."
            )
        self._apply_percent_to_products([product], discount_percent, campaign_expires_at)
        self._purge_campaign_caches()
        return {
            "message": f"Product added to discount section at {discount_percent}%.",
            "product_id": str(product.id),
            "discount_percent": discount_percent,
        }

    @transaction.atomic
    def remove_product_from_section(self, product_id) -> dict:
        """Incremental remove: one product leaves the campaign (stays on the site)."""
        product = Product.objects.select_for_update().filter(
            id=product_id, deleted_at__isnull=True
        ).first()
        if not product:
            raise BusinessException("Product not found.")
        product.discount_percent = None
        product.discount_price = None
        product.discount_expires_at = None
        product.discount_source = None
        product.discount_collection_id = None
        meta = dict(product.metadata) if product.metadata else {}
        meta.pop("discount_percent", None)
        meta.pop("discount_price", None)
        meta.pop("discount_source", None)
        product.metadata = meta
        product.save(
            update_fields=[
                "discount_percent", "discount_price", "discount_expires_at",
                "discount_source", "discount_collection_id",
                "metadata", "updated_at",
            ]
        )
        self._purge_campaign_caches()
        return {"message": "Product removed from discount section.", "product_id": str(product.id)}

    _KEEP_DEADLINE = object()

    @transaction.atomic
    def set_section_percent(
        self, discount_percent: int, product_ids: list = None, expires_at=_KEEP_DEADLINE
    ) -> dict:
        """Mid-campaign adjust: raise/lower the percentage for all (or given)
        campaign items. Pass expires_at (or null to clear it) to also move the
        deadline; omit it to preserve existing deadlines."""
        if not isinstance(discount_percent, int) or not 1 <= discount_percent <= 99:
            raise BusinessException("Discount must be an integer between 1 and 99.")
        qs = (
            Product.objects.select_for_update()
            .filter(deleted_at__isnull=True, discount_percent__isnull=False)
            .exclude(discount_source=Product.DiscountSource.COLLECTION)
        )
        if product_ids:
            qs = qs.filter(id__in=product_ids)
        products = list(qs)
        if not products:
            raise BusinessException("No discounted products to update.")
        update_fields = [
            "discount_percent", "discount_price", "discount_source", "updated_at"
        ]
        if expires_at is not self._KEEP_DEADLINE:
            update_fields.append("discount_expires_at")
        for product in products:
            base = self._base_price(product)
            product.discount_percent = discount_percent
            product.discount_price = product.calculate_discount_price(base)
            product.discount_source = Product.DiscountSource.CAMPAIGN
            if expires_at is not self._KEEP_DEADLINE:
                product.discount_expires_at = expires_at
            product.save(update_fields=update_fields)
        self._purge_campaign_caches()
        return {
            "message": f"Discount set to {discount_percent}% on {len(products)} products.",
            "discount_percent": discount_percent,
            "product_ids": [str(p.id) for p in products],
            "expires_at": (
                expires_at.isoformat()
                if expires_at not in (None, self._KEEP_DEADLINE)
                else None
            ),
        }

    @transaction.atomic
    def deactivate_discount_section(self) -> dict:
        """Bulk revert: clear discounts on every campaign-owned discounted product
        (prices restore automatically). Collection-owned discounts are untouched."""
        qs = (
            Product.objects.select_for_update()
            .filter(deleted_at__isnull=True, discount_percent__isnull=False)
            .exclude(discount_source=Product.DiscountSource.COLLECTION)
        )
        count = qs.count()
        qs.update(
            discount_percent=None,
            discount_price=None,
            discount_expires_at=None,
            discount_source=None,
            discount_collection_id=None,
            updated_at=timezone.now(),
        )
        self._purge_campaign_caches()
        return {"message": f"Discount removed from {count} products.", "cleared_count": count}

    def archive_product(self, product_id) -> dict:
        product = ProductSelector.get_product_by_id(product_id)
        if not product:
            raise BusinessException("Product not found.")
        product.status = Product.Status.ARCHIVED
        product.save(update_fields=["status", "updated_at"])
        try:
            from django.core.cache import cache
            cache.delete_pattern("luxe:products:*")
        except Exception:
            pass
        return {"message": f"Product '{product.title}' archived."}

    def delete_product(self, product_id) -> dict:
        product = ProductSelector.get_product_by_id(product_id)
        if not product:
            raise BusinessException("Product not found.")
        ProductRepository.soft_delete_product(product)
        try:
            from django.core.cache import cache
            cache.delete_pattern("luxe:products:*")
        except Exception:
            pass
        return {"message": f"Product '{product.title}' deleted."}

    def _serialize(self, product: Product) -> dict:
        from media_libm.selectors import MediaSelector
        image = MediaSelector.get_main_image_for_product(product)
        from .serializers import ProductImageSerializer
        images_data = []
        if hasattr(product, "images"):
            imgs = product.images.filter(deleted_at__isnull=True).order_by("position")
            if imgs.exists():
                images_data = ProductImageSerializer(imgs, many=True).data
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
            'images': images_data,
            "collections": [
                {"id": str(c.id), "slug": c.slug, "name": c.name}
                for c in product.collections.all()
            ],
        }


def invalidate_related_caches(product_id) -> None:
    """Clear every cached related/suggested variant for a product, including
    legacy key shapes from before the manual/auto split."""
    try:
        from django.core.cache import cache

        for lim in range(1, 13):
            cache.delete(f"suggested:{product_id}:{lim}:manual")
            cache.delete(f"suggested:{product_id}:{lim}:auto")
            cache.delete(f"suggested:{product_id}:{lim}")
            cache.delete(f"related:{product_id}:{lim}")
    except Exception:
        pass


class RelatedProductService:
    """Admin-driven related-products rail (max 8, relation_type=suggested).

    The storefront shows exactly what is stored — nothing is auto-added
    behind the scenes. The admin explicitly triggers auto-fill, which
    persists system picks into the remaining empty slots.
    """

    MAX_RELATED = 8

    @transaction.atomic
    def auto_fill(self, product_id, limit: int = MAX_RELATED) -> dict:
        from .models import RelatedProduct

        limit = min(max(int(limit or self.MAX_RELATED), 1), self.MAX_RELATED)
        product = ProductSelector.get_product_by_id(product_id)
        if not product:
            raise BusinessException("Product not found.")

        existing = list(
            RelatedProduct.objects.filter(
                source_product=product,
                relation_type=RelatedProduct.RelationType.SUGGESTED,
            ).order_by("position", "-created_at")
        )
        existing_ids = {rel.target_product_id for rel in existing}
        needed = limit - len(existing)
        filled = []
        if needed > 0:
            candidates = ProductSelector.get_auto_candidates(
                product,
                exclude_ids=existing_ids | {product.id},
                limit=needed,
            )
            start = max([rel.position for rel in existing], default=-1) + 1
            to_create = [
                RelatedProduct(
                    source_product=product,
                    target_product=cand,
                    relation_type=RelatedProduct.RelationType.SUGGESTED,
                    position=start + idx,
                )
                for idx, cand in enumerate(candidates[:needed])
            ]
            if to_create:
                RelatedProduct.objects.bulk_create(to_create)
                filled = [str(c.target_product_id) for c in to_create]

        invalidate_related_caches(product.id)

        rows = list(
            RelatedProduct.objects.filter(
                source_product=product,
                relation_type=RelatedProduct.RelationType.SUGGESTED,
            )
            .select_related("target_product")
            .order_by("position", "-created_at")[:limit]
        )
        return {
            "filled": len(filled),
            "total": len(rows),
            "limit": limit,
            "auto_filled_ids": filled,
            "target_ids": [str(r.target_product_id) for r in rows],
            "message": (
                f"Auto-filled {len(filled)} related product(s)."
                if filled
                else "Related rail already full — nothing to auto-fill."
            ),
        }

def variant_effective_price(variant):
    """Unit price carts/checkout must charge for this variant: the product's
    discounted price while any discount (campaign or collection) is active,
    the variant's base price otherwise (e.g. after discount expiry)."""
    from decimal import Decimal as _Decimal

    product = getattr(variant, "product", None)
    if product is not None and product.is_discount_active and product.discount_price:
        return _Decimal(str(product.discount_price))
    return _Decimal(str(variant.price))

def cleanup_expired_discounts() -> dict:
    """Nulls discount rows (campaign and collection alike) whose owner-entered
    expiry date has passed. Pricing already ignores them via is_discount_active
    (date-aware); this keeps the stored data clean instead of letting stale
    numbers linger in the database."""
    from datetime import timedelta

    cutoff = timezone.now() - timedelta(seconds=60)
    rows = list(
        Product.objects.filter(
            deleted_at__isnull=True,
            discount_percent__isnull=False,
            discount_expires_at__isnull=False,
            discount_expires_at__lt=cutoff,
        )
    )
    for product in rows:
        product.clear_discount()
    if rows:
        ProductService._purge_campaign_caches()
    return {"cleared": len(rows)}
