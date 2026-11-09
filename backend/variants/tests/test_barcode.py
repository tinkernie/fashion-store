"""Regression tests for automatic variant barcodes."""
from unittest.mock import MagicMock, call, patch

import pytest

from products.tests.factories import ProductFactory
from variants.barcodes import (
    MAX_ATTEMPTS,
    allocate_barcode,
    assign_unique_barcode,
    barcode_from_counter,
    ensure_barcode,
    generate_ean13,
    is_valid_ean13,
)
from variants.models import BarcodeSequence, Variant
from variants.services import VariantService

from .factories import VariantFactory


def assert_ean(value):
    assert value is not None
    assert len(value) == 13
    assert value.isdigit()
    assert is_valid_ean13(value)
    assert value.startswith("20")  # reserved in-store band


class TestBarcodeGeneration:
    def test_generated_value_is_valid_ean13(self):
        assert_ean(generate_ean13())

    def test_generated_values_are_unique(self):
        values = {generate_ean13() for _ in range(50)}
        assert len(values) == 50

    def test_check_digit_rejects_corruption(self):
        value = generate_ean13()
        assert not is_valid_ean13(value[:-1] + str((int(value[-1]) + 1) % 10))


@pytest.mark.django_db
class TestAutoGeneration:
    def test_create_variant_via_service_gets_barcode(self):
        product = ProductFactory()
        result = VariantService().create_variant(
            str(product.id),
            {
                "sku": "AUTO-001",
                "price": "150000",
                "availability": "in_stock",
            },
        )
        assert_ean(result["barcode"])

    def test_explicit_barcode_is_preserved(self):
        product = ProductFactory()
        result = VariantService().create_variant(
            str(product.id),
            {
                "sku": "EXPL-001",
                "price": "100000",
                "availability": "in_stock",
                "barcode": "4006381333931",  # valid EAN-13
            },
        )
        assert result["barcode"] == "4006381333931"

    def test_non_ean_explicit_barcode_is_rejected(self):
        from common.exceptions import BusinessException

        product = ProductFactory()
        with pytest.raises(BusinessException):
            VariantService().create_variant(
                str(product.id),
                {
                    "sku": "EXPL-002",
                    "price": "100000",
                    "availability": "in_stock",
                    "barcode": "OWNER-TYPED-1",
                },
            )

    def test_placeholder_default_variant_gets_barcode(self):
        # Covers the Variant.objects.create() seeding path in
        # products/services.py (DEFAULT variant at product creation).
        variant = Variant.objects.create(
            product=ProductFactory(),
            sku="some-product-DEFAULT",
            price=0,
        )
        variant.refresh_from_db()
        assert_ean(variant.barcode)

    def test_factory_barcode_is_untouched(self):
        variant = VariantFactory(barcode="FACTORY-1")
        variant.refresh_from_db()
        assert variant.barcode == "FACTORY-1"

    def test_clearing_barcode_regenerates(self):
        variant = VariantFactory(barcode="OLD-VALUE-1")
        variant.barcode = ""
        variant.save()
        variant.refresh_from_db()
        assert variant.barcode
        assert_ean(variant.barcode)

    def test_update_fields_save_keeps_barcode(self):
        # save(update_fields=...) elsewhere in the codebase (e.g. price sync
        # on the DEFAULT variant) must never wipe or stall generation.
        variant = VariantFactory(barcode="KEEP-123")
        variant.price = 999
        variant.save(update_fields=["price", "updated_at"])
        variant.refresh_from_db()
        assert variant.barcode == "KEEP-123"

    def test_update_fields_save_persists_generated_barcode(self):
        # A pre_save hook cannot widen update_fields; save() must. Simulate a
        # row that lost its barcode (bulk import / manual SQL) and is then
        # saved with a narrow update_fields list.
        variant = VariantFactory(barcode="TEMP-VALUE-1")
        Variant.objects.filter(pk=variant.pk).update(barcode=None)
        variant.refresh_from_db()
        assert variant.barcode is None

        variant.price = 1234
        variant.save(update_fields=["price", "updated_at"])
        variant.refresh_from_db()
        assert variant.barcode is not None
        assert_ean(variant.barcode)


@pytest.mark.django_db
class TestSequentialAllocation:
    def test_barcodes_are_sequential(self):
        product = ProductFactory()
        first = Variant.objects.create(product=product, sku="SEQ-1", price=1)
        second = Variant.objects.create(product=product, sku="SEQ-2", price=1)

        assert first.barcode.startswith("20")
        assert (
            int(second.barcode[2:12]) == int(first.barcode[2:12]) + 1
        )
        assert_ean(first.barcode)
        assert_ean(second.barcode)

    def test_values_already_in_the_table_are_skipped(self):
        product = ProductFactory()
        seq, _ = BarcodeSequence.objects.get_or_create(prefix="20")
        expected_next = seq.last_value + 1
        occupied = barcode_from_counter(expected_next)
        Variant.objects.create(
            product=product, sku="OCCUPIED-1", price=1, barcode=occupied
        )

        allocated = allocate_barcode()

        assert allocated != occupied
        assert int(allocated[2:12]) == expected_next + 1
        assert_ean(allocated)

    def test_counter_row_is_created_once(self):
        Variant.objects.create(product=ProductFactory(), sku="ONCE-1", price=1)
        Variant.objects.create(product=ProductFactory(), sku="ONCE-2", price=1)
        assert BarcodeSequence.objects.filter(prefix="20").count() == 1


@pytest.mark.django_db
class TestPermanentUniqueness:
    def test_soft_deleted_barcode_cannot_be_reused(self):
        from django.db import IntegrityError, transaction

        deleted = VariantFactory(barcode="4006381333931")
        deleted.delete()
        assert Variant.all_objects.get(pk=deleted.pk).deleted_at is not None

        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Variant.objects.create(
                    product=ProductFactory(),
                    sku="REUSE-1",
                    price=1,
                    barcode="4006381333931",
                )

    def test_allocator_ignores_soft_deleted_rows(self):
        product = ProductFactory()
        seq, _ = BarcodeSequence.objects.get_or_create(prefix="20")
        expected_next = seq.last_value + 1
        occupied = barcode_from_counter(expected_next)
        old = VariantFactory(barcode=occupied)
        old.delete()

        allocated = allocate_barcode()

        assert allocated != occupied
        assert_ean(allocated)


class TestCollisionRetry:
    """`assign_unique_barcode` retries while `is_taken` reports a collision
    (pure logic; the DB predicate is exercised by every creation test)."""

    def test_taken_candidate_is_replaced(self):
        candidates = [generate_ean13() for _ in range(2)]
        is_taken = MagicMock(side_effect=[True, False])
        with patch("variants.barcodes.generate_ean13", side_effect=candidates):
            result = assign_unique_barcode(is_taken)
        assert result == candidates[1]
        assert is_taken.call_args_list == [call(candidates[0]), call(candidates[1])]

    def test_fallback_after_max_attempts(self):
        values = [generate_ean13() for _ in range(MAX_ATTEMPTS + 1)]
        is_taken = MagicMock(return_value=True)
        with patch("variants.barcodes.generate_ean13", side_effect=values):
            result = assign_unique_barcode(is_taken)
        # max_attempts candidates + final fallback assignment (constraint is
        # the last arbiter); no exception raised.
        assert result == values[MAX_ATTEMPTS]
