from django.core.cache import cache
from django.db.models import Q, Prefetch, Avg, Count, Min, Max, Case, When, F, Value, IntegerField, Exists, OuterRef
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

        # has_discount filter (expiry-aware: expired campaigns drop out automatically)
        from django.utils import timezone as _tz

        _now = _tz.now()
        _active_discount = (
            Q(discount_price__isnull=False)
            & Q(discount_price__gt=0)
            & (Q(discount_expires_at__isnull=True) | Q(discount_expires_at__gte=_now))
        )
        has_discount = filters.get("has_discount")
        if has_discount in ["true", "1", True, "True", "TRUE"]:
            qs = qs.filter(_active_discount)
        elif has_discount in ["false", "0", False]:
            qs = qs.exclude(_active_discount)

        # exclude_discounted: homepage main rail + newest rail hide campaign
        # items; category / collection / all-products / campaign feeds keep them.
        exclude_discounted = filters.get("exclude_discounted")
        if exclude_discounted in ["true", "1", True, "True", "TRUE"]:
            qs = qs.exclude(_active_discount)

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

        # Ordering - including popularity/best_selling/trending
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
            "popularity": "popularity",
            "-popularity": "-popularity",
            "best_selling": "best_selling",
            "-best_selling": "-best_selling",
            "trending": "trending",
            "-trending": "-trending",
        }
        if ordering in allowed_orderings:
            order_val = allowed_orderings[ordering]
            if "price" in order_val:
                qs = qs.annotate(
                    min_price_ord=Min(
                        "variants__price",
                        filter=Q(variants__deleted_at__isnull=True),
                    )
                )
                if order_val == "price":
                    qs = qs.order_by("min_price_ord")
                else:
                    qs = qs.order_by("-min_price_ord")
            elif order_val in ("popularity", "-popularity"):
                qs = qs.annotate(
                    popularity=Count("order_items", distinct=True),
                )
                qs = qs.order_by(order_val)
            elif order_val in ("best_selling", "-best_selling"):
                from django.db.models import Sum
                # Best selling = total quantity sold in paid/delivered statuses
                qs = qs.annotate(
                    best_selling=Sum(
                        "order_items__quantity",
                        filter=Q(
                            order_items__order__status__in=[
                                "paid",
                                "packing",
                                "shipping",
                                "delivered",
                            ],
                            order_items__order__deleted_at__isnull=True,
                        ),
                    )
                )
                qs = qs.order_by(order_val)
            elif order_val in ("trending", "-trending"):
                from django.db.models import Sum
                from django.utils import timezone
                from datetime import timedelta

                since = timezone.now() - timedelta(days=30)
                qs = qs.annotate(
                    trending=Sum(
                        "order_items__quantity",
                        filter=Q(
                            order_items__order__status__in=[
                                "paid",
                                "packing",
                                "shipping",
                                "delivered",
                            ],
                            order_items__order__deleted_at__isnull=True,
                            order_items__order__placed_at__gte=since,
                        ),
                    )
                )
                qs = qs.order_by(order_val)
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
    def get_related_products(product, limit: int = 8) -> list[Product]:
        """Legacy alias for suggested_products — merged hybrid (manual suggested + auto fallback), max 8."""
        # Merged: related_products now equals suggested_products (complete_look is separate)
        limit = min(max(int(limit), 1), 8)
        return ProductSelector.get_suggested_products(product, limit=limit)

    @staticmethod
    def get_complete_look_products(product, limit: int = 6) -> list[Product]:
        """Complete the Look: manual only (relation_type=complete_look), no auto fallback, max 6."""
        limit = min(max(int(limit), 1), 6)
        cache_key = f"complete_look:{product.id}:{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            try:
                if cached and isinstance(cached[0], (list, tuple)):
                    ids = [pid for pid, _ in cached]
                    qs = Product.objects.filter(id__in=ids).select_related("category").prefetch_related("collections", "images")
                    qs = ProductSelector._annotate_reviews(qs)
                    id_map = {str(p.id): p for p in qs}
                    results = []
                    for pid, is_manual in cached:
                        p = id_map.get(str(pid))
                        if p:
                            p.is_manual_pin = True
                            results.append(p)
                    if results:
                        return results[:limit]
            except Exception:
                pass
        pinned = (
            RelatedProduct.objects.filter(
                source_product=product,
                relation_type=RelatedProduct.RelationType.COMPLETE_LOOK,
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
                target.is_manual_pin = True
                if not hasattr(target, 'annotated_avg_rating'):
                    target.annotated_avg_rating = None
                    target.annotated_reviews_count = 0
                results.append(target)
                if len(results) >= limit:
                    break
        try:
            cache.set(cache_key, [(str(r.id), True) for r in results[:limit]], 3600)
        except Exception:
            pass
        return results[:limit]

    @staticmethod
    def get_suggested_products(product, limit: int = 8) -> list[Product]:
        """Suggested: manual pins (relation_type=suggested) + auto fallback (collection/category/popularity), max 8."""
        limit = min(max(int(limit), 1), 8)
        cache_key = f"suggested:{product.id}:{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            try:
                if cached and isinstance(cached[0], (list, tuple)):
                    ids = [pid for pid, _ in cached]
                    qs = Product.objects.filter(id__in=ids).select_related("category").prefetch_related("collections", "images")
                    qs = ProductSelector._annotate_reviews(qs)
                    id_map = {str(p.id): p for p in qs}
                    results = []
                    for pid, is_manual in cached:
                        p = id_map.get(str(pid))
                        if p:
                            p.is_manual_pin = bool(is_manual)
                            results.append(p)
                    if results:
                        return results[:limit]
            except Exception:
                pass

        # Manual pins for suggested
        pinned = (
            RelatedProduct.objects.filter(
                source_product=product,
                relation_type=RelatedProduct.RelationType.SUGGESTED,
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
                target.is_manual_pin = True
                if not hasattr(target, 'annotated_avg_rating'):
                    target.annotated_avg_rating = None
                    target.annotated_reviews_count = 0
                results.append(target)
            if len(results) >= limit:
                try:
                    cache.set(cache_key, [(str(r.id), True) for r in results[:limit]], 3600)
                except Exception:
                    pass
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
            collection_ids = list(product.collections.values_list("id", flat=True))
            fallback_qs = fallback_qs.annotate(
                popularity=Count("order_items", distinct=True),
                cat_match=Case(
                    When(category=product.category, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
                coll_match=Count(
                    "collections",
                    filter=Q(collections__in=collection_ids) if collection_ids else Q(pk__in=[]),
                    distinct=True,
                ),
            )
            fallback_qs = fallback_qs.filter(
                Exists(
                    Product.objects.filter(
                        pk=OuterRef("pk"),
                        variants__status="published",
                        variants__deleted_at__isnull=True,
                        variants__inventory__available_quantity__gt=0,
                    )
                )
            )
            fallback_qs = fallback_qs.annotate(
                score=F("cat_match") * 3 + F("coll_match") * 2 + F("popularity")
            ).order_by("-score", "-popularity", "-created_at")
            fallback_qs = ProductSelector._annotate_reviews(fallback_qs)
            candidates = list(fallback_qs.distinct()[: needed * 2])
            for item in candidates:
                if item.id not in seen_ids:
                    seen_ids.add(item.id)
                    item.is_manual_pin = False
                    results.append(item)
                    if len(results) >= limit:
                        break
        try:
            cache.set(cache_key, [(str(r.id), bool(getattr(r, 'is_manual_pin', False))) for r in results[:limit]], 3600)
        except Exception:
            pass
        return results[:limit]

    @staticmethod
    def get_related_for_cart(cart_products: list[Product], limit: int = 8, exclude_ids: set = None) -> list[Product]:
        """Union of related products for all cart items, deduped."""
        if exclude_ids is None:
            exclude_ids = set()
        seen = set(exclude_ids)
        results = []
        for prod in cart_products:
            # Use suggested logic for cart cross-sell (hybrid)
            related = ProductSelector.get_suggested_products(prod, limit=4)
            for r in related:
                if r.id not in seen:
                    seen.add(r.id)
                    results.append(r)
                    if len(results) >= limit:
                        return results[:limit]
        return results[:limit]
