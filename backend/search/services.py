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
                'current_page': page_obj.number,  # Step2: alias for frontend guide
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
        price = str(cheapest_variant.price) if cheapest_variant else (
            str(product.metadata.get("price", "0")) if product.metadata else "0"
        )
        
        img = None
        if product.metadata and "image_url" in product.metadata:
            img = product.metadata["image_url"]
        elif product.metadata and "imageUrl" in product.metadata:
            img = product.metadata["imageUrl"]
        else:
            try:
                from media_libm.selectors import MediaSelector
                main_img = MediaSelector.get_main_image_for_product(product)
                if main_img and main_img.get("url"):
                    img = main_img["url"]
            except Exception:
                pass

        total_stock = 0
        for v in product.variants.filter(deleted_at__isnull=True):
            if hasattr(v, "inventory") and v.inventory:
                total_stock += v.inventory.available_quantity

        # Discount fields
        now = timezone.now()
        is_expired = bool(product.discount_expires_at and product.discount_expires_at < now)
        has_pct = bool(product.discount_percent and 1 <= product.discount_percent <= 99)

        is_discount_active = bool(product.is_discount_active) or (has_pct and not is_expired and price and price != "0")
        discount_percent = product.discount_percent if (has_pct and not is_expired) else None
        discount_price = None
        if is_discount_active:
            if product.discount_price is not None and product.discount_price > 0:
                discount_price = int(product.discount_price)
            elif discount_percent and price and price != "0":
                try:
                    discount_price = int(round(float(price) * (100 - discount_percent) / 100.0))
                except Exception:
                    pass

        return {
            'id': str(product.id),
            'title': product.title,
            'name': product.title,
            'slug': product.slug,
            'description': (product.description or "")[:200],
            'category': product.category.name if product.category else None,
            'category_name': product.category.name if product.category else None,
            'category_slug': product.category.slug if product.category else None,
            'collections': [c.name for c in product.collections.all()],
            'price': price,
            'discount_price': discount_price,
            'discount_percent': discount_percent,
            'discount_expires_at': product.discount_expires_at.isoformat() if product.discount_expires_at else None,
            'is_discount_active': is_discount_active,
            'image': img,
            'imageUrl': img,
            'is_new': (timezone.now() - product.created_at).days < 30,
            'stock_quantity': total_stock,
            'is_in_stock': total_stock > 0,
        }

