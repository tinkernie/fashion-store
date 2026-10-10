from django.db import models
from common.models import BaseModel


class Page(BaseModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'

    title = models.CharField(max_length=300)
    slug = models.SlugField(db_index=True)
    content = models.JSONField(default=list, blank=True)  # list of block objects
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    seo_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'cms_page'
        ordering = ['title']
        constraints = [
            models.UniqueConstraint(
                fields=['slug'],
                condition=models.Q(deleted_at__isnull=True),
                name='uq_page_slug_active',
            )
        ]

    def __str__(self):
        return self.title


class SiteContent(BaseModel):
    """
    Key-value store for global site sections edited by merchandiser without deploy.
    Step 1 (split usage): static pages like 'about/contact' should be hardcoded
    in frontend (Next.js), NOT as Page rows. CMS is only for dynamic sections:
    'homepage', 'header', 'footer', 'announcement', 'discount_section'.
    The latest updated record for each key is used.
    """
    HOMEPAGE = "homepage"
    HERO = "hero"
    HEADER = "header"
    FOOTER = "footer"
    ANNOUNCEMENT = "announcement"
    DISCOUNT_SECTION = "discount_section"

    ALLOWED_KEYS = (HOMEPAGE, HERO, HEADER, FOOTER, ANNOUNCEMENT, DISCOUNT_SECTION)

    key = models.CharField(
        max_length=100,
        db_index=True,
        help_text="One of: homepage, hero, header, footer, announcement, discount_section",
    )
    content = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'cms_site_content'
        # Partial uniqueness: only one ACTIVE row per key; soft-deleted
        # history never blocks re-creating the key.
        constraints = [
            models.UniqueConstraint(
                fields=['key'],
                condition=models.Q(deleted_at__isnull=True),
                name='uq_sitecontent_key_active',
            )
        ]

    def __str__(self):
        return f"SiteContent: {self.key}"
