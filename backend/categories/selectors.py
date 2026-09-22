from django.core.cache import cache
from mptt.utils import get_cached_trees
from .models import Category


class CategorySelector:
    @staticmethod
    def get_active_tree() -> list[Category]:
        """Return active root nodes with their active descendants as a tree (Redis cached 1h)."""
        cache_key = "categories:active_tree"
        cached_ids = cache.get(cache_key)
        if cached_ids is not None:
            try:
                # Rehydrate ordered tree from cached IDs
                qs = Category.objects.filter(id__in=cached_ids).order_by("tree_id", "lft")
                id_map = {str(c.id): c for c in qs}
                return [id_map[str(pid)] for pid in cached_ids if str(pid) in id_map]
            except Exception:
                pass
        try:
            tree = get_cached_trees(Category.objects.filter(is_active=True))
        except Exception:
            tree = list(Category.objects.filter(is_active=True, parent__isnull=True).prefetch_related("children"))
        # Flatten tree to cache IDs preserving order
        try:
            flat_ids = []
            def _collect(nodes):
                for n in nodes:
                    flat_ids.append(str(n.id))
                    if hasattr(n, "get_children"):
                        _collect(n.get_children())
            _collect(tree)
            # Cache flat list of active IDs (1h) - view serializes via tree serializer
            cache.set(cache_key, flat_ids, 3600)
        except Exception:
            pass
        return tree

    @staticmethod
    def get_active_flat_list() -> list[Category]:
        cache_key = "categories:active_flat"
        cached = cache.get(cache_key)
        if cached is not None:
            try:
                qs = Category.objects.filter(id__in=cached).order_by("tree_id", "lft")
                id_map = {str(c.id): c for c in qs}
                return [id_map[str(pid)] for pid in cached if str(pid) in id_map]
            except Exception:
                pass
        qs = list(Category.objects.filter(is_active=True).order_by("tree_id", "lft"))
        try:
            cache.set(cache_key, [str(c.id) for c in qs], 3600)
        except Exception:
            pass
        return qs

    @staticmethod
    def get_category_by_slug(slug: str) -> Category or None:
        return Category.objects.filter(slug=slug, is_active=True).first()

    @staticmethod
    def get_category_by_id(category_id) -> Category or None:
        return Category.objects.filter(id=category_id).first()

    @staticmethod
    def get_children(category: Category) -> list[Category]:
        return category.get_children().filter(is_active=True)

    @staticmethod
    def get_all_categories_admin() -> list[Category]:
        # Admin sees all, including inactive
        return Category.objects.all().order_by("tree_id", "lft")
