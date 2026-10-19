from django.db import models
from django.conf import settings
from django.db.models import Q
from common.models import BaseModel


TRANSLATION_LANGS = ("en", "ar")


class BlogLanguage(models.TextChoices):
    FA = "fa", "Persian"
    EN = "en", "English"
    AR = "ar", "Arabic"


class Tag(BaseModel):
    """Blog tag. Shared across languages via slug; display name is Persian-first
    (`name`), optional `name_en`/`name_ar` surface the translated label."""

    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, db_index=True)
    name_en = models.CharField(max_length=120, blank=True, default="")
    name_ar = models.CharField(max_length=120, blank=True, default="")

    class Meta:
        db_table = "blog_tag"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["slug"],
                condition=Q(deleted_at__isnull=True),
                name="uq_blogtag_slug_active",
            )
        ]

    def __str__(self):
        return self.name

    def name_for(self, lang: str) -> str:
        if lang == "en" and self.name_en:
            return self.name_en
        if lang == "ar" and self.name_ar:
            return self.name_ar
        return self.name


class Post(BaseModel):
    """Blog post. Base fields are the default language (fa).
    `en`/`ar` variants live in PostTranslation."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=320, db_index=True)
    # fa (default) content
    body_html = models.TextField(blank=True, default="")
    excerpt = models.CharField(max_length=500, blank=True, default="", db_index=True)
    meta_title = models.CharField(max_length=200, blank=True, default="")
    meta_description = models.CharField(max_length=320, blank=True, default="")
    reading_minutes = models.PositiveIntegerField(default=1, db_index=True)
    # shared across languages
    cover_image = models.CharField(
        max_length=1000,
        blank=True,
        default="",
        help_text="WebP image URL: media-library upload or CDN link (landscape/16:9 recommended).",
    )
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="blog_posts",
    )
    tags = models.ManyToManyField("blog.Tag", blank=True, related_name="posts")

    class Meta:
        db_table = "blog_post"
        ordering = ["-published_at", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["slug"],
                condition=Q(deleted_at__isnull=True),
                name="uq_blogpost_slug_active",
            )
        ]
        indexes = [
            models.Index(fields=["status", "published_at"]),
        ]

    def __str__(self):
        return self.title

    @property
    def is_published(self) -> bool:
        return self.status == self.Status.PUBLISHED and self.published_at is not None


class PostTranslation(BaseModel):
    """Translation of a blog post into `en` / `ar`.
    The `fa` version lives on Post itself."""

    post = models.ForeignKey(
        "blog.Post", on_delete=models.CASCADE, related_name="translations"
    )
    language = models.CharField(max_length=5, choices=BlogLanguage.choices, db_index=True)
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=320, db_index=True)
    body_html = models.TextField(blank=True, default="")
    excerpt = models.CharField(max_length=500, blank=True, default="", db_index=True)
    meta_title = models.CharField(max_length=200, blank=True, default="")
    meta_description = models.CharField(max_length=320, blank=True, default="")
    reading_minutes = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = "blog_post_translation"
        ordering = ["language"]
        constraints = [
            models.UniqueConstraint(
                fields=["post", "language"],
                condition=Q(deleted_at__isnull=True),
                name="uq_blogtranslation_post_lang_active",
            ),
            models.UniqueConstraint(
                fields=["language", "slug"],
                condition=Q(deleted_at__isnull=True),
                name="uq_blogtranslation_lang_slug_active",
            ),
        ]
        indexes = [
            models.Index(fields=["language", "slug"]),
        ]

    def __str__(self):
        return f"{self.post_id}:{self.language}"


class PostSlugHistory(BaseModel):
    """Slug change log per language, for 301 redirects on the frontend."""

    post = models.ForeignKey(
        "blog.Post", on_delete=models.CASCADE, related_name="slug_history"
    )
    language = models.CharField(max_length=5, choices=BlogLanguage.choices)
    old_slug = models.CharField(max_length=320, db_index=True)
    new_slug = models.CharField(max_length=320)

    class Meta:
        db_table = "blog_post_slug_history"
        indexes = [
            models.Index(fields=["language", "old_slug"]),
        ]

    def __str__(self):
        return f"{self.language}: {self.old_slug} -> {self.new_slug}"
