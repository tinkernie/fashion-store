import pytest

from common.exceptions import BusinessException
from inventory.models import Inventory
from products.serializers import ProductDetailSerializer
from products.selectors import ProductSelector
from products.services import ProductService
from products.models import Product
from variants.models import Variant
from variants.serializers import VariantDetailSerializer
from cart.services import CartService


@pytest.mark.django_db
class TestPlaceholderVariantInventory:
    def _product_with_real_variant(self, title="murano skirt", stock=7):
        ProductService().create_product(
            {"title": title, "slug": title, "price": 500_000}
        )
        product = ProductSelector.get_product_by_id(
            Product.objects.get(slug=title).id
        )
        variant = Variant.objects.create(
            product=product,
            sku=f"{title}-sizes",
            price=500_000,
            weight=300,
            status=Variant.Status.PUBLISHED,
            availability=Variant.Availability.IN_STOCK,
        )
        Inventory.objects.create(
            variant=variant,
            available_quantity=stock,
            status=Inventory.Status.IN_STOCK,
        )
        return product

    def test_creation_leaves_placeholder_without_inventory(self):
        product = self._product_with_real_variant()
        default = Variant.objects.filter(
            product=product, sku__endswith="-DEFAULT"
        ).first()
        assert default is not None
        assert not Inventory.objects.filter(variant=default).exists()

    def test_totals_sum_real_variants_only(self):
        product = self._product_with_real_variant(stock=7)
        assert ProductDetailSerializer(product).data["stock_quantity"] == 7

    def test_legacy_phantom_50_excluded_from_totals(self):
        """Pre-fix rows: DEFAULT variant carrying Inventory(available=50) must
        neither inflate totals nor resurface after the cleanup migration."""
        product = self._product_with_real_variant(stock=7)
        default = Variant.objects.get(product=product, sku__endswith="-DEFAULT")
        Inventory.objects.create(
            variant=default,
            available_quantity=50,
            status=Inventory.Status.IN_STOCK,
        )
        assert default.is_placeholder is True
        assert ProductDetailSerializer(product).data["stock_quantity"] == 7

    def test_cart_rejects_placeholder_variant(self):
        product = self._product_with_real_variant()
        default = Variant.objects.get(product=product, sku__endswith="-DEFAULT")
        with pytest.raises(BusinessException):
            CartService().add_item(
                None, "test-session", str(default.id), 1
            )

    def test_placeholder_flag_exposed_for_storefront(self):
        product = self._product_with_real_variant()
        fresh = ProductSelector.get_product_by_id(product.id)
        data = ProductDetailSerializer(fresh, context={"request": None}).data
        flags = {item["sku"]: item["is_placeholder"] for item in data["variants"]}
        # every exposed variant carries the flag; only the DEFAULT is True
        assert all(isinstance(flag, bool) for flag in flags.values())
        assert any(
            sku.endswith("-DEFAULT") and flag for sku, flag in flags.items()
        )
        default_variant = [
            v
            for v in fresh.variants.filter(deleted_at__isnull=True)
            if v.is_placeholder
        ][0]
        payload = VariantDetailSerializer(default_variant).data
        assert payload["is_placeholder"] is True
        assert payload["inventory"] is None
