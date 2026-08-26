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


class Review(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews",
        db_index=True,
    )
    user = models.ForeignKey(
        "common.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviews",
    )
    user_name = models.CharField(max_length=150, default="کاربر خریدار")
    rating = models.PositiveSmallIntegerField(default=5)
    text = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    class Meta:
        db_table = "product_review"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Review for {self.product.title} by {self.user_name} ({self.status})"

