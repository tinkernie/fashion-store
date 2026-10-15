# Iranian province/city data — vendored snapshot (backend-only use)

Source: https://github.com/sajaddp/list-of-cities-in-Iran (GPL-3.0)
Snapshot: dist/json/provinces.json (31 provinces) + dist/json/cities-filtered.json
(1481 real cities) as published in v3.1.2 (official divisions through 1404).

- Files are kept VERBATIM (no edits); only read by `common/geo_iran.py`.
- No code was copied from that repository — just these two data files.
- To refresh (e.g. new cities announced): replace the two JSON files and
  restart the server. Loader validates shape at import; a bad file fails
  loudly at startup instead of silently serving wrong dropdowns.

Credit: Sajad Dehshiri (sajaddp) — star the repo if you find it useful.
