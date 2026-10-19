from django.db.models import Q
from django.utils import timezone
from .models import Post, PostTranslation, Tag

PUBLISHED_STATUS = Post.Status.PUBLISHED


class BlogSelector:
    @staticmethod
    def published_posts_qs():
        return (
            Post.objects.filter(status=PUBLISHED_STATUS, published_at__isnull=False)
            .prefetch_related("tags", "translations")
            .order_by("-published_at", "-created_at")
        )

    @staticmethod
    def active_translations_qs():
        return PostTranslation.objects.filter(deleted_at__isnull=True)

    @staticmethod
    def posts_by_lang_slugs(lang, slugs):
        if not slugs:
            return Post.objects.none()
        tr_ids = (
            BlogSelector.active_translations_qs()
            .filter(language=lang, slug__in=slugs)
            .values_list("post_id", flat=True)
        )
        return Post.objects.filter(id__in=list(tr_ids))

    @staticmethod
    def translation_for(post, lang):
        return BlogSelector.active_translations_qs().filter(post=post, language=lang).first()

    @staticmethod
    def translation_by_slug(lang, slug):
        return (
            BlogSelector.active_translations_qs().filter(language=lang, slug=slug).first()
        )

    @staticmethod
    def post_by_slug(slug):
        return Post.objects.filter(slug=slug).first()

    @staticmethod
    def tags_q(search=""):
        qs = Tag.objects.all()
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(name_en__icontains=search)
                | Q(name_ar__icontains=search)
                | Q(slug__icontains=search)
            )
        return qs

    @staticmethod
    def tag_by_slug(slug):
        return Tag.objects.filter(slug=slug).first()

    @staticmethod
    def admin_posts_qs(filters=None):
        qs = Post.all_objects.filter(deleted_at__isnull=True)
        filters = filters or {}
        status = filters.get("status")
        if status in (Post.Status.DRAFT, Post.Status.PUBLISHED):
            qs = qs.filter(status=status)
        search = filters.get("search")
        if search:
            qs = (
                qs.filter(
                    Q(title__icontains=search)
                    | Q(slug__icontains=search)
                    | Q(translations__deleted_at__isnull=True)
                    & (
                        Q(translations__title__icontains=search)
                        | Q(translations__slug__icontains=search)
                    )
                )
                .distinct()
            )
        tag = filters.get("tag")
        if tag:
            qs = qs.filter(tags__slug=tag).distinct()
        qs = qs.prefetch_related("tags", "translations").order_by(
            "-published_at", "-created_at"
        )
        return qs

    @staticmethod
    def count_published():
        return Post.objects.filter(status=PUBLISHED_STATUS, published_at__isnull=False).count()

    @staticmethod
    def recent_published(limit):
        return list(
            BlogSelector.published_posts_qs()[: max(1, min(int(limit or 4), 12))]
        )


def now():
    return timezone.now()
