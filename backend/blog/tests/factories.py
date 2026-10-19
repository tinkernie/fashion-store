import factory
from django.utils import timezone
from django.contrib.auth import get_user_model
from ..models import Post, Tag

User = get_user_model()


class StaffUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    phone_number = factory.Sequence(lambda n: "0912345{:04d}".format(n))
    is_staff = True
    is_active = True
    password = factory.PostGenerationMethodCall("set_password", "SecurePass123!")


class TagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tag

    name = factory.Sequence(lambda n: "برچسب {}".format(n))
    slug = factory.Sequence(lambda n: "tag-{}".format(n))


class PostFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Post
        skip_postgeneration_save = True

    title = factory.Sequence(lambda n: "مقاله {}".format(n))
    slug = factory.Sequence(lambda n: "post-{}".format(n))
    body_html = "<p>متن مقاله</p>"
    status = Post.Status.DRAFT
    published_at = factory.LazyFunction(timezone.now)

    @factory.post_generation
    def tags(self, create, extracted, **kwargs):
        if extracted:
            self.tags.set(extracted)
