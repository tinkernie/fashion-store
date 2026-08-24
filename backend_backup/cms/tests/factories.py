import factory
from factory.django import DjangoModelFactory
from cms.models import Page, SiteContent


class PageFactory(DjangoModelFactory):
    class Meta:
        model = Page

    title = factory.Sequence(lambda n: f"Page {n}")
    slug = factory.Sequence(lambda n: f"page-{n}")
    content = [{"type": "text", "data": {"value": "Sample content"}}]
    status = 'published'


class SiteContentFactory(DjangoModelFactory):
    class Meta:
        model = SiteContent

    key = 'homepage'
    content = {"hero": {"title": "Welcome"}}
