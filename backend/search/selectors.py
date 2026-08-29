from django.db import models
from django.db.models import Q, Min, Count, OuterRef, Subquery, Exists
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.utils import timezone
from django.db import connection

from products.models import Product
from variants.models import Variant
from product_options.models import OptionValue, ProductOption
from categories.models import Category
from store_collections.models import Collection


class SearchSelector:
    @staticmethod
    def search_products(query: str = None, filters: dict = None, sort: str = None):
        qs = Product.objects.filter(status=Product.Status.PUBLISHED, deleted_at__isnull=True, category__is_active=True)

        # Apply text search

        if query:
            if connection.vendor == "postgresql":
                vector = (
                        SearchVector("title", weight="A", config="english")
                        + SearchVector("description", weight="B", config="english")
                )
                search_query = SearchQuery(query, config="english")
                qs = qs.annotate(rank=SearchRank(vector, search_query)).filter(
                    rank__gt=0
                ).order_by("-rank")
            else:
                qs = qs.filter(
                    Q(title__icontains=query) | Q(description__icontains=query)
                )

        # Apply filters
        if filters:
            if 'category_slug' in filters:
                qs = qs.filter(category__slug=filters['category_slug'])
            if 'collection_slug' in filters:
                qs = qs.filter(collections__slug=filters['collection_slug'])
            if 'min_price' in filters or 'max_price' in filters:
                # Filter products that have at least one variant in the price range
                variant_price_filter = Q()
                if 'min_price' in filters:
                    variant_price_filter &= Q(variants__price__gte=filters['min_price'])
                if 'max_price' in filters:
                    variant_price_filter &= Q(variants__price__lte=filters['max_price'])
                qs = qs.filter(variant_price_filter).distinct()
            # Option filters (color, size, etc.) are more complex:
            # We'll expect filters like 'options': {'Color': ['Red', 'Blue'], 'Size': ['M']}
            if 'options' in filters:
                option_filters = filters['options']  # dict: option_name -> list of values
                for option_name, values in option_filters.items():
                    # Subquery: product must have a variant with option value matching one of the given values
                    matching_variants = Variant.objects.filter(
                        product=OuterRef('pk'),
                        variantoption__option__name=option_name,
                        variantoption__option_value__value__in=values,
                        status=Variant.Status.PUBLISHED,
                        deleted_at__isnull=True,
                    )
                    qs = qs.filter(Q(Exists(matching_variants)))

        # Annotate for price ordering and price range display
        qs = qs.annotate(
            min_price=Min('variants__price',
                          filter=Q(variants__status=Variant.Status.PUBLISHED, variants__deleted_at__isnull=True)),
        )

        # Sorting
        if sort == 'price_asc':
            qs = qs.order_by('min_price')
        elif sort == 'price_desc':
            qs = qs.order_by('-min_price')
        elif sort == 'newest':
            qs = qs.order_by('-created_at')
        elif sort == 'name':
            qs = qs.order_by('title')
        else:
            # Default: relevance if query, else newest
            if query:
                qs = qs.order_by('-rank')
            else:
                qs = qs.order_by('-created_at')

        return qs.distinct()

    @staticmethod
    def get_dynamic_filters(qs):
        """
        Build available filters based on the current product queryset.
        Returns a dict with categories, collections, price range, and option values.
        """
        # Categories
        categories = Category.objects.filter(
            products__in=qs, is_active=True
        ).distinct().values('id', 'name', 'slug')

        # Collections
        collections = Collection.objects.filter(
            products__in=qs, is_active=True,
            published_from__lte=timezone.now()
        ).filter(
            Q(published_until__isnull=True) | Q(published_until__gte=timezone.now())
        ).distinct().values('id', 'name', 'slug')

        # Price range
        price_agg = qs.aggregate(
            min=Min('variants__price', filter=Q(variants__status='published', variants__deleted_at__isnull=True)),
            max=models.Max('variants__price',
                           filter=Q(variants__status='published', variants__deleted_at__isnull=True)),
        )
        price_range = {'min': price_agg['min'], 'max': price_agg['max']}

        # Option values (color, size, material, etc.)
        option_values = []
        # Get all options used by the products in qs
        product_ids = list(qs.values_list('id', flat=True))
        if product_ids:
            values = OptionValue.objects.filter(
                variants__product_id__in=product_ids,
                variants__status='published',
                variants__deleted_at__isnull=True,
                deleted_at__isnull=True,
            ).select_related('option').order_by('option__name', 'value')
            # Group by option name and deduplicate values
            grouped = {}
            for val in values:
                opt_name = (val.option.name or "").strip()
                val_str = (val.value or "").strip()
                if not opt_name or not val_str:
                    continue
                if opt_name not in grouped:
                    grouped[opt_name] = []
                if val_str not in grouped[opt_name]:
                    grouped[opt_name].append(val_str)
            option_values = [{'name': k, 'values': v} for k, v in grouped.items()]


        return {
            'categories': list(categories),
            'collections': list(collections),
            'price_range': {
                'min': str(price_range['min']) if price_range['min'] else None,
                'max': str(price_range['max']) if price_range['max'] else None,
            },
            'options': option_values,
        }
