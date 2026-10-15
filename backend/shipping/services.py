"""Post shipping quotes (نرخنامه 1405).

Pure computation over rates.py: zone from the destination province name,
weight from cart variants (grams), declared value from the merchandise
subtotal. Money: rates are Rials (per the PDF), API answers are Tomans.
"""
from decimal import Decimal

from django.conf import settings

from common.exceptions import BusinessException
from . import rates

# Defaults mirror the owner-confirmed geography; overridable in settings
# without a code change (e.g. SHIPPING_NEIGHBOR_PROVINCES=[...]).
DEFAULT_STORE_PROVINCE = "زنجان"
DEFAULT_NEIGHBORS = [
    "آذربایجان غربی", "آذربایجان شرقی", "اردبیل", "گیلان",
    "قزوین", "همدان", "کردستان",
]
DEFAULT_METRO_20 = ["تهران", "البرز"]
DEFAULT_METRO_15 = ["خراسان رضوی", "اصفهان", "فارس",
                    "آذربایجان شرقی", "خوزستان", "قم"]
DEFAULT_REMOTE_5 = ["کرمان", "سیستان و بلوچستان", "خراسان جنوبی",
                    "سمنان", "یزد"]


def _setting(name: str, default):
    return getattr(settings, name, default)


def resolve_zone(province_name: str) -> str:
    """Map a destination province name to a tariff zone."""
    name = (province_name or "").strip()
    if not name:
        raise BusinessException("Destination province is required.")
    if name == _setting("SHIPPING_STORE_PROVINCE", DEFAULT_STORE_PROVINCE):
        return rates.ZONE_INTRA
    if name in _setting("SHIPPING_NEIGHBOR_PROVINCES", DEFAULT_NEIGHBORS):
        return rates.ZONE_NEIGHBOR
    return rates.ZONE_FAR


def surcharge_percent(province_name: str) -> int:
    """Table 6 rows 24-25 on the base fare. Metro lists win; no stacking."""
    name = (province_name or "").strip()
    if name in _setting("SHIPPING_METRO_20", DEFAULT_METRO_20):
        return rates.SURCHARGE_METRO_20
    if name in _setting("SHIPPING_METRO_15", DEFAULT_METRO_15):
        return rates.SURCHARGE_METRO_15
    if name in _setting("SHIPPING_REMOTE_5", DEFAULT_REMOTE_5):
        return rates.SURCHARGE_REMOTE_5
    return 0


def insurance_rials(declared_rials: int) -> int:
    """Compulsory parcel fee + declared-value bracket (Table 7 rows 2+4)."""
    total = rates.INSURANCE_COMPULSORY_RIALS
    if declared_rials > 0:
        for upper, rate in rates.INSURANCE_BRACKETS:
            if declared_rials <= upper:
                total += round(declared_rials * rate)
                break
        else:
            total += round(declared_rials * rates.INSURANCE_BRACKETS[-1][1])
    return int(total)


def quote(province_name: str, weight_grams: int, subtotal_tomans,
          method_code: str = None) -> dict:
    """Full quote: both methods (default first) or one. Tomans throughout."""
    zone = resolve_zone(province_name)
    pct = surcharge_percent(province_name)
    try:
        declared_rials = max(0, int(round(float(subtotal_tomans))) * 10)
    except Exception:
        declared_rials = 0
    codes = [method_code] if method_code else [rates.METHOD_PISHTAZ, rates.METHOD_VIZHEH]
    options = []
    for code in codes:
        table = rates.METHODS.get(code)
        if not table:
            raise BusinessException(f"Unknown shipping method '{code}'.")
        if weight_grams <= 0:
            raise BusinessException("Parcel weight must be positive.")
        extra_units = max(0, weight_grams - 1000)
        extra_units = (extra_units + 999) // 1000
        base = table["base_1kg"][zone] + extra_units * table["per_kg"][zone]
        surcharge = round(base * pct / 100)
        insurance = insurance_rials(declared_rials)
        packaging = rates.PACKAGING_RIALS
        total_rials = base + surcharge + insurance + packaging
        options.append({
            "method": table["code"],
            "name": table["name"],
            "name_en": table["name_en"],
            "eta_days": table["eta_days"],
            "zone": zone,
            "base_fare": base // 10,
            "surcharge": surcharge // 10,
            "surcharge_percent": pct,
            "insurance": insurance // 10,
            "packaging": packaging // 10,
            "total": total_rials // 10,
            "currency": "Toman",
        })
    selected = options[0]
    return {
        "province": (province_name or "").strip(),
        "zone": zone,
        "weight_grams": weight_grams,
        "default_method": rates.METHOD_PISHTAZ,
        "selected": selected,
        "options": options,
    }


def cart_totals(user, session_key: str = None) -> tuple:
    """(weight_grams, subtotal_tomans) for the user's active (or guest) cart."""
    from cart.models import Cart

    cart = None
    if user is not None and getattr(user, "is_authenticated", False):
        cart = Cart.objects.filter(user=user).first()
    if cart is None and session_key:
        cart = Cart.objects.filter(session_key=session_key).first()
    if cart is None:
        raise BusinessException("Cart is empty.")
    weight, subtotal = 0, Decimal("0.00")
    items = list(cart.items.select_related("variant").all())
    if not items:
        raise BusinessException("Cart is empty.")
    for item in items:
        variant = item.variant
        try:
            weight += int(variant.weight or 0) * int(item.quantity)
        except Exception:
            pass
        try:
            subtotal += Decimal(str(item.price_snapshot)) * int(item.quantity)
        except Exception:
            pass
    return weight, subtotal
