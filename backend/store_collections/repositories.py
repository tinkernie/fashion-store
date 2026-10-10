from django.db import transaction
from .models import Collection, CollectionProduct
from common.exceptions import BusinessException


class CollectionRepository:
    @staticmethod
    def create_collection(**validated_data) -> Collection:
        return Collection.objects.create(**validated_data)

    @staticmethod
    def update_collection(collection: Collection, **fields) -> Collection:
        allowed = {
            "name",
            "slug",
            "description",
            "hero_banner",
            "landing_page_content",
            "seo_metadata",
            "priority",
            "is_active",
            "published_from",
            "published_until",
        }
        for key, value in fields.items():
            if key in allowed:
                setattr(collection, key, value)
        collection.save()
        return collection

    @staticmethod
    def soft_delete_collection(collection: Collection):
        collection.delete()  # overridden method

    @staticmethod
    def hard_delete_collection(collection: Collection):
        collection.hard_delete()

    @staticmethod
    @transaction.atomic
    def set_product_positions(collection: Collection, product_positions: list[dict]):
        """Replace product links with new positions. Expects [{'product_id': ..., 'position': ...}, ...]"""
        CollectionProduct.objects.filter(collection=collection).delete()
        entries = [
            CollectionProduct(
                collection=collection,
                product_id=item["product_id"],
                position=item["position"],
            )
            for item in product_positions
        ]
        CollectionProduct.objects.bulk_create(entries)

    @staticmethod
    def add_product(collection: Collection, product_id, position: int = 0):
        if not CollectionProduct.objects.filter(
            collection=collection, product_id=product_id
        ).exists():
            CollectionProduct.objects.create(
                collection=collection, product_id=product_id, position=position
            )

    @staticmethod
    def remove_product(collection: Collection, product_id):
        CollectionProduct.objects.filter(
            collection=collection, product_id=product_id
        ).delete()
