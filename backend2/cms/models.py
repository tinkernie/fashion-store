from django.db import models
from common.models import BaseModel


class Page(BaseModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'

    title = models.CharField(max_length=300)
    slug = models.SlugField(unique=True, db_index=True)
    content = models.JSONField(default=list, blank=True)  # list of block objects
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    seo_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'cms_page'
        ordering = ['title']

    def __str__(self):
        return self.title


class SiteContent(BaseModel):
    """
    Key-value store for global site sections.
    Expected keys: 'homepage', 'header', 'footer', 'announcement'.
    The latest updated record for each key is used.
    """
    key = models.CharField(max_length=100, db_index=True)
    content = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'cms_site_content'
        unique_together = ('key',)  # ensures only one row per key, but we allow updates

    def __str__(self):
        return f"SiteContent: {self.key}"
