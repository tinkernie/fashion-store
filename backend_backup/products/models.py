from django.db import models
from common.models import BaseModel


class Product(BaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    title = models.CharField(max_length=300)
    slug = models.SlugField(unique=True, db_index=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.PROTECT,
        related_name="products",
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )
    seo_metadata = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)  # extensible attributes

    class Meta:
        db_table = "product"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def delete(self, *args, **kwargs):
        # Override for soft delete (already in BaseModel). We'll keep it.
        super().delete(*args, **kwargs)
