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





