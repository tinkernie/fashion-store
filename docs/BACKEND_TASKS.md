# Backend Engineering Tasks & API Requirements

> **Status:** Pending Backend Execution  
> **Target App:** `users` / `common`  
> **Context:** Frontend e-commerce workflows have migrated to OTP-first signup. This document defines the backend schema and serializer updates needed to support user profile emails without breaking SMS-based auth.

---

## 1. User Model: Email Field Addition

### Objective
Allow authenticated users who sign up via phone OTP to add and update an email address from their profile settings.

### Schema Changes (`common/models.py`)
Add an optional, nullable email field to `common.User`:

```python
# In common/models.py -> class User(BaseModel, AbstractBaseUser, PermissionsMixin)
email = models.EmailField(
    max_length=255,
    unique=True,
    null=True,
    blank=True,
    db_index=True,
    help_text="User email address (optional, added post-signup via profile).",
)
```

### Constraints & Invariants
- Conditionally unique for non-null/non-empty values:
  ```python
  models.UniqueConstraint(
      fields=["email"],
      name="unique_user_email_non_null",
      condition=models.Q(email__isnull=False) & ~models.Q(email=""),
      violation_error_message="A user with this email address already exists.",
  )
  ```
- Soft-delete aware: ensure `deleted_at IS NULL` condition if soft-deleted rows should not block email reuse.

---

## 2. Serializers & API Endpoints

### Update `backend/users/serializers.py`
1. **`UserProfileSerializer`**:
   Expose `email` in read responses:
   ```python
   email = serializers.EmailField(read_only=True)
   ```
2. **`UpdateProfileSerializer`**:
   Allow updating email via `PATCH /api/users/me/`:
   ```python
   email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
   ```

### Validation & Verification
- Test duplicate email rejection with friendly `400 BusinessException` ("A user with this email already exists.").
- Ensure existing phone-only OTP users are unaffected by the migration.

---

## 3. Product Relations: Support Empty `target_ids: []` on POST

### Objective
Allow clearing all pins/relations for a product via `POST /api/admin/products/<id>/complete-look/` and `POST /api/admin/products/<id>/related/` without rejecting empty payloads with `400 Bad Request ("target_ids required.")`.

### Required Updates (`backend/products/views.py`)
Currently:
```python
# Lines 389-390 & 530-531:
if not isinstance(target_ids, list) or not target_ids:
    return Response({"detail": "target_ids required."}, status=status.HTTP_400_BAD_REQUEST)
```
Update to:
```python
if not isinstance(target_ids, list):
    return Response({"detail": "target_ids must be a list."}, status=status.HTTP_400_BAD_REQUEST)
```
When `target_ids` is `[]`:
- All existing relations for that product and relation type (`COMPLETE_LOOK` or `SUGGESTED`) are deleted.
- Cache keys for that product are invalidated.
- Response returns `[]` with `HTTP 200 OK`.

---

## 4. [RESOLVED - Commit `33a208b`] Collection Hero Banner: Accept Media URL Strings on Serializer

### Status: Resolved
Implemented by TinkErnie in commit `33a208b` (`fix(collections): accept media-library URL or file upload for hero_banner`) via `HeroBannerField` in `backend/store_collections/serializers.py`. Handles both multipart file uploads and media-library/remote URL strings. Frontend passes `payload.hero_banner` directly alongside `seo_metadata.hero_banner` fallback.

---

## 5. Enrich Collection Detail Products with Category, Discount, and Stock Status

### Objective
In `GET /api/collections/<slug>/`, each item in the `products` list currently only returns basic fields (`id`, `title`, `name`, `slug`, `price`, `image_url`, `imageUrl`, `position`).
Enrich the serialized products to include category details, discount information, and inventory/stock status so the frontend collection client can offer rich facet filtering (by category, in-stock, and discounts) and render accurate discount badges.

### Target Location (`backend/store_collections/serializers.py`)
In `CollectionDetailSerializer.get_products(self, obj)`:
```python
# Currently:
results.append({
    "id": str(p.id),
    "title": p.title,
    "name": p.title,
    "slug": p.slug,
    "price": price,
    "image_url": image_url,
    "imageUrl": image_url,
    "position": link.position,
})
```

### Required Fields to Add:
1. **Category**:
   ```python
   category_data = None
   if getattr(p, "category", None):
       category_data = {
           "id": str(p.category.id),
           "name": p.category.name,
           "slug": p.category.slug,
       }
   ```
2. **Discounts**:
   ```python
   discount_percent = getattr(p, "discount_percent", None)
   discount_price = str(p.discount_price) if getattr(p, "discount_price", None) else None
   ```
3. **Stock Status**:
   ```python
   # Determine if product has stock in any active variant
   is_in_stock = True
   if hasattr(p, "variants"):
       active_variants = p.variants.filter(deleted_at__isnull=True)
       if active_variants.exists():
           is_in_stock = any(v.stock > 0 for v in active_variants if hasattr(v, "stock"))
   ```
4. **Created Timestamp**:
   ```python
   created_at = p.created_at.isoformat() if hasattr(p, "created_at") and p.created_at else None
   ```

### Query Optimization Hint
Ensure `product_links.select_related("product", "product__category").prefetch_related("product__variants")` is used in `get_products` to prevent N+1 queries.

---

## 6. [RESOLVED] Collection Deletion: Hard Delete Instead of Deactivation

### Status: Resolved
- `backend/store_collections/repositories.py`: Added `hard_delete_collection(collection)` invoking `collection.hard_delete()`.
- `backend/store_collections/services.py`: `delete_collection` looks up via `Collection.all_objects.filter(id=collection_id).first()` and calls `hard_delete_collection`, safely cascading `CollectionProduct` link rows without touching associated products.
- `backend/store_collections/selectors.py`: `get_all_collections_admin` explicitly filters `deleted_at__isnull=True`.
- `frontend/src/app/admin/collections/page.tsx`: Updated `handleDeleteCollection` with optimistic removal, updated Persian confirmation copy, and reactive UI re-sync.

---

## 7. [RESOLVED] CMS Site Content: Add Hero Key and Default Fallback Providers

### Status: Resolved
- `backend/cms/models.py`: Added `HERO = "hero"` to `SiteContent.ALLOWED_KEYS`.
- `backend/cms/serializers.py`: Added `"hero"` to `ALLOWED_SITE_KEYS` and adjusted validator.
- `backend/cms/services.py`: `CMSService.get_site_content(key)` now returns structured default fallback dictionaries for all allowed keys (`announcement`, `hero`, `footer`, `header`, `discount_section`, `homepage`) when unseeded, instead of throwing `400 Bad Request: "Content key not found."`.

---

## 8. Catalog & Search: Expose Discount Fields & Support `has_discount` Filtering

### Status: Pending Backend Execution

### Context & Problem Statement
When products are included in a special discount campaign via CMS (`/admin/cms` -> "کمپین تخفیفات و بنر فروش ویژه"):
- The CMS endpoint `POST /api/admin/products/discount-section/activate/` correctly updates `Product.discount_percent`, `Product.discount_price`, and `Product.discount_expires_at` in the database.
- However, on the customer storefront (`/products` and `/search`), the products appear at full price without the discount badge, without the strikethrough original price, and without the discounted price.
- Furthermore, browsing `/products?has_discount=true` returns all products rather than filtering for discounted items.

### Root Cause Analysis
1. **Search Endpoint Strips Discount Fields**:
   - `frontend/src/app/products/page.tsx` renders `<SearchPage />`, which queries `GET /api/search/products/`.
   - In `backend/search/services.py`, `SearchService._serialize_product` (lines 66-83) only serialized `price` and omitted `discount_percent`, `discount_price`, `discount_expires_at`, and `is_discount_active`.
   - As a result, the frontend client receives `undefined` for discount fields, causing `getDiscountInfo(product).hasDiscount` to evaluate to `false`.
2. **Missing `has_discount` Filter Support**:
   - In `backend/search/serializers.py`, `SearchSerializer` only declared `exclude_discounted` but lacked `has_discount`.
   - In `backend/search/views.py`, `SearchViewSet.products` did not pass `has_discount` to `filters`.
   - In `backend/search/selectors.py`, `SearchSelector.search_products` did not filter by `has_discount`.
3. **Collections Serializer Omission**:
   - In `backend/store_collections/serializers.py`, `CollectionDetailSerializer.get_products` (lines 161-171) also omitted discount fields from product cards.
4. **Cache Invalidation Gap**:
   - In `backend/products/services.py`, campaign mutations called `cache.delete_pattern("luxe:products:*")`, which fails to invalidate Django's 5-minute `cache_page(300)` view caches (stored under `views.decorators.cache.*`). Calling `cache.clear()` is required to immediately purge stale cached views.
5. **Base Price & Metadata Resilience**:
   - In `backend/products/services.py`, `_base_price` should prioritize active variants with `price > 0` before checking metadata, and `_apply_percent_to_products` should keep `product.metadata["discount_percent"]` and `product.metadata["discount_price"]` synchronized.

---

### Required Backend Changes

#### 1. `backend/search/services.py`
In `SearchService._serialize_product` (around line 65):
```python
        # Extract stock
        total_stock = 0
        for v in product.variants.filter(deleted_at__isnull=True):
            if hasattr(v, "inventory") and v.inventory:
                total_stock += v.inventory.available_quantity

        # Extract discount fields
        now = timezone.now()
        is_expired = bool(product.discount_expires_at and product.discount_expires_at < now)
        has_pct = bool(product.discount_percent and 1 <= product.discount_percent <= 99)

        is_discount_active = bool(product.is_discount_active) or (has_pct and not is_expired and price and price != "0")
        discount_percent = product.discount_percent if (has_pct and not is_expired) else None
        discount_price = None
        if is_discount_active:
            if product.discount_price is not None and product.discount_price > 0:
                discount_price = int(product.discount_price)
            elif discount_percent and price and price != "0":
                try:
                    discount_price = int(round(float(price) * (100 - discount_percent) / 100.0))
                except Exception:
                    pass

        return {
            'id': str(product.id),
            'title': product.title,
            'name': product.title,
            'slug': product.slug,
            'description': (product.description or "")[:200],
            'category': product.category.name if product.category else None,
            'category_name': product.category.name if product.category else None,
            'category_slug': product.category.slug if product.category else None,
            'collections': [c.name for c in product.collections.all()],
            'price': price,
            'discount_price': discount_price,
            'discount_percent': discount_percent,
            'discount_expires_at': product.discount_expires_at.isoformat() if product.discount_expires_at else None,
            'is_discount_active': is_discount_active,
            'image': img,
            'imageUrl': img,
            'is_new': (timezone.now() - product.created_at).days < 30,
            'stock_quantity': total_stock,
            'is_in_stock': total_stock > 0,
        }
```

#### 2. `backend/search/serializers.py`
Add `has_discount` to `SearchSerializer` (line 14):
```python
    exclude_discounted = serializers.BooleanField(required=False, default=False)
    has_discount = serializers.CharField(required=False, allow_blank=True)
```

#### 3. `backend/search/views.py`
Forward `has_discount` in `SearchViewSet.products` (line 34):
```python
        if data.get('has_discount') or request.query_params.get('has_discount'):
            filters['has_discount'] = data.get('has_discount') or request.query_params.get('has_discount')
```

#### 4. `backend/search/selectors.py`
In `SearchSelector.search_products` (lines 68-78):
```python
        if filters:
            from django.utils import timezone as _tz
            _now = _tz.now()
            _active_discount = (
                Q(discount_price__isnull=False)
                & Q(discount_price__gt=0)
                & (Q(discount_expires_at__isnull=True) | Q(discount_expires_at__gte=_now))
            )

            if filters.get('exclude_discounted') in ["true", "1", True, "True", "TRUE"]:
                qs = qs.exclude(_active_discount)

            has_discount = filters.get('has_discount')
            if has_discount in ["true", "1", True, "True", "TRUE"]:
                qs = qs.filter(_active_discount)
            elif has_discount in ["false", "0", False]:
                qs = qs.exclude(_active_discount)
```

#### 5. `backend/products/services.py`
1. **Resilient `_base_price`** (lines 228-242):
   ```python
   @staticmethod
   def _base_price(product: Product) -> int:
       try:
           variant = product.variants.filter(deleted_at__isnull=True, price__gt=0).first()
           if not variant:
               variant = product.variants.filter(deleted_at__isnull=True).first()
           if variant and variant.price is not None and float(variant.price) > 0:
               return int(round(float(variant.price)))
       except Exception:
           pass
       try:
           if product.metadata and "price" in product.metadata:
               val = float(product.metadata["price"])
               if val > 0:
                   return int(round(val))
       except Exception:
           pass
       return 0
   ```
2. **Sync `metadata` on discount update** in `_apply_percent_to_products` (lines 288-298):
   ```python
   def _apply_percent_to_products(self, products: list, discount_percent: int, expires_at=None) -> None:
       for product in products:
           base = self._base_price(product)
           product.discount_percent = discount_percent
           product.discount_price = product.calculate_discount_price(base)
           product.discount_expires_at = expires_at
           meta = dict(product.metadata) if product.metadata else {}
           meta["discount_percent"] = discount_percent
           if product.discount_price:
               meta["discount_price"] = str(int(product.discount_price))
           product.metadata = meta
           product.save(
               update_fields=["discount_percent", "discount_price", "discount_expires_at", "metadata", "updated_at"]
           )
   ```
3. **Purge Cache on Activation & Deactivation**:
   Replace `cache.delete_pattern("luxe:products:*")` with `cache.clear()` in `activate_discount_section`, `deactivate_discount_section`, `add_product_to_section`, `remove_product_from_section`, and `set_section_percent`.

#### 6. `backend/store_collections/serializers.py`
In `CollectionDetailSerializer.get_products` (lines 161-171):
```python
                is_discount_active = bool(p.is_discount_active)
                disc_pct = p.discount_percent if is_discount_active else None
                disc_price = int(p.discount_price) if (is_discount_active and p.discount_price is not None) else None
                if is_discount_active and disc_price is None and disc_pct and price != "0":
                    try:
                        disc_price = int(round(float(price) * (100 - disc_pct) / 100.0))
                    except Exception:
                        pass

                results.append({
                    "id": str(p.id),
                    "title": p.title,
                    "name": p.title,
                    "slug": p.slug,
                    "price": price,
                    "discount_price": disc_price,
                    "discount_percent": disc_pct,
                    "discount_expires_at": p.discount_expires_at.isoformat() if p.discount_expires_at else None,
                    "is_discount_active": is_discount_active,
                    "image_url": image_url,
                    "imageUrl": image_url,
                    "position": link.position,
                })
```







