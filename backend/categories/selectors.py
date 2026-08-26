from mptt.utils import get_cached_trees
from .models import Category


class CategorySelector:
    @staticmethod
    def get_active_tree() -> list[Category]:
        """Return active root nodes with their active descendants as a tree."""
        try:
            return get_cached_trees(Category.objects.filter(is_active=True))
        except Exception:
            return list(Category.objects.filter(is_active=True, parent__isnull=True).prefetch_related("children"))

    @staticmethod
    def get_active_flat_list() -> list[Category]:
        return Category.objects.filter(is_active=True).order_by("tree_id", "lft")

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
