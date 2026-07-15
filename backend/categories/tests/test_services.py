import pytest
from common.exceptions import BusinessException
from categories.services import CategoryService
from .factories import CategoryFactory


@pytest.mark.django_db
class TestCategoryService:
    def test_create_root_category(self):
        service = CategoryService()
        result = service.create_category({"name": "Women", "slug": "women"})
        assert result["slug"] == "women"
        assert result["parent_id"] is None

    def test_create_child_category(self):
        parent = CategoryFactory(name="Women", slug="women")
        service = CategoryService()
        result = service.create_category(
            {"name": "Dresses", "slug": "dresses", "parent_id": str(parent.id)}
        )
        assert result["parent_id"] == str(parent.id)

    def test_create_duplicate_slug(self):
        CategoryFactory(slug="women")
        service = CategoryService()
        with pytest.raises(BusinessException):
            service.create_category({"name": "Another", "slug": "women"})

    def test_move_to_descendant_disallowed(self):
        root = CategoryFactory(name="A")
        child = CategoryFactory(name="B", parent=root)
        service = CategoryService()
        # Try to move root into child
        with pytest.raises(BusinessException):
            service.update_category(str(root.id), {"parent_id": str(child.id)})

    def test_deactivate(self):
        cat = CategoryFactory()
        service = CategoryService()
        service.deactivate_category(str(cat.id))
        cat.refresh_from_db()
        assert not cat.is_active
