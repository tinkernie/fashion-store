import factory
from factory.django import DjangoModelFactory
from collections.models import Collection
from django.utils import timezone

class CollectionFactory(DjangoModelFactory):
    class Meta:
        model = Collection
    name = factory.Sequence(lambda n: f"Collection {n}")
    slug = factory.Sequence(lambda n: f"collection-{n}")
    is_active = True
    published_from = timezone.now()
    published_until = None
    priority = 0