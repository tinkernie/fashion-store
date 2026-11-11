"""Scanner-facing variant payload, shared by the admin barcode lookup and the
POS scan endpoint so the two can never drift apart."""


def scanner_payload(variant) -> dict:
    inventory = getattr(variant, "inventory", None)
    available = inventory.available_quantity if inventory else 0
    reserved = inventory.reserved_quantity if inventory else 0
    sellable = max(available - reserved, 0)
    is_active = (
        variant.deleted_at is None and variant.product.deleted_at is None
    )
    return {
        "id": str(variant.id),
        "barcode": variant.barcode,
        "sku": variant.sku,
        "product_id": str(variant.product_id),
        "product_title": variant.product.title,
        "product_slug": variant.product.slug,
        "price": int(variant.price),
        "status": variant.status,
        "availability": variant.availability,
        "is_active": is_active,
        # `stock` kept for backwards compatibility: physical units on hand.
        "stock": available,
        "reserved": reserved,
        "sellable": sellable,
        # Units exist on the shelf (reserved ones may still need an override).
        "is_sellable": is_active
        and variant.status == "published"
        and available > 0,
        "options": [
            {
                "option_name": item.option.name,
                "value": item.option_value.value,
            }
            for item in variant.variantoption_set.all()
        ],
    }
