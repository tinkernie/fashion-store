ORDER_STATUS_MAP_FA = {
    "pending": "در انتظار پرداخت",
    "awaiting_payment": "در انتظار پرداخت",
    "paid": "پرداخت تایید شده",
    "packing": "در حال آماده‌سازی و بسته‌بندی",
    "processing": "در حال پردازش در انبار",
    "shipping": "تحویل به شرکت پست / در حال ارسال",
    "shipped": "تحویل به شرکت پست",
    "delivered": "تحویل داده شده به مشتری",
    "cancelled": "لغو شده",
    "returned": "مرجوع شده",
    "refunded": "مسترد شده",
}

def get_persian_status(status_key: str) -> str:
    if not status_key:
        return ""
    return ORDER_STATUS_MAP_FA.get(str(status_key).lower().strip(), status_key)
