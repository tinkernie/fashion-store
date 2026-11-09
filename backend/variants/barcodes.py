"""Barcode generation for product variants.

Values are valid **EAN-13 numbers inside the reserved in-store band
(2000000000000–2999999999999 + check digit rules)**, so whichever barcode
printer is bought later (EAN-13, Code 128 on top of the same digits, plain
text, PDF labels ...) can print and scan them without any data change, and
they can never collide with real retail GTINs scanned from supplier
packaging.

Allocation is **sequential** and race-free: `BarcodeSequence` (one row per
prefix, locked with SELECT FOR UPDATE) hands out `20` + a zero-padded
10-digit counter + check digit. The `uq_variant_barcode` constraint is
permanent (soft-deleted rows keep their code) and stays the final arbiter.

`assign_unique_barcode` / `generate_ean13` remain for data migrations and
one-off scripts that must not depend on the live model.
"""
import secrets

from django.core.exceptions import ValidationError

# EAN-13: 12 data digits + 1 check digit. Prefix "20" pins the value to the
# 200–299 band reserved for internally assigned barcode numbers, leaving a
# 10-digit counter space (10 billion labels).
IN_STORE_PREFIX = "20"
DATA_DIGITS = 10
MAX_ATTEMPTS = 10
MAX_COUNTER = 10**DATA_DIGITS - 1

_DIGITS = "0123456789"


def _check_digit(data12: str) -> str:
    """EAN-13 check digit (odd positions weight 1, even positions weight 3)."""
    total = sum(int(d) * (1 if i % 2 == 0 else 3) for i, d in enumerate(data12))
    return str((10 - total % 10) % 10)


def is_valid_ean13(value: str) -> bool:
    return (
        isinstance(value, str)
        and len(value) == 13
        and value.isdigit()
        and _check_digit(value[:12]) == value[12]
    )


def validate_ean13(value: str) -> str:
    """Serializer/model-boundary validator. Empty values pass through so
    callers can still submit "no barcode" and let one be assigned."""
    if value in (None, ""):
        return value
    if not is_valid_ean13(str(value)):
        raise ValidationError(
            "بارکد باید یک عدد ۱۳ رقمی معتبر EAN-13 باشد.",
            code="invalid_ean13",
        )
    return value


def generate_ean13() -> str:
    data12 = IN_STORE_PREFIX + "".join(secrets.choice(_DIGITS) for _ in range(DATA_DIGITS))
    return data12 + _check_digit(data12)


def barcode_from_counter(value: int, prefix: str = IN_STORE_PREFIX) -> str:
    """Build the printable EAN-13 for a sequence value."""
    if not 1 <= value <= MAX_COUNTER:
        raise ValueError("Barcode counter exhausted for prefix %s" % prefix)
    data12 = f"{prefix}{value:0{DATA_DIGITS}d}"
    return data12 + _check_digit(data12)


def allocate_barcode() -> str:
    """Next sequential in-store EAN-13.

    Skips any value already present in the table (all rows, including
    soft-deleted, because uniqueness is permanent). The sequence row lock
    serializes writers, and the input check runs while that lock is held, so
    sequential allocations can never hand out the same code twice.
    """
    from .models import BarcodeSequence, Variant

    while True:
        value = BarcodeSequence.next_value(IN_STORE_PREFIX)
        candidate = barcode_from_counter(value)
        if not Variant.all_objects.filter(barcode=candidate).exists():
            return candidate


def assign_unique_barcode(is_taken, max_attempts: int = MAX_ATTEMPTS) -> str:
    """Random EAN-13 that does not exist yet. `is_taken` is a predicate over
    candidate values (DB/existence check supplied by the caller, so the
    helper also works inside migrations with historical models)."""
    for _ in range(max_attempts):
        candidate = generate_ean13()
        if not is_taken(candidate):
            return candidate
    # Do not raise on the astronomically unlikely all-collisions case; the
    # unique constraint stays the final arbiter.
    return generate_ean13()


def ensure_barcode(instance) -> bool:
    """Fill `instance.barcode` when it is empty (NULL or blank). Explicit,
    non-empty values are never overwritten. Returns True when assigned."""
    if getattr(instance, "barcode", None):
        return False
    instance.barcode = allocate_barcode()
    return True
