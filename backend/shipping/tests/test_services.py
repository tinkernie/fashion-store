from shipping import rates, services


def _quote_tehran_10g():
    # Tehran: far zone (not store/neighbor) + 20% metro surcharge.
    # 10g parcel -> base fare only, no per-kg extras.
    return services.quote(
        province_name="تهران",
        weight_grams=10,
        subtotal_tomans=500_000,
    )


class TestFlatFee:
    def test_before_amounts_with_flat_fee_zeroed(self, monkeypatch):
        """Pre-adjustment behavior: FLAT_FEE_TOMANS=0 pins what the totals
        were before, hand-computed from the tariff tables (146,000 / 209,600)."""
        monkeypatch.setattr(rates, "FLAT_FEE_TOMANS", 0)
        result = _quote_tehran_10g()
        pishtaz, vizheh = result["options"]
        assert pishtaz["total"] == 146_000
        assert vizheh["total"] == 209_600

    def test_flat_fee_added_to_final_amount(self):
        result = _quote_tehran_10g()
        pishtaz, vizheh = result["options"]
        assert pishtaz["total"] == 191_000
        assert vizheh["total"] == 254_600
        assert pishtaz["total"] - 146_000 == rates.FLAT_FEE_TOMANS
        assert vizheh["total"] - 209_600 == rates.FLAT_FEE_TOMANS

    def test_flat_fee_exposed_as_dedicated_line_item(self):
        result = _quote_tehran_10g()
        for option in result["options"]:
            assert option["flat_fee"] == rates.FLAT_FEE_TOMANS

    def test_line_items_excluding_flat_fee_unchanged(self):
        result = _quote_tehran_10g()
        pishtaz, vizheh = result["options"]
        expected = [
            {"base_fare": 100_000, "surcharge": 20_000, "surcharge_percent": 20,
             "insurance": 11_000, "packaging": 15_000},
            {"base_fare": 153_000, "surcharge": 30_600, "surcharge_percent": 20,
             "insurance": 11_000, "packaging": 15_000},
        ]
        for option, exp in zip(result["options"], expected):
            for key, value in exp.items():
                assert option[key] == value

    def test_flat_fee_applies_inside_store_province_too(self):
        # Zanjan: intra zone, no surcharge -> volume-independent store fee.
        result = services.quote(
            province_name="زنجان",
            weight_grams=10,
            subtotal_tomans=500_000,
        )
        pishtaz, vizheh = result["options"]
        assert pishtaz["flat_fee"] == 45_000
        assert pishtaz["total"] == (  # 800k fare + (100k + 10k) insurance + 150k packing + 450k fee Rials
            80_000 + 11_000 + 15_000 + 45_000
        )
