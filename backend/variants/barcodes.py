"""Barcode generation for product variants.

The printing/labeling stack does not exist yet, so values are random — but
they are generated as **valid EAN-13 numbers inside the reserved in-store
band (2000000000000–2999999999999 + check digit rules)**. That way, whichever
barcode printer is bought later (EAN-13, Code 128 on top of the same digits,
plain text, PDF labels ...) can print and scan them without any data change,
and they can never collide with real retail GTINs scanned from supplier
packaging.

Uniqueness: `Variant` already carries a partial unique constraint
(`uq_variant_barcode_active`, active rows only). Generation retries a few
times with a DB-existence pre-check so the constraint is only a race-guard.
"""
import secrets

# EAN-13: 12 data digits + 1 check digit. Prefix "20" pins the value to the
# 200–299 band reserved for internally assigned barcode numbers, leaving a
# 10-digit random space (~1e10).
IN_STORE_PREFIX = "20"
DATA_DIGITS = 10
MAX_ATTEMPTS = 10

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


def generate_ean13() -> str:
    data12 = IN_STORE_PREFIX + "".join(secrets.choice(_DIGITS) for _ in range(DATA_DIGITS))
    return data12 + _check_digit(data12)


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
    """Fill `instance.barcode` with a unique random EAN-13 when it is empty
    (NULL or blank). Explicit, non-empty values are never overwritten.
    Returns True when a value was assigned."""
    if getattr(instance, "barcode", None):
        return False
    cls = instance.__class__

    def is_taken(candidate: str) -> bool:
        # Soft-delete filtered on live models; historical (migration) models
        # use the plain manager, which is stricter only.
        return cls._default_manager.filter(barcode=candidate).exists()

    instance.barcode = assign_unique_barcode(is_taken)
    return True
