from django.db import models
from common.models import BaseModel


class Variant(BaseModel):
    class Availability(models.TextChoices):
        IN_STOCK = "in_stock", "In Stock"
        OUT_OF_STOCK = "out_of_stock", "Out of Stock"
        PRE_ORDER = "pre_order", "Pre‑order"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        DISCONTINUED = "discontinued", "Discontinued"

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="variants",
        db_index=True,
    )
    sku = models.CharField(max_length=100, unique=True, db_index=True)
    barcode = models.CharField(
        max_length=100, unique=True, db_index=True, null=True, blank=True
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    weight = models.PositiveIntegerField(
        default=500, help_text="Weight in grams"
    )  # or Decimal, but grams as integer is safe
    dimensions = models.JSONField(
        default=dict,
        blank=True,
        help_text='{"length": 100, "width": 50, "height": 30, "unit": "mm"}',
    )
    availability = models.CharField(
        max_length=20, choices=Availability.choices, default=Availability.IN_STOCK
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    metadata = models.JSONField(default=dict, blank=True)
    # Inventory will be linked later

    # inventory = models.ForeignKey(
    #     "inventory.Inventory",
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name="variants",
    #     help_text="Inventory record – managed by inventory domain",
    # )

    option_values = models.ManyToManyField(
        "product_options.OptionValue",
        through="VariantOption",
        related_name="variants",
    )

    class Meta:
        db_table = "variant"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product.title} – {self.sku}"


class VariantOption(models.Model):
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE)
    option = models.ForeignKey(
        "product_options.ProductOption", on_delete=models.CASCADE
    )
    option_value = models.ForeignKey(
        "product_options.OptionValue", on_delete=models.CASCADE
    )

    class Meta:
        db_table = "variant_option"
        unique_together = ("variant", "option")  # One value per option per variant

    def __str__(self):
        return f"{self.variant.sku}: {self.option.name} = {self.option_value.value}"
