import pytest
from django.utils import timezone
from common.exceptions import BusinessException
from store_collections.services import CollectionService
from store_collections.selectors import CollectionSelector
from .factories import CollectionFactory


@pytest.mark.django_db
class TestCollectionService:
    def test_create_collection(self):
        service = CollectionService()
        result = service.create_collection({"name": "Summer", "slug": "summer"})
        assert result["slug"] == "summer"

    def test_duplicate_slug(self):
        CollectionFactory(slug="summer")
        service = CollectionService()
        with pytest.raises(BusinessException):
            service.create_collection({"name": "Summer 2", "slug": "summer"})

    def test_visibility_window(self):
        # collection with past end date should not appear
        past = timezone.now() - timezone.timedelta(days=10)
        coll = CollectionFactory(published_until=past)
        visible = CollectionSelector.get_visible_collections()
        assert coll not in visible

    def test_soft_delete(self):
        coll = CollectionFactory()
        service = CollectionService()
        service.delete_collection(str(coll.id))
        coll.refresh_from_db()
        assert not coll.is_active
