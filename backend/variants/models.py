from django.db import IntegrityError, models, transaction
from common.models import BaseModel
from .barcodes import allocate_barcode


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
    # SKU uniqueness is partial (see Meta.constraints): soft-deleted variants
    # never block re-using the same SKU. Barcode uniqueness is *permanent*:
    # once a code is printed on a physical tag it must never be reissued to
    # another variant, even after the owning variant is soft-deleted.
    sku = models.CharField(max_length=100, db_index=True)
    # max_length stays 100 so legacy/hand-typed values keep fitting; newly
    # generated and API-supplied values are validated as EAN-13 in the
    # serializers/services layer.
    barcode = models.CharField(
        max_length=100, db_index=True, null=True, blank=True
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    weight = models.PositiveIntegerField(
        default=1, help_text="Weight in grams"
    )  # Toman spec: default 1g for shipping calc
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
        constraints = [
            models.UniqueConstraint(
                fields=["sku"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_variant_sku_active",
            ),
            # No deleted_at condition on purpose: a barcode lives on physical
            # labels, so soft deletion must not free it for reuse.
            models.UniqueConstraint(
                fields=["barcode"],
                name="uq_variant_barcode",
            ),
        ]

    def __str__(self):
        return f"{self.product.title} – {self.sku}"

    def save(self, *args, **kwargs):
        """Assign a barcode on every creation path, and make sure it is
        actually written when the caller saves with `update_fields` (a signal
        alone cannot widen `update_fields`)."""
        if not self.barcode:
            self.barcode = allocate_barcode()
            update_fields = kwargs.get("update_fields")
            if update_fields is not None and "barcode" not in update_fields:
                kwargs["update_fields"] = list(update_fields) + ["barcode"]
        super().save(*args, **kwargs)

    @property
    def is_placeholder(self) -> bool:
        """The product-managed DEFAULT variant is the common/price basis
        variant products/services.py seeds at creation; it is never itself
        purchasable and must not hold inventory."""
        return self.sku.endswith("-DEFAULT")


class BarcodeSequence(models.Model):
    """Single counter row per GS1 prefix, used for sequential in-store EAN-13
    allocation (`20` + 10 zero-padded digits + check digit).

    Allocation locks the row with SELECT FOR UPDATE, so two concurrent
    creations are serialized before the unique constraint is even consulted
    — no retry loop needed. Gaps are harmless (a failed insert rolls the
    counter back with the surrounding transaction).
    """

    prefix = models.CharField(max_length=3, unique=True)
    last_value = models.PositiveBigIntegerField(default=0)

    class Meta:
        db_table = "barcode_sequence"

    @classmethod
    def next_value(cls, prefix: str = "20") -> int:
        with transaction.atomic():
            # First allocation for a prefix: create the row. The nested atomic
            # keeps a concurrent-create IntegrityError from poisoning the
            # outer transaction.
            try:
                with transaction.atomic():
                    cls.objects.create(prefix=prefix, last_value=0)
            except IntegrityError:
                pass
            row = cls.objects.select_for_update().get(prefix=prefix)
            row.last_value += 1
            row.save(update_fields=["last_value"])
            return row.last_value


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
