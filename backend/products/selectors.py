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
    def get_auto_candidates(product, exclude_ids: set = None, limit: int = 8) -> list[Product]:
        """System picks for related clothing, scored by fashion signals:

        same category x3, same collection x2, shared option words (same
        colour/size/fabric text, matched by value text since option rows
        are per-product) x1 each, same price band (±40%) x2,
        sibling category x1, high rating x1-2, order popularity capped at 5.
        Only published, non-deleted, in-stock products. Used solely by the
        admin auto-fill action — never injected silently into the storefront.
        """
        from decimal import Decimal

        limit = min(max(int(limit), 1), 8)
        seen_ids = set(exclude_ids or set()) | {product.id}

        # Source-product signals (two cheap lookups, no N+1).
        from variants.models import Variant as _Variant
        from product_options.models import OptionValue as _OptionValue

        try:
            base_price = float(
                _Variant.objects.filter(
                    product=product, deleted_at__isnull=True
                ).aggregate(m=Min("price"))["m"] or 0
            )
        except Exception:
            base_price = 0.0
        try:
            # Match by value TEXT ("red", "M", "cotton"): option rows are
            # per-product, so ids never coincide across products — but the
            # same colour/size/fabric words do, and that is the real
            # affinity signal for clothing.
            source_texts = [
                t for t in (
                    _OptionValue.objects.filter(
                        variants__product=product,
                        variants__deleted_at__isnull=True,
                        deleted_at__isnull=True,
                    ).values_list("value", flat=True).distinct()
                ) if (t or "").strip()
            ]
        except Exception:
            source_texts = []
        try:
            parent_id = product.category.parent_id if product.category else None
        except Exception:
            parent_id = None

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
        # NOTE: when there is nothing to match, emit a bare Value(0) instead
        # of Count(..., filter=Q(pk__in=[])) — the empty-IN filter inside an
        # aggregate poisons the whole score expression to 0 on this stack.
        fallback_qs = fallback_qs.annotate(
            popularity=Count("order_items", distinct=True),
            cat_match=Case(
                When(category=product.category, then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            ),
            sibling_match=Case(
                When(category__parent_id=parent_id, then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            ) if parent_id else Value(0, output_field=IntegerField()),
            coll_match=Count(
                "collections",
                filter=Q(collections__in=collection_ids),
                distinct=True,
            ) if collection_ids else Value(0, output_field=IntegerField()),
            min_price=Min(
                "variants__price",
                filter=Q(variants__deleted_at__isnull=True),
            ),
            shared_options=Count(
                "variants__option_values",
                filter=Q(variants__option_values__value__in=source_texts,
                         variants__deleted_at__isnull=True),
                distinct=True,
            ) if source_texts else Value(0, output_field=IntegerField()),
            avg_rating=Avg(
                "reviews__rating",
                filter=Q(reviews__status="approved", reviews__deleted_at__isnull=True),
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
        # Second annotate pass so derived aliases can be referenced.
        price_lo = Decimal(str(base_price * 0.6)) if base_price > 0 else None
        price_hi = Decimal(str(base_price * 1.4)) if base_price > 0 else None
        fallback_qs = fallback_qs.annotate(
            price_band=Case(
                When(min_price__gte=price_lo, min_price__lte=price_hi, then=Value(2)),
                default=Value(0),
                output_field=IntegerField(),
            ) if price_lo is not None else Value(0, output_field=IntegerField()),
            rating_bonus=Case(
                When(avg_rating__gte=4.5, then=Value(2)),
                When(avg_rating__gte=4.0, then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            ),
            popularity_capped=Case(
                When(popularity__gte=5, then=Value(5)),
                default=F("popularity"),
                output_field=IntegerField(),
            ),
        )
        # NOTE: shared_options is used directly (x2) — referencing an M2M
        # Count alias inside a later Case/When collapses the score to 0 on
        # this Django version, so no capped intermediate for it. Distinct
        # shared values stay small in practice, keeping the weight sane.
        fallback_qs = fallback_qs.annotate(
            score=F("cat_match") * 3
            + F("sibling_match")
            + F("coll_match") * 2
            + F("price_band")
            + F("shared_options")
            + F("rating_bonus")
            + F("popularity_capped")
        ).order_by("-score", "-popularity_capped", "-created_at")
        fallback_qs = ProductSelector._annotate_reviews(fallback_qs)
        candidates = list(fallback_qs.distinct()[: limit * 2])
        results = []
        for item in candidates:
            if item.id not in seen_ids:
                seen_ids.add(item.id)
                item.is_manual_pin = False
                results.append(item)
                if len(results) >= limit:
                    break
        return results

    @staticmethod
    def get_suggested_products(product, limit: int = 8, auto_fill: bool = False) -> list[Product]:
        """Related products (max 8). Manual pins first; the system NEVER
        auto-fills the storefront rail on its own — auto candidates are only
        appended when auto_fill=True is explicitly requested (admin auto-fill
        action, cart cross-sell). Empty manual configuration returns []."""
        limit = min(max(int(limit), 1), 8)
        cache_key = f"suggested:{product.id}:{limit}:{'auto' if auto_fill else 'manual'}"
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
        if auto_fill and needed > 0:
            results.extend(
                ProductSelector.get_auto_candidates(product, exclude_ids=seen_ids, limit=needed)
            )
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
            # Cart cross-sell keeps the hybrid behaviour (manual + auto);
            # the product-page rail itself is manual-only unless auto-filled.
            related = ProductSelector.get_suggested_products(prod, limit=4, auto_fill=True)
            for r in related:
                if r.id not in seen:
                    seen.add(r.id)
                    results.append(r)
                    if len(results) >= limit:
                        return results[:limit]
        return results[:limit]
