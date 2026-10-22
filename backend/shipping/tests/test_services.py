from shipping import rates, services


def _quote_tehran_10g():
    # Tehran: far zone (not store/neighbor) + 20% metro surcharge.
    # 10g parcel -> tariff base fare only, no per-kg extras.
    return services.quote(
        province_name="تهران",
        weight_grams=10,
        subtotal_tomans=500_000,
    )


def _old_totals():
    """Replicates the pre-fold algorithm (separate packaging + 45,000 flat
    fee) as the documented 'before' reference for the same scenario.
    Values: tare base 100,000 T, surcharge 20%, insurance 11,000 T,
    packaging 15,000 T, flat 45,000 T."""
    old_flat = 45_000
    pishtaz = 100_000 + 20_000 + 11_000 + 15_000 + old_flat
    vizheh = 153_000 + 30_600 + 11_000 + 15_000 + old_flat
    return {"pishtaz": pishtaz, "vizheh": vizheh}


class TestFoldedFeeBehavior:
    def test_flat_fee_constant_is_35_000(self):
        assert rates.FLAT_FEE_TOMANS == 35_000

    def test_packaging_and_flat_no_longer_itemized(self):
        for option in _quote_tehran_10g()["options"]:
            assert "packaging" not in option
            assert "flat_fee" not in option

    def test_base_fare_includes_folded_fees(self):
        pishtaz, vizheh = _quote_tehran_10g()["options"]
        # tariff 100,000 / 153,000 + packaging 15,000 + flat 35,000
        assert pishtaz["base_fare"] == 150_000
        assert vizheh["base_fare"] == 203_000

    def test_total_is_base_plus_surcharge_plus_insurance(self):
        for option in _quote_tehran_10g()["options"]:
            assert (
                option["base_fare"] + option["surcharge"] + option["insurance"]
                == option["total"]
            )

    def test_after_totals(self):
        pishtaz, vizheh = _quote_tehran_10g()["options"]
        assert pishtaz["total"] == 181_000
        assert vizheh["total"] == 244_600


class TestBeforeVsAfter:
    def test_documented_before_totals_differ_only_by_fee_delta(self):
        """Before values were 191,000 / 254,600. Folding the packaging and
        flat fee changes presentation only; the fee cut 45,000 -> 35,000
        shifts every total down by exactly 10,000 tomans."""
        before = _old_totals()
        assert before == {"pishtaz": 191_000, "vizheh": 254_600}
        result = _quote_tehran_10g()
        pishtaz, vizheh = result["options"]
        assert pishtaz["total"] == before["pishtaz"] - 10_000
        assert vizheh["total"] == before["vizheh"] - 10_000

    def test_flat_fee_applies_inside_store_province_too(self):
        # Zanjan: intra zone, no surcharge. Old total was 151,000 T.
        result = services.quote(
            province_name="زنجان",
            weight_grams=10,
            subtotal_tomans=500_000,
        )
        pishtaz, _ = result["options"]
        # folded base 80k+15k+35k + insurance 11k
        assert pishtaz["total"] == 141_000
