from django.db import models
from mptt.models import MPTTModel, TreeForeignKey
from common.models import BaseModel


class Category(BaseModel, MPTTModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField(db_index=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", null=True, blank=True)
    seo_metadata = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    parent = TreeForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="children",
        db_index=True,
    )

    class MPTTMeta:
        order_insertion_by = ["name"]

    class Meta:
        db_table = "category"
        verbose_name_plural = "categories"
        constraints = [
            models.UniqueConstraint(
                fields=["slug"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_category_slug_active",
            )
        ]

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        # Soft delete: hide from all selectors (deleted_at) and mark
        # inactive, preserving the MPTT tree structure.
        from django.utils import timezone

        self.is_active = False
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_active", "deleted_at", "updated_at"])
