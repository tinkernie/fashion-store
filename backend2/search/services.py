from django.utils import timezone

from .selectors import SearchSelector
from django.core.paginator import Paginator


class SearchService:
    def search(self, query: str = None, filters: dict = None, sort: str = None,
               page: int = 1, page_size: int = 20) -> dict:
        qs = SearchSelector.search_products(query=query, filters=filters, sort=sort)
        # Paginate
        paginator = Paginator(qs, page_size)
        page_obj = paginator.get_page(page)

        products = []
        for product in page_obj:
            products.append(self._serialize_product(product))

        # Dynamic filters based on *all* results (not just current page)
        # To get accurate filter counts, we run the query without pagination? Might be expensive.
        # We'll generate filters on the entire result set (same qs but without slicing)
        # But that would duplicate the query. Instead, we can use the original qs to generate filters.
        # For performance, we'll compute filters on the full qs. OK for moderate size.
        dynamic_filters = SearchSelector.get_dynamic_filters(qs)

        return {
            'products': products,
            'filters': dynamic_filters,
            'pagination': {
                'page': page_obj.number,
                'page_size': page_size,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
            }
        }

    def _serialize_product(self, product) -> dict:
        # Extract minimal variant info for display (cheapest variant)
        cheapest_variant = product.variants.filter(
            status='published', deleted_at__isnull=True
        ).order_by('price').first()
        price = str(cheapest_variant.price) if cheapest_variant else None
        image = None  # placeholder until media_libm
        return {
            'id': str(product.id),
            'title': product.title,
            'slug': product.slug,
            'description': product.description[:200],
            'category': product.category.name if product.category else None,
            'collections': [c.name for c in product.collections.all()],
            'price': price,
            'image': image,
            'is_new': (product.created_at - timezone.now()).days > -30,
        }
