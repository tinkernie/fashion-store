# Label printing: BarTender + SNBC BTP-U100t (Persian)

How variant labels travel from the backend to the thermal printer, which file
to feed which tool, and how to configure BarTender so Persian product titles
and option values print as readable text instead of garbled glyphs.

* **Printer:** SNBC BTP-U100t (203 dpi thermal transfer/direct thermal label printer)
* **Label software:** BarTender (Professional/Automation) with a text-file
  database connection
* **Export endpoint:** `POST /api/admin/variants/export-labels/`
  (`GET` also accepted), staff JWT required

---

## 1. Pick the right file

There are two formats and they are **not interchangeable**.

| Format | URL | Filename | For | Barcode cell |
| --- | --- | --- | --- | --- |
| **TSV** (default) | `?format=tsv` or no param | `variant-labels-YYYYMMDD-HHMM.tsv` | **BarTender** | raw digits, `2060243168255` |
| **CSV** | `?format=csv` | `variant-labels-excel-YYYYMMDD-HHMM.csv` | **Excel / humans** | Excel text formula, `="2060243168255"` |

**Rule of thumb: the printer only ever eats TSV.** The `excel` prefix in the CSV
filename exists to make that mistake obvious before a label comes out reading
`="2060243168255"`. If a BarTender text object shows the equals sign and quotes,
the CSV was loaded by mistake — reconnect the database to the `.tsv` file.

Why the CSV is escaped at all: a bare 13-digit EAN-13 is a perfectly valid
number to Excel, so it displays as `2.06024E+12` in General format and any
edit/save round-trip can persist that scientific string, destroying the code.
Wrapping the value in `="…"` forces the cell to text. This wrapping is applied
**only** to plain ASCII digits — anything else (empty, `2060ABC`, punctuation)
is exported untouched, because `="…"` is a live formula and must never be built
from arbitrary content.

Both formats are UTF-8 **with a byte-order mark** (`EF BB BF`) at byte 0, use
`CRLF` line endings, and contain no embedded tab/newline inside a field (the
builder collapses all whitespace in `product_name` and `options_summary`), so a
Persian title can never split into an extra row.

### Columns

```
barcode<TAB>product_name<TAB>options_summary
2060243168255<TAB>پیراهن مردانه<TAB>رنگ: سفید | سایز: L
```

Placeholder `-DEFAULT` variants are always excluded. Out-of-stock variants are
excluded unless `include_out_of_stock=1`. An explicit `variant_ids` selection
(admin grid checkboxes) is honoured regardless of stock or the other filters.

---

## 2. Garbled Persian: the three real causes

The export itself is valid UTF-8. In practice, unreadable Persian comes from one
of these, in this order of likelihood:

1. **Printer-resident device fonts.** BarTender binds a text object to the
   printer's built-in font (Font A/B, "printer font") by default in some
   templates. The SNBC firmware fonts have no Arabic/Persian code page, so the
   bytes are rendered as whatever single-byte table the firmware has. Symptom:
   boxes, question marks, or Latin gibberish — identical for every label.
2. **Data source read as ANSI.** BarTender's text-file connection keeps an
   encoding per connection. A connection created before the file was UTF-8 (or
   one saved as "ANSI"/Windows-1256) re-interprets every byte. Symptom:
   mojibake like `Ù¾ÛŒØ±Ø§Ù‡Ù†` — the classic UTF-8-read-as-Latin-1 pattern.
3. **No Arabic shaping.** Persian letters must be contextually shaped and laid
   out right-to-left. Raster/TrueType rendering gets this from Windows; a
   device-font or driver text path usually does not. Symptom: correct letters
   but disconnected and/or reversed (`ن ه ا ر ی پ` instead of `پیراهن`).

Fixes for each are in §3 and §4.

---

## 3. Printer driver setup (SNBC BTP-U100t)

Use the vendor/Seagull-based Windows driver for the model (USB). Exact menu
labels differ between driver revisions — the setting *names* below are the ones
to look for.

1. **Install the driver**, then open
   `Printers & scanners → SNBC BTP-U100t → Printing preferences`.
2. **Force TrueType as graphics/raster.** In the driver's advanced/options tab,
   set the equivalent of:
   * `TrueType Font: Download as Graphic` / `Download as Bitmap` /
     `Print text as graphics`
   * disable `Use printer fonts` / `Substitute with device fonts` /
     `Font substitution`
   * if present, `Raster graphics` (not `Native/printer commands`) for the
     text/logo objects.
   This is the single most important setting: it makes Windows shape and
   rasterise Persian, so the printer only receives dots.
3. **Media and sensor.** Set the label size to the physical stock, calibrate the
   gap/black-mark sensor (`Calibration` in the driver or the printer's feed
   button per its manual), and keep `203 dpi` in BarTender's page setup so
   object sizes map 1:1.
4. **Darkness/speed.** Low darkness makes thin Persian strokes break up; too
   high smears. Adjust after the text itself is correct.

Note: some SNBC units ship with a ZPL-compatible mode. If your driver offers
`ZPL`/`EPL` emulation, rasterised TrueType text still works (the driver
converts the bitmap), but **never** send Persian through ZPL `^FD` text fields
with a device font — that path is exactly case 1 above.

---

## 4. BarTender configuration

### 4.1 Database connection (UTF-8)

`File → Database Connection → Text File` (or the `.tsv` created by the export):

* **File name:** the downloaded `.tsv` (copy it to a fixed local path BarTender
  can always see; never point BarTender at a browser download folder).
* **Encoding:** `UTF-8` — with BOM detection enabled if the option exists
  (`UTF-8` / `Unicode (UTF-8)` / `65001`). Do **not** leave it on `ANSI`,
  `Windows-1256`, `Arabic`, or `Automatic`.
* **Delimiter:** `Tab`. **Text qualifier:** none (or `"`).
* **First row contains field names:** enabled — the header is
  `barcode`, `product_name`, `options_summary`.
* After changing encoding, **delete and recreate the connection** (or use
  `Refresh`) — BarTender caches the parsed schema per connection, so an
  encoding fix applied in place often appears to do nothing.

**BOM gotcha:** a few BarTender builds keep the BOM attached to the first header,
so the field list shows `﻿barcode` and the mapping silently resolves to nothing.
If the first field looks "empty but present", re-select the field name from the
dropdown rather than retyping it. Do not remove the BOM from the file — Excel
needs it to auto-detect UTF-8 on double-click.

### 4.2 Text objects (the Persian fields)

For every object bound to `product_name` and `options_summary`:

* **Font source:** a **Windows TrueType** font — `Vazirmatn` (shipped in
  `static/fonts/` of the backend, SIL OFL licensed) or `Tahoma` as a fallback.
  BarTender indicates a device font with a printer glyph next to the name; the
  correct choice shows the TrueType icon. **Never** pick a font in the printer
  font section.
* **Download as graphic / "TrueType as graphics"** must be on for that object
  (object-level check box, in addition to the driver setting).
* **Alignment:** right-aligned, and enable right-to-left / bidi for the object
  if the version exposes it; otherwise rely on the rasterised Windows layout.
* **Autofit / shrink-to-fit:** keep it on for `options_summary`, which varies in
  length (`رنگ: سفید | سایز: L`), so long option strings are not clipped.
* **Size floor:** at 203 dpi, Persian below ~8 pt (bold preferred) loses its
  dots and shaping detail. Prefer 9–10 pt for titles, 7–8 pt minimum for options.

### 4.3 Barcode object

Bind the barcode object to the `barcode` field, symbology **EAN-13** (values are
valid EAN-13 in the reserved `20…` in-store band) or **Code 128** over the same
digits. Make sure the human-readable text under the bars comes from the same
field and that it is a text/graphic path, not a device font. Keep the field
narrow enough that no truncation occurs — the export never pads or truncates, so
what the label shows is what the counter will scan.

---

## 5. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Label shows `="2060243168255"` | CSV was loaded instead of TSV | Reconnect to `variant-labels-….tsv` |
| Barcode shows `2.06024E+12` (Excel) | CSV opened as numbers | Expected — the cell is escaped; use the TSV for printing |
| `﻿barcode` in the field list, object prints nothing | BOM attached to first header | Re-pick the field name from the dropdown |
| Boxes / `?????` instead of Persian | Device/printer font | Switch object to Vazirmatn/Tahoma + TrueType-as-graphics (§3.2, §4.2) |
| `Ù¾ÛŒØ±Ø§Ù‡Ù†` mojibake | Connection read as ANSI | Set encoding UTF-8, recreate the connection |
| Correct letters, but disconnected/reversed | No Arabic shaping | Raster/TrueType path; remove device-font substitution |
| All columns in one field / blank fields | Delimiter mismatch | Set delimiter to Tab, re-read the header |
| Only the first rows print, rest stale | BarTender keeps the old file open | Close/overwrite the file, `Refresh` the database connection |
| Persian clipped at the right edge | Object too narrow, autofit off | Enable autofit, widen the object |
| Last row missing | File still being written | Wait for the download to finish, then reconnect |

---

## 6. Excel notes (CSV only)

* Double-click the `.csv`: the BOM makes Excel pick UTF-8, and `="…"` keeps the
  13-digit code as text. Excel shows the *result* (`2060243168255`), not the
  formula.
* In Notepad the barcode cell looks over-escaped — `"=""2060243168255"""` —
  because the field itself contains quotes. That is a valid CSV field which
  every spreadsheet unquotes back to `="2060243168255"`. If it appears inside a
  printed label, the CSV reached BarTender by mistake.
* **Do not re-save through Excel to feed the printer.** Excel writes the
  displayed value back, dropping the `="…"` wrapper — the file stops being
  Excel-safe. Always download a fresh TSV instead.
* A `,`-delimited CSV is correct for Iranian/English locales. If the whole line
  lands in column A, that machine's list separator is not `,` — either use
  `Data → From Text/CSV` and choose comma, or use the TSV.

---

## 7. Pre-flight checklist

- [ ] Downloaded the **TSV** (filename starts `variant-labels-`, not `…-excel-`)
- [ ] BarTender connection is UTF-8, Tab-delimited, first row = header
- [ ] Every Persian text object uses a Windows TrueType font (Vazirmatn/Tahoma)
- [ ] Driver and object both rasterise TrueType (no device fonts)
- [ ] Barcode object bound to `barcode`, symbology EAN-13 / Code 128
- [ ] One test label scanned with the counter scanner returns the right variant
- [ ] Persian title and options are shaped, right-aligned, not clipped
