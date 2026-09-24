from django.db import models
from mptt.models import MPTTModel, TreeForeignKey
from common.models import BaseModel


class Category(BaseModel, MPTTModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, db_index=True)
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

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        # Soft delete: set is_active=False and save, preserving tree
        self.is_active = False
        self.save(update_fields=["is_active", "updated_at"])
