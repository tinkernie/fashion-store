from .models import Category
from .selectors import CategorySelector
from common.exceptions import BusinessException

class CategoryRepository:
    @staticmethod
    def create_category(**validated_data) -> Category:
        parent = validated_data.get('parent')
        if parent and not parent.is_active:
            raise BusinessException("Cannot assign an inactive parent.")
        category = Category.objects.create(**validated_data)
        return category

    @staticmethod
    def update_category(category: Category, **fields) -> Category:
        allowed = {'name', 'slug', 'description', 'image', 'is_active', 'parent'}
        for key, value in fields.items():
            if key in allowed:
                setattr(category, key, value)
        category.save()
        # Rebuild MPTT tree if parent changed? MPTT handles it automatically on save.
        return category

    @staticmethod
    def soft_delete_category(category: Category):
        category.delete()  # uses overridden delete