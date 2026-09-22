from .repositories import CategoryRepository
from .selectors import CategorySelector
from common.exceptions import BusinessException


class CategoryService:
    def create_category(self, data: dict) -> dict:
        # Validate slug uniqueness (already enforced by model, but double‑check to raise custom exception)
        slug = data.get("slug")
        if CategorySelector.get_category_by_slug(slug):
            raise BusinessException("A category with this slug already exists.")
        # Validate parent
        parent_id = data.get("parent_id")
        parent = None
        if parent_id:
            parent = CategorySelector.get_category_by_id(parent_id)
            if not parent:
                raise BusinessException("Parent category not found.")
        category = CategoryRepository.create_category(
            name=data["name"],
            slug=slug,
            description=data.get("description", ""),
            image=data.get("image", None),
            is_active=data.get("is_active", True),
            parent=parent,
        )
        # Invalidate Redis category cache
        try:
            from django.core.cache import cache
            cache.delete("categories:active_tree")
            cache.delete("categories:active_flat")
        except Exception:
            pass
        return self._serialize_category(category)

    def update_category(self, category_id, data: dict) -> dict:
        category = CategorySelector.get_category_by_id(category_id)
        if not category:
            raise BusinessException("Category not found.")
        # Prevent moving a node into its own descendant tree
        new_parent_id = data.get("parent_id")
        if new_parent_id:
            new_parent = CategorySelector.get_category_by_id(new_parent_id)
            if not new_parent:
                raise BusinessException("New parent category not found.")
            if new_parent == category or category.is_ancestor_of(new_parent):
                raise BusinessException(
                    "Cannot move a category into its own descendant."
                )
            data["parent"] = new_parent
        updated = CategoryRepository.update_category(category, **data)
        try:
            from django.core.cache import cache
            cache.delete("categories:active_tree")
            cache.delete("categories:active_flat")
        except Exception:
            pass
        return self._serialize_category(updated)

    def deactivate_category(self, category_id) -> dict:
        category = CategorySelector.get_category_by_id(category_id)
        if not category:
            raise BusinessException("Category not found.")
        # Deactivation cascades? Only the node itself is deactivated; children remain but hidden.
        CategoryRepository.soft_delete_category(category)
        try:
            from django.core.cache import cache
            cache.delete("categories:active_tree")
            cache.delete("categories:active_flat")
        except Exception:
            pass
        return {"message": f"Category '{category.name}' deactivated."}

    def _serialize_category(self, category) -> dict:
        return {
            "id": str(category.id),
            "name": category.name,
            "slug": category.slug,
            "description": category.description,
            "is_active": category.is_active,
            "parent_id": str(category.parent_id) if category.parent_id else None,
        }
