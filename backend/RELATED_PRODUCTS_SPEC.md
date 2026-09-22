# Comprehensive Specification: Related Products & Cart Cross-Sell Engine

## 1. Executive Summary & Purpose

### What is this about?
This is a **Hybrid E-Commerce Recommendation & Cross-Sell Engine** for fashion retail:
1. **Complete the Look (PDP)**: Shows curated or category-matched complementary pieces (e.g., pairing a coat with matching trousers and boots) directly beneath the product page.
2. **Frequently Bought Together (Cart & Checkout)**: Suggests cross-sell accessories and complementary pieces based on items currently in the user's active cart.
3. **Curator Control + Algorithmic Safety (Hybrid Pins & Fallback)**:
   - **Tier 1 (Manual Merchandising)**: Fashion merchandisers manually "pin" exact curated outfit pairs.
   - **Tier 2 (Algorithmic Auto-Fallback)**: If fewer than the requested number of items (e.g., 4) are pinned, the engine automatically backfills the remaining slots with items from the same collection, category, or style tag, filtering out out-of-stock items and self-references.

---

## 2. Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
|                                Client Applications                                |
|                                                                                   |
|  [ Product Detail Page (PDP) ]         [ Cart / Checkout Drawer ]  [ Admin Panel ]|
|       |                                     |                           |         |
|       v                                     v                           v         |
|  GET /api/products/<slug>/          GET /api/cart/related/    GET|POST|DELETE     |
|  (inline related_products)          (reads cart items union)  /api/admin/...      |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        Django Recommendation Service                              |
|                                                                                   |
|  1. Fetch Manual Pins (Ordered by position ASC)                                   |
|  2. If count < limit:                                                             |
|     - Query fallback: same collection -> same category -> active & in-stock        |
|     - Exclude source product & products already in cart                           |
|  3. Union & Deduplicate (preserve pin order first, fill remaining up to limit)     |
|  4. Serialize with standard lightweight ProductCard payload                       |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                                   PostgreSQL                                      |
|                                                                                   |
|  [ products_product ] <---> [ products_relatedproduct ] <---> [ products_product ]|
|  (source_id)                (position, created_at)            (target_id)         |
+-----------------------------------------------------------------------------------+
```

---

## 3. Database Schema

### `RelatedProduct` Through Table
```python
# backend/products/models.py
import uuid
from django.db import models

class RelatedProduct(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="manual_related_targets",
        help_text="The product on whose page these related items appear"
    )
    target_product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="manual_related_sources",
        help_text="The recommended complementary product"
    )
    position = models.PositiveIntegerField(
        default=0,
        help_text="Ordering index (0 = first item shown)"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "products_related_product"
        ordering = ["position", "-created_at"]
        unique_together = ("source_product", "target_product")
        indexes = [
            models.Index(fields=["source_product", "position"]),
        ]

    def __str__(self):
        return f"{self.source_product.title} -> {self.target_product.title} (#{self.position})"
```

---

## 4. API Endpoints Specification

### A) Inline Public PDP (`GET /api/products/<slug>/`)
Returns `related_products` directly inside the main PDP payload to eliminate extra round-trip HTTP latency:

```json
{
  "id": "c1a673ea-93b5-419b-8395-5df18bfcbfa2",
  "title": "پالتو فوتر مینیمال شتری",
  "slug": "minimal-wool-coat",
  "price": 3850000,
  "discount_price": 3290000,
  "images": ["https://.../coat-1.jpg"],
  "related_products": [
    {
      "id": "e4299bdf-22d7-463d-88f5-f761596faec4",
      "title": "شلوار واید کرم پشمی",
      "slug": "cream-wide-pants",
      "price": 1950000,
      "discount_price": null,
      "imageUrl": "https://.../pants-1.jpg",
      "average_rating": 4.8,
      "is_manual_pin": true
    },
    {
      "id": "f88a2e10-6bf4-4f2b-87cf-45a7dc57b441",
      "title": "شال گردن کشمیر کرم",
      "slug": "cashmere-cream-scarf",
      "price": 890000,
      "discount_price": 790000,
      "imageUrl": "https://.../scarf-1.jpg",
      "average_rating": 4.9,
      "is_manual_pin": false
    }
  ]
}
```

### B) Dedicated Lazy Related Endpoint (`GET /api/products/<slug>/related/?limit=4`)
Used when additional items are requested dynamically or when cached separately.

- **URL**: `/api/products/<slug>/related/`
- **Method**: `GET`
- **Parameters**: `limit` (default: 4, max: 12)
- **Response**: Array of product summary cards.

### C) Cart Cross-Sell (`GET /api/cart/related/?limit=8`)
Generates cross-sell suggestions based on the union of all products currently in the user's cart.

- **URL**: `/api/cart/related/`
- **Method**: `GET`
- **Parameters**: `limit` (default: 8)
- **Logic**:
  1. Inspect active session / user cart items.
  2. Gather pinned related products for all products in cart.
  3. Backfill with items from matching categories.
  4. Exclude products already in the cart and deduplicate.
  5. Slice to `limit`.

### D) Admin Curation Endpoints (`/api/admin/products/<id>/related/`)
Requires staff / admin credentials (`IsAdminUser`).

#### 1. List Current Manual Pins
- **GET** `/api/admin/products/<id>/related/`
- **Response**:
```json
[
  {
    "id": "target-uuid-1",
    "title": "شلوار کرم ست",
    "slug": "cream-pants",
    "price": 1950000,
    "position": 0,
    "imageUrl": "https://...",
    "is_manual_pin": true
  }
]
```

#### 2. Set / Update Pins
- **POST** `/api/admin/products/<id>/related/`
- **Body**:
```json
{
  "target_ids": ["uuid-pants", "uuid-scarf"],
  "positions": [0, 1]
}
```

#### 3. Remove a Pin
- **DELETE** `/api/admin/products/<id>/related/<target_id>/`

---

## 5. Backend Selector / Service Implementation

```python
# backend/products/services.py
from django.db.models import Q
from products.models import Product, RelatedProduct

class RelatedProductsService:
    @staticmethod
    def get_related_for_product(product: Product, limit: int = 4) -> list[dict]:
        # Step 1: Query manual pins
        pinned_qs = (
            RelatedProduct.objects.filter(
                source_product=product,
                target_product__status=Product.Status.PUBLISHED,
                target_product__deleted_at__isnull=True
            )
            .select_related("target_product", "target_product__category")
            .prefetch_related("target_product__images")
            .order_by("position", "-created_at")
        )

        results = []
        seen_ids = {product.id}

        for rel in pinned_qs:
            target = rel.target_product
            if target.id not in seen_ids:
                seen_ids.add(target.id)
                results.append(RelatedProductsService._serialize_card(target, is_manual=True))
            if len(results) >= limit:
                return results

        # Step 2: Algorithmic fallback
        needed = limit - len(results)
        if needed > 0:
            fallback_qs = (
                Product.objects.filter(
                    status=Product.Status.PUBLISHED,
                    deleted_at__isnull=True
                )
                .exclude(id__in=seen_ids)
            )

            # Preference A: same collection
            collection_ids = product.collections.values_list("id", flat=True)
            col_matches = list(
                fallback_qs.filter(collections__in=collection_ids)
                .distinct()[:needed]
            )

            for item in col_matches:
                if item.id not in seen_ids:
                    seen_ids.add(item.id)
                    results.append(RelatedProductsService._serialize_card(item, is_manual=False))

            # Preference B: same category if still needed
            still_needed = limit - len(results)
            if still_needed > 0 and product.category:
                cat_matches = list(
                    fallback_qs.filter(category=product.category)
                    .exclude(id__in=seen_ids)[:still_needed]
                )
                for item in cat_matches:
                    seen_ids.add(item.id)
                    results.append(RelatedProductsService._serialize_card(item, is_manual=False))

        return results[:limit]

    @staticmethod
    def _serialize_card(p: Product, is_manual: bool = False) -> dict:
        first_img = p.images.first()
        img_url = first_img.image.url if first_img and first_img.image else (p.image_url or "")
        return {
            "id": str(p.id),
            "title": p.title,
            "slug": p.slug,
            "price": p.price,
            "discount_price": p.discount_price,
            "imageUrl": img_url,
            "category": p.category.name if p.category else "",
            "is_manual_pin": is_manual,
        }
```

---

## 6. Frontend UI Implementation Plan

### A) Product Detail Page (PDP)
- Place below product description & reviews.
- Header: **«تکمیل استایل و ست‌های پیشنهادی»** (Complete the Look).
- Render a smooth 4-card horizontal responsive grid (`grid-cols-2 md:grid-cols-4`).
- Clicking a card navigates to `/products/<slug>` with instantaneous transition.

### B) Cart Page / Drawer Cross-Sell
- Header: **«پیشنهادهای مکمل سبد خرید شما»** (Frequently Bought Together).
- Render compact 2x4 card grid with direct **«+ افزودن به سبد»** button.
- Dynamically refetches when items are added or removed from cart.

### C) Admin Panel Merchandising Tab (`/admin/products`)
- Add a **«محصولات مرتبط (ست استایل)»** button/tab in product row or edit modal.
- Split UI:
  - **Left column**: List of currently pinned products (with drag-and-drop or order arrows, remove button).
  - **Right column**: Search input connected to `/api/admin/products/?search=...` with instant search results and an «افزودن به ست» action.
  - **Preview notice**: "۲ محصول دست‌چین شده + ۲ محصول پیشنهادی خودکار سیستم".

---

## 7. Verification & Test Plan

1. **Unit Tests**:
   - Pinned products retain strict position order `0, 1, 2, ...`.
   - Adding a duplicate pin returns `400 Bad Request` or updates position.
   - Deleting a pin does not delete the actual product.
   - Auto-fallback never returns the source product or unpublished/deleted products.
2. **Integration Tests**:
   - PDP endpoint returns `related_products` containing exactly 4 items.
   - Cart endpoint `/api/cart/related/` returns empty list if cart is empty.
   - Cart endpoint excludes items that are already in the active cart.
