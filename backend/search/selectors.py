from django.db import models
from django.db.models import Q, Min, Count, OuterRef, Subquery, Exists
from django.utils import timezone
from django.db import connection

from products.models import Product
from variants.models import Variant
from product_options.models import OptionValue, ProductOption
from categories.models import Category
from store_collections.models import Collection

# NOTE: 'simple' config (not 'english') — the catalog is Persian + SKU codes,
# and the english stemmer mangles both. Trigram similarity covers typos.


class SearchSelector:
    @staticmethod
    def search_products(query: str = None, filters: dict = None, sort: str = None):
        qs = Product.objects.filter(
            status=Product.Status.PUBLISHED,
            deleted_at__isnull=True,
        ).filter(
            Q(category__isnull=True) | Q(category__is_active=True)
        )

        has_rank = False
        has_similarity = False
        # Apply text search
        if query:
            if connection.vendor == "postgresql":
                from django.contrib.postgres.search import (
                    SearchQuery,
                    SearchRank,
                    TrigramSimilarity,
                )

                search_query = SearchQuery(query, config="simple")
                qs = qs.annotate(
                    rank=SearchRank(models.F("search_vector"), search_query)
                ).filter(rank__gt=0)
                has_rank = True
                # Trigram fallback for typos / short queries with no FTS hit
                if not qs.exists():
                    qs = (
                        Product.objects.filter(
                            status=Product.Status.PUBLISHED,
                            deleted_at__isnull=True,
                        )
                        .filter(
                            Q(category__isnull=True) | Q(category__is_active=True)
                        )
                        .annotate(
                            similarity=TrigramSimilarity("title", query)
                            + TrigramSimilarity("description", query)
                        )
                        .filter(similarity__gt=0.1)
                        .order_by("-similarity")
                    )
                    has_rank = False
                    has_similarity = True
            else:
                # SQLite dev fallback (no tsvector/trigram available)
                qs = qs.filter(
                    Q(title__icontains=query) | Q(description__icontains=query)
                )

        # Apply filters
        if filters:
            if filters.get('exclude_discounted') in ["true", "1", True, "True", "TRUE"]:
                from django.utils import timezone as _tz

                _now = _tz.now()
                qs = qs.exclude(
                    Q(discount_price__isnull=False)
                    & Q(discount_price__gt=0)
                    & (Q(discount_expires_at__isnull=True) | Q(discount_expires_at__gte=_now))
                )
            if 'category_slug' in filters and filters['category_slug']:
                qs = qs.filter(category__slug=filters['category_slug'])
            if 'collection_slug' in filters and filters['collection_slug']:
                qs = qs.filter(collections__slug=filters['collection_slug'])
            if 'min_price' in filters or 'max_price' in filters:
                # Filter products that have at least one variant in the price range
                variant_price_filter = Q()
                if 'min_price' in filters and filters['min_price']:
                    variant_price_filter &= Q(variants__price__gte=filters['min_price'])
                if 'max_price' in filters and filters['max_price']:
                    variant_price_filter &= Q(variants__price__lte=filters['max_price'])
                qs = qs.filter(variant_price_filter).distinct()
            # Option filters (color, size, etc.)
            if 'options' in filters and isinstance(filters['options'], dict):
                option_filters = filters['options']
                for option_name, values in option_filters.items():
                    if values:
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

        # Sorting - frontend sends popularity via sort and ordering + best_selling/trending
        if sort == 'price_asc':
            qs = qs.order_by('min_price')
        elif sort == 'price_desc':
            qs = qs.order_by('-min_price')
        elif sort == 'newest':
            qs = qs.order_by('-created_at')
        elif sort == 'name':
            qs = qs.order_by('title')
        elif sort == 'popularity':
            qs = qs.annotate(popularity=Count('order_items', distinct=True)).order_by('-popularity', '-created_at')
        elif sort == 'best_selling':
            from django.db.models import Sum
            qs = qs.annotate(
                best_selling=Sum('order_items__quantity', filter=Q(order_items__order__status__in=['paid','packing','shipping','delivered'], order_items__order__deleted_at__isnull=True))
            ).order_by('-best_selling', '-created_at')
        elif sort == 'trending':
            from django.db.models import Sum
            from django.utils import timezone
            from datetime import timedelta
            since = timezone.now() - timedelta(days=30)
            qs = qs.annotate(
                trending=Sum('order_items__quantity', filter=Q(order_items__order__status__in=['paid','packing','shipping','delivered'], order_items__order__deleted_at__isnull=True, order_items__order__placed_at__gte=since))
            ).order_by('-trending', '-created_at')
        else:
            if has_rank:
                qs = qs.order_by('-rank')
            elif has_similarity:
                pass  # keep trigram similarity ordering
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
        # Get all options used by the products in qs (capped: full-table
        # IN-lists blow up on large catalogs; facets stay accurate enough)
        product_ids = list(qs.values_list('id', flat=True)[:5000])
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
