from django.utils import timezone
from .repositories import CollectionRepository
from .selectors import CollectionSelector
from common.exceptions import BusinessException


class CollectionService:
    def create_collection(self, data: dict) -> dict:
        slug = data.get('slug')
        if CollectionSelector.get_collection_by_slug(slug):  # check active only
            raise BusinessException("A collection with this slug already exists.")
        collection = CollectionRepository.create_collection(**data)
        return self._serialize(collection)

    def update_collection(self, collection_id, data: dict) -> dict:
        collection = CollectionSelector.get_collection_by_id(collection_id)
        if not collection:
            raise BusinessException("Collection not found.")
        updated = CollectionRepository.update_collection(collection, **data)
        return self._serialize(updated)

    def delete_collection(self, collection_id) -> dict:
        collection = CollectionSelector.get_collection_by_id(collection_id)
        if not collection:
            raise BusinessException("Collection not found.")
        CollectionRepository.soft_delete_collection(collection)
        return {"message": f"Collection '{collection.name}' deactivated."}

    def set_product_positions(self, collection_id, product_positions: list) -> dict:
        collection = CollectionSelector.get_collection_by_id(collection_id)
        if not collection:
            raise BusinessException("Collection not found.")
        CollectionRepository.set_product_positions(collection, product_positions)
        return {"message": "Product positions updated."}

    def add_product(self, collection_id, product_id, position: int = 0) -> dict:
        collection = CollectionSelector.get_collection_by_id(collection_id)
        if not collection:
            raise BusinessException("Collection not found.")
        CollectionRepository.add_product(collection, product_id, position)
        return {"message": "Product added to collection."}

    def remove_product(self, collection_id, product_id) -> dict:
        collection = CollectionSelector.get_collection_by_id(collection_id)
        if not collection:
            raise BusinessException("Collection not found.")
        CollectionRepository.remove_product(collection, product_id)
        return {"message": "Product removed from collection."}

    def _serialize(self, collection) -> dict:
        return {
            'id': str(collection.id),
            'name': collection.name,
            'slug': collection.slug,
            'description': collection.description,
            'hero_banner': collection.hero_banner.url if collection.hero_banner else None,
            'landing_page_content': collection.landing_page_content,
            'seo_metadata': collection.seo_metadata,
            'priority': collection.priority,
            'is_active': collection.is_active,
            'published_from': collection.published_from,
            'published_until': collection.published_until,
        }
