import factory
from factory.django import DjangoModelFactory
from analytics.models import TrackedEvent
from common.tests.factories import UserFactory


class TrackedEventFactory(DjangoModelFactory):
    class Meta:
        model = TrackedEvent

    user = factory.SubFactory(UserFactory)
    type = 'page_view'
    payload = {'page': '/home'}
