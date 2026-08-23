import factory
from factory.django import DjangoModelFactory
from media_libm.models import Media
from product_options.tests.factories import ProductOptionFactory


class MediaFactory(DjangoModelFactory):
    class Meta:
        model = Media

    content_object = factory.SubFactory(ProductOptionFactory)
    media_type = Media.MediaType.IMAGE
    file = factory.django.FileField(filename='test.jpg')
    alt_text = 'An image'
    position = 0
