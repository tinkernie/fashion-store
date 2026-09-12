from django.db.models import Q, Prefetch, Avg, Count
from .models import Product


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
    def get_visible_products(filters: dict = None) -> list[Product]:
        """Return published, non‑deleted products with active category."""
        qs = (
            Product.objects.filter(
                status=Product.Status.PUBLISHED,
                deleted_at__isnull=True,
                category__is_active=True,  # ensure category is visible
            )
            .select_related("category")
            .prefetch_related("collections")
        )

        if filters:
            if "category_slug" in filters:
                qs = qs.filter(category__slug=filters["category_slug"])
            if "collection_slug" in filters:
                qs = qs.filter(collections__slug=filters["collection_slug"])
            if "search" in filters:
                search = filters["search"]
                qs = qs.filter(
                    Q(title__icontains=search) | Q(description__icontains=search)
                )
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
            .prefetch_related("collections")
        )
        qs = ProductSelector._annotate_reviews(qs)
        return qs.first()

    @staticmethod
    def get_product_by_id(product_id) -> Product or None:
        qs = (
            Product.objects.filter(id=product_id, deleted_at__isnull=True)
            .select_related("category")
            .prefetch_related("collections")
        )
        qs = ProductSelector._annotate_reviews(qs)
        return qs.first()

    @staticmethod
    def get_all_products_admin(filters: dict = None) -> list[Product]:
        qs = (
            Product.objects.filter(deleted_at__isnull=True)
            .select_related("category")
            .prefetch_related("collections")
        )
        if filters:
            if "status" in filters:
                qs = qs.filter(status=filters["status"])
            if "search" in filters:
                search = filters["search"]
                qs = qs.filter(
                    Q(title__icontains=search) | Q(description__icontains=search)
                )
        qs = ProductSelector._annotate_reviews(qs)
        return qs
