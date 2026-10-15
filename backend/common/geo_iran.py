"""Vendored Iranian province/city data (see data/iran_geo/README.md).

Loads once at import; validates shape loudly so a corrupt snapshot fails
at startup instead of serving wrong address dropdowns.
"""
import json
import os

_DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "iran_geo")


def _load(name: str):
    path = os.path.join(_DATA_DIR, name)
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except Exception as exc:
        raise RuntimeError(f"iran_geo: cannot load {name}: {exc}")


_PROVINCES = _load("provinces.json")
_CITIES = _load("cities.json")

if not isinstance(_PROVINCES, list) or len(_PROVINCES) < 28:
    raise RuntimeError("iran_geo: provinces.json malformed (expected 28+ provinces).")
if not isinstance(_CITIES, list) or len(_CITIES) < 1000:
    raise RuntimeError("iran_geo: cities.json malformed (expected 1000+ cities.")

for _p in _PROVINCES:
    if not isinstance(_p, dict) or "id" not in _p or "name" not in _p:
        raise RuntimeError("iran_geo: province record missing id/name.")
for _c in _CITIES:
    if not isinstance(_c, dict) or "id" not in _c or "name" not in _c or "province_id" not in _c:
        raise RuntimeError("iran_geo: city record missing id/name/province_id.")

PROVINCES = [{"id": p["id"], "name": p["name"]} for p in _PROVINCES]
_PROVINCE_BY_ID = {p["id"]: p["name"] for p in _PROVINCES}
_CITIES_BY_PROVINCE: dict = {}
for _c in _CITIES:
    _CITIES_BY_PROVINCE.setdefault(_c["province_id"], []).append(
        {"id": _c["id"], "name": _c["name"]}
    )
for _lst in _CITIES_BY_PROVINCE.values():
    _lst.sort(key=lambda c: c["name"])


def list_provinces() -> list:
    return [dict(p) for p in PROVINCES]


def province_name(province_id):
    try:
        return _PROVINCE_BY_ID.get(int(province_id))
    except (TypeError, ValueError):
        return None


def list_cities(province_id):
    """Cities of a province, or None when the province id is unknown."""
    try:
        key = int(province_id)
    except (TypeError, ValueError):
        return None
    if key not in _PROVINCE_BY_ID:
        return None
    return [dict(c) for c in _CITIES_BY_PROVINCE.get(key, [])]


def city_belongs(province_id, city_id):
    """Return the city name when city_id belongs to province_id, else None."""
    cities = list_cities(province_id)
    if not cities:
        return None
    try:
        wanted = int(city_id)
    except (TypeError, ValueError):
        return None
    for c in cities:
        try:
            if int(c["id"]) == wanted:
                return c["name"]
        except (TypeError, ValueError):
            continue
    return None
