from decimal import Decimal
from .repositories import CouponRepository
from .selectors import CouponSelector
from common.exceptions import BusinessException
from .models import Coupon


class CouponService:
    def validate_and_calculate(self, code: str, user, cart_items) -> dict:
        """
        Validate coupon and return discount amount.
        cart_items: list of dicts with 'variant_id', 'quantity', 'price', and optionally product metadata.
        """
        coupon = CouponSelector.get_active_coupon_by_code(code)
        if not coupon:
            raise BusinessException("Invalid or expired coupon code.")

        # Check per-user limit
        if coupon.max_per_user is not None:
            usage_count = CouponRepository.get_coupon_usage_count(coupon, user)
            if usage_count >= coupon.max_per_user:
                raise BusinessException("You have reached the usage limit for this coupon.")

        # Check total uses
        if coupon.max_uses is not None and coupon.used_count >= coupon.max_uses:
            raise BusinessException("Coupon usage limit reached.")

        # Check conditions (if any)
        self._check_conditions(coupon, cart_items)

        # Calculate subtotal
        subtotal = sum(item['price'] * item['quantity'] for item in cart_items)
        if subtotal < coupon.min_purchase:
            raise BusinessException(f"Minimum purchase of {coupon.min_purchase} not met.")

        # Compute discount
        if coupon.discount_type == Coupon.DiscountType.PERCENTAGE:
            if not (0 <= coupon.discount_value <= 100):
                raise BusinessException("Invalid discount percentage.")
            discount = (subtotal * coupon.discount_value / 100).quantize(Decimal('0.01'))
        else:
            discount = min(coupon.discount_value, subtotal)

        return {
            'coupon_id': str(coupon.id),
            'code': coupon.code,
            'discount': discount,
            'discount_type': coupon.discount_type,
            'discount_value': str(coupon.discount_value),
        }

    def _check_conditions(self, coupon, cart_items):
        conditions = coupon.conditions
        if not conditions:
            return
        # Example: require at least one product from a specific category
        if 'category_ids' in conditions:
            # We need product's category_id for each item. cart_items should include category_id.
            item_category_ids = set()
            for item in cart_items:
                cat_id = item.get('category_id')
                if cat_id:
                    item_category_ids.add(str(cat_id))
            required = set(str(cid) for cid in conditions['category_ids'])
            if not item_category_ids.intersection(required):
                raise BusinessException("Coupon not applicable to items in your cart.")
        # Additional rules can be added similarly.

    # Admin methods
    def create_coupon(self, data: dict) -> dict:
        code = data['code']
        if CouponSelector.get_active_coupon_by_code(code):
            raise BusinessException("A coupon with this code already exists.")
        # Validate discount value
        if data['discount_type'] == 'percentage' and not (0 < data['discount_value'] <= 100):
            raise BusinessException("Percentage discount must be between 0 and 100.")
        coupon = CouponRepository.create_coupon(**data)
        return self._serialize(coupon)

    def update_coupon(self, coupon_id, data: dict) -> dict:
        coupon = CouponSelector.get_coupon_by_id(coupon_id)
        if not coupon:
            raise BusinessException("Coupon not found.")
        # Code change allowed only if unique
        if 'code' in data and data['code'] != coupon.code:
            existing = CouponSelector.get_active_coupon_by_code(data['code'])
            if existing and existing.id != coupon.id:
                raise BusinessException("A coupon with this code already exists.")
        updated = CouponRepository.update_coupon(coupon, **data)
        return self._serialize(updated)

    def delete_coupon(self, coupon_id) -> dict:
        coupon = CouponSelector.get_coupon_by_id(coupon_id)
        if not coupon:
            raise BusinessException("Coupon not found.")
        CouponRepository.delete_coupon(coupon)
        return {"message": f"Coupon '{coupon.code}' deleted."}

    def _serialize(self, coupon) -> dict:
        return {
            'id': str(coupon.id),
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_value': str(coupon.discount_value),
            'min_purchase': str(coupon.min_purchase),
            'max_uses': coupon.max_uses,
            'max_per_user': coupon.max_per_user,
            'used_count': coupon.used_count,
            'valid_from': coupon.valid_from.isoformat() if coupon.valid_from else None,
            'valid_until': coupon.valid_until.isoformat() if coupon.valid_until else None,
            'is_active': coupon.is_active,
            'conditions': coupon.conditions,
        }

    def increment_usage(self, coupon, user, order):
        from .repositories import CouponRepository
        CouponRepository.increment_used_count(coupon, user, order)
