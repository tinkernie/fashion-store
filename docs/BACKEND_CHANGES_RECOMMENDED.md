# Recommended Backend Changes for Fashion Store

This document outlines the exact backend adjustments recommended to support relaxed password validation, accurate simple-product stock calculation, and immediate storefront cache invalidation.

---

## 1. Password Length Relaxation (Minimum 6 Characters)
### File: `backend/authentication/validators.py`
**Current state**:
```python
class PasswordValidator:
    MIN_LENGTH = 8
    MAX_LENGTH = 128
```
**Change needed**:
Update `MIN_LENGTH` from `8` to `6`:
```python
class PasswordValidator:
    MIN_LENGTH = 6
    MAX_LENGTH = 128
```
**Reason**:
Aligns with the frontend policy of allowing user-friendly passwords (e.g. `taha1380`, `123456`) without arbitrary length hurdles. Notice that complex character restrictions (uppercase, special characters) are already commented out in `PasswordValidator.validate`.

---

## 2. Total Stock Calculation for Simple Products
### File: `backend/products/serializers.py`
**Current state** (`_get_total_stock` method, lines 237–244):
```python
def _get_total_stock(self, product):
    total = 0
    for variant in product.variants.filter(
        deleted_at__isnull=True
    ).exclude(sku__endswith="-DEFAULT"):
        if hasattr(variant, "inventory") and variant.inventory:
            total += variant.inventory.available_quantity
    return total
```
**Problem**:
When a product has no option variants (i.e. It is a simple product like a perfume, scarf, or single coat that only has the system-seeded `{slug}-DEFAULT` variant), `exclude(sku__endswith="-DEFAULT")` leaves an empty queryset. The method returns `0`, causing the serializer to set `stock_quantity: 0` and Schema.org `OutOfStock` ("ناموجود"), even if stock was allocated to the default variant.

**Change needed**:
```python
def _get_total_stock(self, product):
    real_variants = product.variants.filter(
        deleted_at__isnull=True
    ).exclude(sku__endswith="-DEFAULT")
    
    if real_variants.exists():
        total = 0
        for variant in real_variants:
            if hasattr(variant, "inventory") and variant.inventory:
                total += variant.inventory.available_quantity
        return total

    # Fallback for simple products: check the DEFAULT placeholder variant
    default_var = product.variants.filter(
        deleted_at__isnull=True, sku__endswith="-DEFAULT"
    ).first()
    if default_var and hasattr(default_var, "inventory") and default_var.inventory:
        return default_var.inventory.available_quantity

    return 0
```

---

## 3. View Cache Invalidation on Catalog Mutations
### File: `backend/products/services.py`
**Current state**:
In `ProductService.create_product`, `update_product`, `delete_product`, and `archive_product`, cache invalidation only clears:
```python
cache.delete_pattern("luxe:products:*")
cache.delete_pattern("luxe:categories:*")
```
**Problem**:
The public endpoint `/api/products/` is decorated with `@method_decorator(cache_page(300))`. In Django, `cache_page` stores view keys under `views.decorators.cache.*` (or prefixed `luxe:*:views.decorators.cache.*`). Because those view keys are never cleared during mutations, the storefront continues to serve stale catalog listings for up to 300 seconds (5 minutes) after an admin creates, updates, or changes product stock.

**Change needed**:
In `backend/products/services.py`, create a centralized cache purge helper and invoke it on all write operations:
```python
def _purge_product_view_caches():
    try:
        from django.core.cache import cache
        cache.delete_pattern("luxe:products:*")
        cache.delete_pattern("luxe:categories:*")
        cache.delete_pattern("views.decorators.cache.*")
        cache.delete_pattern("luxe:*:views.decorators.cache.*")
    except Exception:
        pass
```
Call `_purge_product_view_caches()` inside:
- `create_product`
- `update_product`
- `delete_product`
- `archive_product`
- `set_status`

---

## 4. Run Pending Database Migrations
Run the pending migrations on the production server to ensure the database schema matches current models:
```bash
python manage.py migrate
```
Specifically applies:
- `products.0010_product_insta_id`
- `products.0011_delete_placeholder_inventories`
- `products.0012_product_discount_source`
- `variants.0005_backfill_variant_barcodes`
- `common.0006_user_birth_day_user_birth_month_user_birth_year`
