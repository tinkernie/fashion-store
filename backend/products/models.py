from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
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

    # Discount fields - Toman integer precision
    discount_percent = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[
            MinValueValidator(1, message="درصد تخفیف باید حداقل ۱ درصد باشد."),
            MaxValueValidator(99, message="درصد تخفیف نمی‌تواند بیشتر از ۹۹ درصد باشد."),
        ],
        help_text="درصد تخفیف بین ۱ تا ۹۹",
    )
    discount_price = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        null=True,
        blank=True,
        help_text="مبلغ پس از تخفیف به تومان (محاسبه خودکار)",
    )
    discount_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="زمان پایان مهلت تخفیف (اختیاری)",
    )

    class Meta:
        db_table = "product"
        ordering = ["-created_at"]

    @property
    def is_discount_active(self) -> bool:
        """Check if discount is currently active and not expired."""
        if not self.discount_percent or not self.discount_price:
            return False
        if self.discount_expires_at and self.discount_expires_at < timezone.now():
            return False
        return True

    def calculate_discount_price(self, base_price: int) -> int:
        """Server-side calculation of rounded discounted price in Tomans."""
        if not self.discount_percent:
            return base_price
        factor = (100 - self.discount_percent) / 100.0
        return int(round(base_price * factor))

    def __str__(self):
        return self.title

    def delete(self, *args, **kwargs):
        # Override for soft delete (already in BaseModel). We'll keep it.
        super().delete(*args, **kwargs)


class ProductImage(BaseModel):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
        db_index=True,
    )
    image = models.FileField(upload_to="products/%Y/%m/", max_length=500, blank=True, null=True)
    image_url = models.CharField(max_length=1000, blank=True)
    alt_text = models.CharField(max_length=500, blank=True)
    position = models.PositiveIntegerField(default=0, db_index=True)
    is_cover = models.BooleanField(default=False)

    class Meta:
        db_table = "product_image"
        ordering = ["position", "created_at"]

    def __str__(self):
        return f"Image {self.position} for {self.product.title}"

    @property
    def url(self) -> str:
        if self.image:
            try:
                return self.image.url
            except Exception:
                pass
        return self.image_url or ""


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

