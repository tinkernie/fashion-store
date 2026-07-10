from django.db.models import Q, Prefetch
from .models import Product


class ProductSelector:
    @staticmethod
    def get_visible_products(filters: dict = None) -> list[Product]:
        """Return published, non‑deleted products with active category."""
        qs = Product.objects.filter(
            status=Product.Status.PUBLISHED,
            deleted_at__isnull=True,
            category__is_active=True,  # ensure category is visible
        ).select_related('category').prefetch_related('collections')

        if filters:
            if 'category_slug' in filters:
                qs = qs.filter(category__slug=filters['category_slug'])
            if 'collection_slug' in filters:
                qs = qs.filter(collections__slug=filters['collection_slug'])
            if 'search' in filters:
                search = filters['search']
                qs = qs.filter(
                    Q(title__icontains=search) | Q(description__icontains=search)
                )
        return qs.distinct()

    @staticmethod
    def get_product_by_slug(slug: str) -> Product or None:
        return Product.objects.filter(
            slug=slug,
            status=Product.Status.PUBLISHED,
            deleted_at__isnull=True,
            category__is_active=True,
        ).select_related('category').prefetch_related('collections').first()

    @staticmethod
    def get_product_by_id(product_id) -> Product or None:
        return Product.objects.filter(
            id=product_id, deleted_at__isnull=True
        ).select_related('category').prefetch_related('collections').first()

    @staticmethod
    def get_all_products_admin(filters: dict = None) -> list[Product]:
        qs = Product.objects.filter(deleted_at__isnull=True).select_related('category').prefetch_related('collections')
        if filters:
            if 'status' in filters:
                qs = qs.filter(status=filters['status'])
            if 'search' in filters:
                search = filters['search']
                qs = qs.filter(
                    Q(title__icontains=search) | Q(description__icontains=search)
                )
        return qs
