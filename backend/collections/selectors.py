from django.utils import timezone
from django.db.models import Prefetch
from django.db import models
from .models import Collection, CollectionProduct

class CollectionSelector:
    @staticmethod
    def get_visible_collections() -> list[Collection]:
        """Return active collections currently within their publication window."""
        now = timezone.now()
        return Collection.objects.filter(
            is_active=True,
            published_from__lte=now,
        ).filter(
            models.Q(published_until__isnull=True) | models.Q(published_until__gte=now)
        ).order_by('-priority', '-created_at').prefetch_related('product_links__product')

    @staticmethod
    def get_collection_by_slug(slug: str) -> Collection or None:
        now = timezone.now()
        return Collection.objects.filter(
            slug=slug,
            is_active=True,
            published_from__lte=now,
        ).filter(
            models.Q(published_until__isnull=True) | models.Q(published_until__gte=now)
        ).prefetch_related('product_links__product').first()

    @staticmethod
    def get_collection_by_id(collection_id) -> Collection or None:
        return Collection.objects.filter(id=collection_id).prefetch_related('product_links__product').first()

    @staticmethod
    def get_all_collections_admin() -> list[Collection]:
        return Collection.objects.all().prefetch_related('product_links__product')