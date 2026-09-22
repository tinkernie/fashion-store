from django.db.models import Q, Prefetch, Avg, Count, Min, Max
from .models import Product, RelatedProduct


class ProductSelector:
    @staticmethod
    def _annotate_reviews(qs):
        """Annotate approved, non-deleted review stats to avoid N+1."""
        return qs.annotate(
            annotated_avg_rating=Avg(
                "reviews__rating",
                filter=Q(reviews__status="approved", reviews__deleted_at__isnull=True),
            ),
            annotated_reviews_count=Count(
                "reviews",
                filter=Q(reviews__status="approved", reviews__deleted_at__isnull=True),
            ),
        )

    @staticmethod
    def _apply_common_filters(qs, filters: dict, is_admin: bool = False):
        """Apply status, has_discount, category, search, ordering per BACKEND_PRODUCT_FILTERS_SPEC."""
        if not filters:
            filters = {}

        # Status handling
        status = filters.get("status")
        if status and status != "all":
            # Only allow valid choices
            if status in [c[0] for c in Product.Status.choices] or status == "published":
                qs = qs.filter(status=status)
        elif not is_admin:
            qs = qs.filter(status=Product.Status.PUBLISHED)

        # has_discount filter
        has_discount = filters.get("has_discount")
        if has_discount in ["true", "1", True, "True", "TRUE"]:
            qs = qs.filter(Q(discount_price__isnull=False) & Q(discount_price__gt=0))
        elif has_discount in ["false", "0", False]:
            qs = qs.filter(Q(discount_price__isnull=True) | Q(discount_price=0))

        # Category filter - supports slug or ID
        category = filters.get("category") or filters.get("category_slug")
        if category:
            # Try as UUID first, then slug
            try:
                import uuid

                uuid.UUID(str(category))
                # It's a UUID, filter by id
                qs = qs.filter(category__id=category)
            except Exception:
                qs = qs.filter(category__slug=category)

        if "collection_slug" in filters and filters["collection_slug"]:
            qs = qs.filter(collections__slug=filters["collection_slug"])

        if "search" in filters and filters["search"]:
            search = filters["search"]
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(slug__icontains=search)
                | Q(variants__sku__icontains=search)
            )

        # Ordering
        ordering = filters.get("ordering")
        allowed_orderings = {
            "newest": "-created_at",
            "-created_at": "-created_at",
            "oldest": "created_at",
            "created_at": "created_at",
            "price_asc": "price",
            "price": "price",
            "price_desc": "-price",
            "-price": "-price",
        }
        if ordering in allowed_orderings:
            order_val = allowed_orderings[ordering]
            if "price" in order_val:
                # Annotate min_price for price ordering
                qs = qs.annotate(
                    min_price_ord=Min(
                        "variants__price",
                        filter=Q(variants__deleted_at__isnull=True),
                    )
                )
                # Fallback to metadata price if no variants
                if order_val == "price":
                    qs = qs.order_by("min_price_ord")
                else:
                    qs = qs.order_by("-min_price_ord")
            else:
                qs = qs.order_by(order_val)
        else:
            qs = qs.order_by("-created_at")

        return qs

    @staticmethod
    def get_visible_products(filters: dict = None) -> list[Product]:
        """Return published, non‑deleted products with active category."""
        qs = (
            Product.objects.filter(
                deleted_at__isnull=True,
                category__is_active=True,  # ensure category is visible
            )
            .select_related("category")
            .prefetch_related("collections", "images")
        )
        # Apply common filters with is_admin=False to enforce published default
        qs = ProductSelector._apply_common_filters(qs, filters, is_admin=False)
        qs = ProductSelector._annotate_reviews(qs)
        return qs.distinct()

    @staticmethod
    def get_product_by_slug(slug: str) -> Product or None:
        qs = (
            Product.objects.filter(
                slug=slug,
                status=Product.Status.PUBLISHED,
                deleted_at__isnull=True,
                category__is_active=True,
            )
            .select_related("category")
            .prefetch_related("collections", "images")
        )
        qs = ProductSelector._annotate_reviews(qs)
        return qs.first()

    @staticmethod
    def get_product_by_id(product_id) -> Product or None:
        qs = (
            Product.objects.filter(id=product_id, deleted_at__isnull=True)
            .select_related("category")
            .prefetch_related("collections", "images")
        )
        qs = ProductSelector._annotate_reviews(qs)
        return qs.first()

    @staticmethod
    def get_all_products_admin(filters: dict = None) -> list[Product]:
        qs = (
            Product.objects.filter(deleted_at__isnull=True)
            .select_related("category")
            .prefetch_related("collections", "images")
        )
        qs = ProductSelector._apply_common_filters(qs, filters, is_admin=True)
        qs = ProductSelector._annotate_reviews(qs)
        return qs.distinct()

    @staticmethod
    def get_related_products(product, limit: int = 4) -> list[Product]:
        """Hybrid related products: manual pins first, then auto fallback by collection/category."""
        # Manual pins
        pinned = (
            RelatedProduct.objects.filter(
                source_product=product,
                target_product__status=Product.Status.PUBLISHED,
                target_product__deleted_at__isnull=True,
            )
            .select_related("target_product", "target_product__category")
            .order_by("position", "-created_at")
        )
        results = []
        seen_ids = {product.id}
        for rel in pinned:
            target = rel.target_product
            if target.id not in seen_ids:
                seen_ids.add(target.id)
                # Attach flag for serializer
                target.is_manual_pin = True
                results.append(target)
            if len(results) >= limit:
                return results

        needed = limit - len(results)
        if needed > 0:
            fallback_qs = (
                Product.objects.filter(
                    status=Product.Status.PUBLISHED,
                    deleted_at__isnull=True,
                )
                .exclude(id__in=seen_ids)
                .select_related("category")
                .prefetch_related("collections", "images")
            )
            # Re-annotate reviews for serialized cards
            fallback_qs = ProductSelector._annotate_reviews(fallback_qs)

            # Preference A: same collection
            collection_ids = list(product.collections.values_list("id", flat=True))
            if collection_ids:
                col_matches = list(
                    fallback_qs.filter(collections__in=collection_ids).distinct()[:needed]
                )
                for item in col_matches:
                    if item.id not in seen_ids:
                        seen_ids.add(item.id)
                        item.is_manual_pin = False
                        results.append(item)
                        if len(results) >= limit:
                            return results[:limit]

            # Preference B: same category
            still_needed = limit - len(results)
            if still_needed > 0 and product.category:
                cat_matches = list(
                    fallback_qs.filter(category=product.category).exclude(id__in=seen_ids)[:still_needed]
                )
                for item in cat_matches:
                    seen_ids.add(item.id)
                    item.is_manual_pin = False
                    results.append(item)
                    if len(results) >= limit:
                        return results[:limit]

            # Preference C: any published if still needed
            still_needed = limit - len(results)
            if still_needed > 0:
                any_matches = list(fallback_qs.exclude(id__in=seen_ids)[:still_needed])
                for item in any_matches:
                    item.is_manual_pin = False
                    results.append(item)

        return results[:limit]

    @staticmethod
    def get_related_for_cart(cart_products: list[Product], limit: int = 8, exclude_ids: set = None) -> list[Product]:
        """Union of related products for all cart items, deduped."""
        if exclude_ids is None:
            exclude_ids = set()
        seen = set(exclude_ids)
        results = []
        for prod in cart_products:
            related = ProductSelector.get_related_products(prod, limit=4)
            for r in related:
                if r.id not in seen:
                    seen.add(r.id)
                    results.append(r)
                    if len(results) >= limit:
                        return results[:limit]
        return results[:limit]
