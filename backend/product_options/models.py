from django.db import models
from common.models import BaseModel


class ProductOption(BaseModel):
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="options",
        db_index=True,
    )
    name = models.CharField(max_length=100)
    display_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        db_table = "product_option"
        ordering = ["display_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["product", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_productoption_product_name_active",
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.product.title})"


class OptionValue(BaseModel):
    option = models.ForeignKey(
        ProductOption,
        on_delete=models.CASCADE,
        related_name="values",
        db_index=True,
    )
    value = models.CharField(max_length=200)
    display_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        db_table = "option_value"
        ordering = ["display_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["option", "value"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_optionvalue_option_value_active",
            )
        ]

    def __str__(self):
        return f"{self.value} ({self.option.name})"
