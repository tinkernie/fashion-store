import pytest
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from common.exceptions import BusinessException
from products.models import Product
from products.services import ProductService, cleanup_expired_discounts, variant_effective_price
from products.tests.factories import ProductFactory
from variants.models import Variant
from variants.tests.factories import VariantFactory
from store_collections.services import CollectionService
from store_collections.models import CollectionProduct
from .factories import CollectionFactory

User = get_user_model()


def _make_catalog_product():
    """Published product + sellable variant + real inventory (no placeholder)."""
    from inventory.models import Inventory

    product = ProductFactory()
    variant = VariantFactory(product=product, price=100000, status=Variant.Status.PUBLISHED)
    Inventory.objects.create(variant=variant, available_quantity=100, safety_stock=10)
    return product


def _future(days=7):
    return timezone.now() + timedelta(days=days)


def _past(hours=1):
    return timezone.now() - timedelta(hours=hours)


@pytest.mark.django_db
class TestCollectionDiscountProvenance:
    def test_apply_collection_discount_stamps_provenance(self):
        collection = CollectionFactory()
        product = _make_catalog_product()
        ProductService.apply_collection_discount(
            [product], 20, _future(), collection_id=collection.id
        )
        product.refresh_from_db()
        assert product.discount_percent == 20
        assert product.discount_price == 80000
        assert product.discount_source == Product.DiscountSource.COLLECTION
        assert str(product.discount_collection_id) == str(collection.id)
        assert product.is_discount_active
        assert product.has_active_collection_discount

    def test_last_write_wins_across_collections_and_surgical_revert(self):
        collection = CollectionFactory()
        other = CollectionFactory()
        product = _make_catalog_product()
        ProductService.apply_collection_discount(
            [product], 20, _future(), collection_id=collection.id
        )
        ProductService.apply_collection_discount(
            [product], 10, _future(), collection_id=other.id
        )
        assert str(product.discount_collection_id) == str(other.id)
        assert ProductService.clear_collection_discounts(other.id) == 1
        product.refresh_from_db()
        assert not product.is_discount_active
        assert product.discount_source is None
        assert ProductService.clear_collection_discounts(collection.id) == 0


@pytest.mark.django_db
class TestCampaignGuardDirections:
    def test_campaign_cannot_take_collection_discounted_product(self):
        collection = CollectionFactory()
        product = _make_catalog_product()
        ProductService.apply_collection_discount(
            [product], 20, _future(), collection_id=collection.id
        )
        with pytest.raises(BusinessException) as err:
            ProductService().activate_discount_section([str(product.id)], 30)
        assert "collection" in str(err.value)

    def test_campaign_add_one_blocked_for_collection_discount(self):
        collection = CollectionFactory()
        product = _make_catalog_product()
        ProductService.apply_collection_discount(
            [product], 20, _future(), collection_id=collection.id
        )
        with pytest.raises(BusinessException):
            ProductService().add_product_to_section(str(product.id), 30)

    def test_collection_batch_blocked_for_campaign_product(self):
        product = _make_catalog_product()
        ProductService().activate_discount_section([str(product.id)], 30)
        collection = CollectionFactory()
        with pytest.raises(BusinessException) as err:
            CollectionService().batch_add_products(
                collection.id, [str(product.id)], 25, expires_at=_future()
            )
        assert "campaign" in str(err.value)
        # the product must not have been linked as collateral damage
        assert CollectionProduct.objects.filter(collection=collection).count() == 0

    def test_expired_campaign_discount_can_join_collection(self):
        product = _make_catalog_product()
        ProductService().activate_discount_section(
            [str(product.id)], 30, expires_at=_past()
        )
        assert not product.is_discount_active
        collection = CollectionFactory()
        CollectionService().batch_add_products(
            collection.id, [str(product.id)], 25, expires_at=_future()
        )
        product.refresh_from_db()
        assert product.discount_percent == 25
        assert product.discount_source == Product.DiscountSource.COLLECTION


@pytest.mark.django_db
class TestCampaignCleanupSemantics:
    def test_campaign_deactivate_clears_provenance(self):
        product = _make_catalog_product()
        ProductService().activate_discount_section([str(product.id)], 30)
        ProductService().deactivate_discount_section()
        product.refresh_from_db()
        assert product.discount_source is None
        assert product.discount_collection_id is None
        assert not product.is_discount_active

    def test_set_section_percent_stamps_campaign_source(self):
        product = _make_catalog_product()
        ProductService().activate_discount_section([str(product.id)], 30)
        ProductService().set_section_percent(40)
        product.refresh_from_db()
        assert product.discount_percent == 40
        assert product.discount_source == Product.DiscountSource.CAMPAIGN

    def test_remove_one_clears_source_and_metadata(self):
        product = _make_catalog_product()
        ProductService().activate_discount_section([str(product.id)], 30)
        ProductService().remove_product_from_section(str(product.id))
        product.refresh_from_db()
        assert product.discount_source is None
        assert not (product.metadata or {}).get("discount_source")
        assert not (product.metadata or {}).get("discount_percent")


@pytest.mark.django_db
class TestExpiredDiscountCleanupTask:
    def test_cleanup_nulls_expired_campaign_and_collection_rows(self):
        product_campaign = _make_catalog_product()
        product_collection = _make_catalog_product()
        collection = CollectionFactory()
        ProductService().activate_discount_section(
            [str(product_campaign.id)], 30, expires_at=_past(hours=2)
        )
        ProductService.apply_collection_discount(
            [product_collection], 20, _past(hours=2), collection_id=collection.id
        )
        assert cleanup_expired_discounts()["cleared"] == 2
        product_campaign.refresh_from_db()
        product_collection.refresh_from_db()
        for product in (product_campaign, product_collection):
            assert product.discount_percent is None
            assert product.discount_price is None
            assert product.discount_expires_at is None
            assert product.discount_source is None
            assert product.discount_collection_id is None
            assert not (product.metadata or {}).get("discount_percent")

    def test_cleanup_keeps_future_discounts(self):
        product = _make_catalog_product()
        ProductService().activate_discount_section([str(product.id)], 30, expires_at=_future())
        assert cleanup_expired_discounts()["cleared"] == 0
        product.refresh_from_db()
        assert product.discount_percent == 30
        assert product.is_discount_active


@pytest.mark.django_db
class TestVariantEffectivePrice:
    def test_discounted_variant_reports_discount_price(self):
        product = _make_catalog_product()
        variant = product.variants.first()
        ProductService.apply_collection_discount(
            [product], 20, _future(), collection_id=CollectionFactory().id
        )
        variant.refresh_from_db()
        assert variant_effective_price(variant) == 80000

    def test_expired_discount_falls_back_to_base_price(self):
        product = _make_catalog_product()
        variant = product.variants.first()
        ProductService().activate_discount_section([str(product.id)], 30, expires_at=_past())
        assert variant_effective_price(variant) == 100000


@pytest.mark.django_db
class TestCollectionDiscountAdminAPI:
    def _post_batch(self, client, collection, products, percent, expires=None):
        return client.post(
            f"/api/admin/collections/{collection.id}/add-products/",
            {
                "product_ids": [str(p.id) for p in products],
                "discount_percent": percent,
                **({"expires_at": expires.isoformat()} if expires else {}),
            },
            format="json",
        )

    def test_batch_endpoint_applies_report_and_provenance(self):
        admin = User.objects.create_superuser("09123000901", "pass")
        collection = CollectionFactory()
        products = [_make_catalog_product() for _ in range(2)]
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = self._post_batch(client, collection, products, 20, _future())
        assert resp.status_code == 200
        assert resp.data["discounted_count"] == 2
        for item in resp.data["items"]:
            assert item["previous_percent"] is None
            assert item["applied_percent"] == 20
        for product in products:
            product.refresh_from_db()
            assert product.discount_price == 80000
            assert product.discount_source == Product.DiscountSource.COLLECTION
            assert str(product.discount_collection_id) == str(collection.id)

    def test_batch_rejects_missing_expiry(self):
        admin = User.objects.create_superuser("09123000902", "pass")
        collection = CollectionFactory()
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = self._post_batch(client, collection, [_make_catalog_product()], 20)
        assert resp.status_code == 400
        assert "expiry" in str(resp.data).lower()

    def test_batch_rejects_past_expiry(self):
        admin = User.objects.create_superuser("09123000903", "pass")
        collection = CollectionFactory()
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = self._post_batch(client, collection, [_make_catalog_product()], 20, _past())
        assert resp.status_code == 400

    def test_last_write_wins_report_previous_and_applied(self):
        admin = User.objects.create_superuser("09123000904", "pass")
        collection = CollectionFactory()
        product = _make_catalog_product()
        client = APIClient()
        client.force_authenticate(user=admin)
        first = self._post_batch(client, collection, [product], 10, _future())
        assert first.status_code == 200
        second = self._post_batch(client, collection, [product], 25, _future())
        assert second.status_code == 200
        items = second.data["items"]
        assert items[0]["previous_percent"] == 10
        assert items[0]["applied_percent"] == 25
        product.refresh_from_db()
        assert product.discount_percent == 25

    def test_anonymous_denied(self):
        collection = CollectionFactory()
        product = _make_catalog_product()
        client = APIClient()
        resp = self._post_batch(client, collection, [product], 0)
        assert resp.status_code in (401, 403)

    def test_deactivate_collection_reverts_discounts(self):
        admin = User.objects.create_superuser("09123000905", "pass")
        collection = CollectionFactory(is_active=True)
        products = [_make_catalog_product() for _ in range(2)]
        client = APIClient()
        client.force_authenticate(user=admin)
        self._post_batch(client, collection, products, 20, _future())
        resp = client.patch(
            f"/api/admin/collections/{collection.id}/",
            {"is_active": False},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["reverted_discounts"] == 2
        for product in products:
            product.refresh_from_db()
            assert not product.is_discount_active
            assert product.discount_source is None

    def test_delete_collection_reverts_discounts(self):
        admin = User.objects.create_superuser("09123000906", "pass")
        collection = CollectionFactory()
        products = [_make_catalog_product()]
        client = APIClient()
        client.force_authenticate(user=admin)
        self._post_batch(client, collection, products, 33, _future())
        resp = client.delete(f"/api/admin/collections/{collection.id}/")
        assert resp.status_code == 200
        for product in products:
            product.refresh_from_db()
            assert not product.is_discount_active
            assert product.discount_source is None

    def test_remove_product_reverts_owned_discount(self):
        collection = CollectionFactory()
        product = _make_catalog_product()
        ProductService.apply_collection_discount(
            [product], 20, _future(), collection_id=collection.id
        )
        result = CollectionService().remove_product(collection.id, str(product.id))
        assert "reverted" in result["message"]
        product.refresh_from_db()
        assert not product.is_discount_active
        assert product.discount_source is None

    def test_zero_percent_clears_this_collection_and_keeps_links(self):
        admin = User.objects.create_superuser("09123000907", "pass")
        collection = CollectionFactory()
        product = _make_catalog_product()
        client = APIClient()
        client.force_authenticate(user=admin)
        self._post_batch(client, collection, [product], 20, _future())
        resp = self._post_batch(client, collection, [product], 0)
        assert resp.status_code == 200
        assert resp.data["cleared_discounts"] == 1
        product.refresh_from_db()
        assert not product.is_discount_active
        assert CollectionProduct.objects.filter(collection=collection).count() == 1
