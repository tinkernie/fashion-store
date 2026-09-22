# Backend Specification: Admin Product Filters, Weights & Clothing Variant Validation

## Overview
This specification documents the backend changes recommended to support the newly implemented frontend admin features:
1. **Filtering & Sorting**: Product status, price ascending/descending, newest/oldest creation dates, and discounted items filter.
2. **Product Weight Default**: Default weight value initialized to `1` (gram) instead of `500`.
3. **Clothing Variant Integrity**: Backend validation ensuring Color (`رنگ`), Size (`سایز`), and Material (`جنس`) options are strictly non-empty.

---

## 1. Product Filter & Sorting Parameters (`/api/products/` & `/api/admin/products/`)

### Query Parameters
The backend endpoint should accept the following query parameters:

| Parameter | Type | Allowed Values | Description |
| :--- | :--- | :--- | :--- |
| `status` | string | `all`, `published`, `draft`, `archived` | Filter by product status. Admins can view all; public endpoints should default to `published`. |
| `ordering` | string | `-created_at`, `created_at`, `price`, `-price` | Sort order: `newest` (`-created_at`), `oldest` (`created_at`), `price_asc` (`price`), `price_desc` (`-price`). |
| `has_discount`| boolean | `true`, `false` | When `true`, returns only products where `discount_price IS NOT NULL AND discount_price > 0`. |
| `category` | string | category slug or ID | Filter by category. |
| `search` | string | string | Full-text or icontains search across title, slug, and SKU. |

### Recommended Django Implementation (`backend/products/views.py` / `selectors.py`)
```python
from django.db.models import Q
from rest_framework import filters, generics

class ProductFilterMixin:
    def filter_products(self, queryset):
        status = self.request.query_params.get("status")
        if status and status != "all":
            queryset = queryset.filter(status=status)
        elif not self.request.user.is_staff:
            queryset = queryset.filter(status="published")

        has_discount = self.request.query_params.get("has_discount")
        if has_discount in ["true", "1", True]:
            queryset = queryset.filter(
                Q(discount_price__isnull=False) & Q(discount_price__gt=0)
            )

        ordering = self.request.query_params.get("ordering")
        allowed_orderings = {
            "newest": "-created_at",
            "-created_at": "-created_at",
            "oldest": "created_at",
            "created_at": "created_at",
            "price_asc": "price",
            "price": "price",
            "price_desc": "-price",
            "-price": "-price",
        }
        if ordering in allowed_orderings:
            queryset = queryset.order_by(allowed_orderings[ordering])
        else:
            queryset = queryset.order_by("-created_at")

        return queryset
```

---

## 2. Product & Variant Default Weight (`models.py`)

### Requirements
- When creating a product or a variant without specifying an explicit weight, the database default should be `1` (gram).
- Any existing default of `500` should be migrated to `1`.

### Model Updates
```python
# backend/products/models.py
class Product(models.Model):
    ...
    weight = models.PositiveIntegerField(
        default=1,
        help_text="Product weight in grams (used for post shipping calculations)"
    )

class ProductVariant(models.Model):
    ...
    weight = models.PositiveIntegerField(
        default=1,
        help_text="Variant weight in grams"
    )
```

---

## 3. Clothing Variant Validation (`serializers.py` / `views.py`)

### Requirements
- For clothing items or when variants are provided, the fields for Color (`رنگ` or `color`), Size (`سایز` or `size`), and Material (`جنس` or `material`) must not be empty or blank.
- If any option is defined without values, or if a variant payload does not map to all 3 required attributes, raise a `400 Bad Request` validation error with a descriptive message.

### Serializer Validation Example
```python
# backend/products/serializers.py
from rest_framework import serializers

class ProductVariantCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = "__all__"

    def validate(self, attrs):
        option_values = attrs.get("option_values", [])
        
        # Extract option names associated with the values
        option_names = [ov.option.name.strip().lower() for ov in option_values if hasattr(ov, 'option')]
        
        has_color = any("رنگ" in name or "color" in name for name in option_names)
        has_size = any("سایز" in name or "size" in name for name in option_names)
        has_material = any("جنس" in name or "متریال" in name or "material" in name for name in option_names)

        if not (has_color and has_size and has_material):
            raise serializers.ValidationError({
                "detail": "فیلدهای رنگ، سایز و جنس نباید خالی باشند. حداقل یک مقدار برای هرکدام باید وارد شود."
            })

        return attrs
```

---

## Verification & Compatibility
- The frontend admin interface already implements client-side formatting, immediate feedback, and fallback values matching this specification.
- These backend endpoints will ensure data integrity across direct API calls or third-party integrations.
