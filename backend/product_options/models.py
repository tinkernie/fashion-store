from django.db import models
from common.models import BaseModel

class ProductOption(BaseModel):
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='options',
        db_index=True,
    )
    name = models.CharField(max_length=100)
    display_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        db_table = 'product_option'
        ordering = ['display_order']
        unique_together = ('product', 'name')

    def __str__(self):
        return f"{self.name} ({self.product.title})"


class OptionValue(BaseModel):
    option = models.ForeignKey(
        ProductOption,
        on_delete=models.CASCADE,
        related_name='values',
        db_index=True,
    )
    value = models.CharField(max_length=200)
    display_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        db_table = 'option_value'
        ordering = ['display_order']
        unique_together = ('option', 'value')

    def __str__(self):
        return f"{self.value} ({self.option.name})"