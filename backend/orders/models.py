import uuid
from django.db import IntegrityError, models, transaction
from django.conf import settings
from django.utils import timezone
from common.models import BaseModel


class OrderChannel(models.TextChoices):
    """Where an order was created. Kept module-level because OrderSequence
    needs it before Order is defined."""

    ONLINE = "online", "Online store"
    POS = "pos", "In-store counter"


# Order-number prefixes per channel: MAVI-20261111-000042 / POS-20261111-000001
SEQUENCE_PREFIX = {
    OrderChannel.ONLINE: "MAVI",
    OrderChannel.POS: "POS",
}


class OrderSequence(models.Model):
    """Ensures unique sequential order numbers per day *per channel*.

    Counter sales and online sales count independently, so a busy POS day
    never consumes online numbers (and vice versa)."""

    date = models.DateField()
    channel = models.CharField(
        max_length=10, choices=OrderChannel.choices, default=OrderChannel.ONLINE
    )
    last_sequence = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "order_sequence"
        constraints = [
            models.UniqueConstraint(
                fields=["date", "channel"],
                name="unique_order_sequence_date_channel",
            )
        ]

    @classmethod
    def get_next_number(cls, channel: str = OrderChannel.ONLINE) -> str:
        today = timezone.localdate()
        channel = channel or OrderChannel.ONLINE
        with transaction.atomic():
            try:
                seq = cls.objects.select_for_update().get(date=today, channel=channel)
            except cls.DoesNotExist:
                # First order of the day for this channel. The savepoint keeps
                # a concurrent creator's IntegrityError from poisoning the
                # surrounding transaction (PostgreSQL).
                try:
                    with transaction.atomic():
                        seq = cls.objects.create(
                            date=today, channel=channel, last_sequence=0
                        )
                except IntegrityError:
                    seq = cls.objects.select_for_update().get(
                        date=today, channel=channel
                    )
                else:
                    seq = cls.objects.select_for_update().get(pk=seq.pk)
            seq.last_sequence += 1
            seq.save(update_fields=["last_sequence"])
            prefix = SEQUENCE_PREFIX.get(channel, "MAVI")
            return f"{prefix}-{today.strftime('%Y%m%d')}-{seq.last_sequence:06d}"


class Order(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        AWAITING_PAYMENT = "awaiting_payment", "Awaiting Payment"
        PAID = "paid", "Paid"
        PACKING = "packing", "Packing"
        SHIPPING = "shipping", "Shipping"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"
        RETURNED = "returned", "Returned"
        REFUNDED = "refunded", "Refunded"

    Channel = OrderChannel

    # Nullable: in-store (POS) sales may be fully anonymous walk-ins.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
        null=True,
        blank=True,
        db_index=True,
    )
    channel = models.CharField(
        max_length=10,
        choices=OrderChannel.choices,
        default=OrderChannel.ONLINE,
        db_index=True,
    )
    # Who rang the sale. Null for online orders.
    cashier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="pos_sales",
        null=True,
        blank=True,
    )
    # Cash-register terminal label (single store, so a plain string).
    pos_terminal = models.CharField(max_length=64, blank=True, default="")
    # Client-generated idempotency key: retrying "Confirm Sale" after a
    # timeout must not create a second sale.
    client_reference = models.CharField(
        max_length=64, null=True, blank=True, unique=True
    )
    # Optional phone typed at the counter for anonymous purchases.
    customer_phone = models.CharField(max_length=15, blank=True, default="")
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
    shipping_method = models.CharField(
        max_length=20, default="pishtaz", db_index=True,
        help_text="pishtaz (D+3 default) or vizheh (D+1 upgrade)",
    )
    shipping_detail = models.JSONField(
        default=dict, blank=True,
        help_text="Toman breakdown {base_fare, surcharge, insurance, packaging, total, zone, ...}",
    )
    # Optional link to the address-book entry the snapshot was built from
    # (traceability only — the JSON snapshot above stays the legal record).
    address = models.ForeignKey(
        "users.Address",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )

    coupon = models.ForeignKey(
        "coupons.Coupon",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    payment = models.ForeignKey(
        "payments.Payment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    notes = models.TextField(blank=True)

    placed_at = models.DateTimeField(default=timezone.now)
    paid_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "order"
        ordering = ["-placed_at"]

    def __str__(self):
        return f"Order {self.order_number} ({self.get_status_display()})"


class OrderItem(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    # For reference only – NOT used for display
    variant = models.ForeignKey(
        "variants.Variant",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )
    product_snapshot = (
        models.JSONField()
    )  # {'title': ..., 'options': 'Color: Red, Size: M', 'image': None, 'sku': '...'}
    quantity = models.PositiveIntegerField()
    price_snapshot = models.DecimalField(
        max_digits=10, decimal_places=2
    )  # unit price at purchase
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "order_item"

    def __str__(self):
        return f"{self.quantity}x {self.product_snapshot.get('title', 'Unknown')}"


class OrderStatusHistory(BaseModel):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="status_history"
    )
    from_status = models.CharField(
        max_length=20, choices=Order.Status.choices, null=True, blank=True
    )
    to_status = models.CharField(max_length=20, choices=Order.Status.choices)
    timestamp = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)

    class Meta:
        db_table = "order_status_history"
        ordering = ["timestamp"]
