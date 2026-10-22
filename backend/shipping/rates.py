"""Iran Post tariff tables (نرخنامه 1405), all values in RIALS.

Only the parcel (بسته) rows are encoded: clothing always ships boxed.
To add a method later (e.g. express D+2, same-day), append one entry to
METHODS with the same shape — no other code changes needed.

Source rows:
- Table 4 (intercity priority): base fare per weight band × distance zone.
- Table 6 row 24/25: destination surcharges on the base fare.
- Table 7 rows 2+4: compulsory + declared-value insurance.
- Table 6 row 16: counter packaging fee (flat — all our parcels > size 9).
"""

# Distance zones relative to the store (settings override the province sets).
ZONE_INTRA = "intra"  # same province as the store
ZONE_NEIGHBOR = "neighbor"  # adjacent provinces
ZONE_FAR = "far"  # everywhere else

METHOD_PISHTAZ = "pishtaz"  # پیشتاز، D+3 (default)
METHOD_VIZHEH = "vizheh"  # ویژه بین‌شهری، D+1 (paid upgrade)

METHODS = {
    METHOD_PISHTAZ: {
        "code": METHOD_PISHTAZ,
        "name": "پیشتاز",
        "name_en": "Pishtaz Express",
        "eta_days": 3,
        # Parcel (بسته) up to 1kg, Table 4 row 4 (Rials).
        "base_1kg": {ZONE_INTRA: 800_000, ZONE_NEIGHBOR: 900_000, ZONE_FAR: 1_000_000},
        # Per extra kg-or-fraction above 1kg (Rials).
        "per_kg": {ZONE_INTRA: 125_000, ZONE_NEIGHBOR: 155_000, ZONE_FAR: 175_000},
    },
    METHOD_VIZHEH: {
        "code": METHOD_VIZHEH,
        "name": "ویژه",
        "name_en": "Special Express",
        "eta_days": 1,
        # Parcel (بسته) up to 1kg, Table 4 row 2 (Rials).
        "base_1kg": {ZONE_INTRA: 930_000, ZONE_NEIGHBOR: 1_080_000, ZONE_FAR: 1_530_000},
        # Per extra kg-or-fraction above 1kg (Rials).
        "per_kg": {ZONE_INTRA: 155_000, ZONE_NEIGHBOR: 165_000, ZONE_FAR: 200_000},
    },
}

# Destination surcharges on the BASE fare (Table 6 rows 24-25).
# Whole provinces per owner decision (any city counts).
SURCHARGE_METRO_20 = 20  # Tehran, Alborz
SURCHARGE_METRO_15 = 15  # Razavi Khorasan, Isfahan, Fars, E. Azerbaijan, Khuzestan, Qom
SURCHARGE_REMOTE_5 = 5  # Kerman, Sistan-Baluchestan, S. Khorasan, Semnan, Yazd

# Compulsory parcel insurance, declared value ≤ 100M Tomans (Table 7 row 2).
INSURANCE_COMPULSORY_RIALS = 100_000

# Declared-value fee brackets (Table 7 row 4, سایر مرسولات):
# (upper bound in Rials, rate). Applied to the full declared value.
INSURANCE_BRACKETS = [
    (300_000_000, 0.002),
    (500_000_000, 0.0025),
    (1_000_000_000, 0.003),
    (2_000_000_000, 0.0035),
    (5_000_000_000, 0.004),
]

# Counter packaging fee, parcels larger than size 9 (Table 6 row 16).
# Packing materials are billed separately at the counter (unquantified).
PACKAGING_RIALS = 150_000

# Store-level flat fee added on top of every tariff quote (Tomans, not
# Rials like the tariff rows above — owner decision for handling costs).
FLAT_FEE_TOMANS = 45_000
