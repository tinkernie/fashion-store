import uuid
from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
from common.models import BaseModel

class OrderSequence(models.Model):
    """Ensures unique sequential order numbers per day."""
    date = models.DateField(unique=True)
    last_sequence = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'order_sequence'

    @classmethod
    def get_next_number(cls) -> str:
        today = timezone.localdate()
        with transaction.atomic():
            seq, _ = cls.objects.select_for_update().get_or_create(date=today)
            seq.last_sequence += 1
            seq.save()
            return f"LUX-{today.strftime('%Y%m%d')}-{seq.last_sequence:06d}"


class Order(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        AWAITING_PAYMENT = 'awaiting_payment', 'Awaiting Payment'
        PAID = 'paid', 'Paid'
        PACKING = 'packing', 'Packing'
        SHIPPING = 'shipping', 'Shipping'
        DELIVERED = 'delivered', 'Delivered'
        CANCELLED = 'cancelled', 'Cancelled'
        RETURNED = 'returned', 'Returned'
        REFUNDED = 'refunded', 'Refunded'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='orders',
        db_index=True,
    )
    order_number = models.CharField(max_length=30, unique=True, editable=False)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    shipping_address = models.JSONField(default=dict)
    billing_address = models.JSONField(default=dict, blank=True)

    coupon = models.ForeignKey(
        'coupons.Coupon',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
    )
    payment = models.ForeignKey(
        'payments.Payment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
    )
    notes = models.TextField(blank=True)

    placed_at = models.DateTimeField(default=timezone.now)
    paid_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'order'
        ordering = ['-placed_at']

    def __str__(self):
        return f"Order {self.order_number} ({self.get_status_display()})"


class OrderItem(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    # For reference only – NOT used for display
    variant = models.ForeignKey(
        'variants.Variant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_items',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_items',
    )
    product_snapshot = models.JSONField()  # {'title': ..., 'options': 'Color: Red, Size: M', 'image': None, 'sku': '...'}
    quantity = models.PositiveIntegerField()
    price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)  # unit price at purchase
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'order_item'

    def __str__(self):
        return f"{self.quantity}x {self.product_snapshot.get('title', 'Unknown')}"


class OrderStatusHistory(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    from_status = models.CharField(max_length=20, choices=Order.Status.choices, null=True, blank=True)
    to_status = models.CharField(max_length=20, choices=Order.Status.choices)
    timestamp = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)

    class Meta:
        db_table = 'order_status_history'
        ordering = ['timestamp']