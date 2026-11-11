"""Solar Hijri (Jalali) dates and Persian number formatting.

Used by printed invoices and receipts. Deliberately dependency-free: the
conversion is the standard Borkowski/jalaali algorithm, enough for display.
"""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

try:  # Windows needs the `tzdata` package; fall back to Iran's post-2022 offset.
    TEHRAN_TZ = ZoneInfo("Asia/Tehran")
except Exception:  # pragma: no cover - only on hosts without tz data
    TEHRAN_TZ = timezone(timedelta(hours=3, minutes=30), "Iran")

JALALI_MONTHS = (
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
)

_PERSIAN_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")


def to_persian_digits(value) -> str:
    return str(value).translate(_PERSIAN_DIGITS)


def gregorian_to_jalali(gy: int, gm: int, gd: int) -> tuple[int, int, int]:
    """Convert a Gregorian date to (year, month, day) in the Solar Hijri calendar."""
    days_in_month = (0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334)
    gy2 = gy - 1600
    gm2 = gm - 1
    gd2 = gd - 1

    g_day_no = (
        365 * gy2
        + (gy2 + 3) // 4
        - (gy2 + 99) // 100
        + (gy2 + 399) // 400
    )
    g_day_no += days_in_month[gm2] + gd2
    if gm > 2 and ((gy % 4 == 0 and gy % 100 != 0) or gy % 400 == 0):
        g_day_no += 1

    j_day_no = g_day_no - 79
    j_np = j_day_no // 12053
    j_day_no %= 12053
    jy = 979 + 33 * j_np + 4 * (j_day_no // 1461)
    j_day_no %= 1461

    if j_day_no >= 366:
        jy += (j_day_no - 1) // 365
        j_day_no = (j_day_no - 1) % 365

    if j_day_no < 186:
        jm = 1 + j_day_no // 31
        jd = 1 + j_day_no % 31
    else:
        jm = 7 + (j_day_no - 186) // 30
        jd = 1 + (j_day_no - 186) % 30

    return jy, jm, jd


def format_jalali(dt: datetime, with_time: bool = True) -> str:
    """Format an aware datetime as `۱۴۰۵/۰۸/۲۰ - ۱۴:۳۲` in Tehran time."""
    if dt is None:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    local = dt.astimezone(TEHRAN_TZ)
    jy, jm, jd = gregorian_to_jalali(local.year, local.month, local.day)
    date_part = to_persian_digits(f"{jy}/{jm:02d}/{jd:02d}")
    if not with_time:
        return date_part
    return f"{date_part} - {to_persian_digits(local.strftime('%H:%M'))}"


def format_money(amount, currency: str = "تومان") -> str:
    """`250000` -> `۲۵۰٬۰۰۰ تومان` (integer toman, Persian thousands mark)."""
    if amount is None:
        return ""
    value = int(round(float(amount)))
    grouped = f"{value:,}".replace(",", "٬")
    grouped = to_persian_digits(grouped)
    return f"{grouped} {currency}".strip()
