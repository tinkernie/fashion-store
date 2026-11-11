# POS Counter — Frontend Integration Guide

Self-contained contract for building the in-store counter screen in the custom
admin panel. Covers authentication, barcode scan, "Confirm Sale", the optional
invoice modal, invoice PDF download, and selective barcode-label export.

Every shape below was captured from the running API, not designed on paper.

---

## 1. Conventions

| Item | Value |
|---|---|
| API base | same origin, `/api` (e.g. `https://shop.example/api/admin/pos/sales/`) |
| Content type | `application/json; charset=utf-8` for all POST/PATCH bodies |
| Auth | Staff JWT, `Authorization: Bearer <access_token>` |
| Money | **integer toman** in JSON (`180000`), no decimals, no currency symbol |
| Timestamps | ISO-8601 UTC (`2026-11-11T16:41:48.214040+00:00`); convert to Tehran (+03:30) for display |
| IDs | UUID strings. The POS sale id is a UUID; the human invoice number is `order_number` (`POS-YYYYMMDD-000001`) |
| CORS (if panel is on another origin) | `Content-Disposition` and `X-Label-Rows` are exposed by the API |

### 1.1 The two error envelopes

The API uses two shapes. Both are normalised by the helper in §10, but know them:

**A. Domain errors** — POS business rules (409 conflicts, invoice validation):

```json
{ "detail": "Not enough stock to complete the sale.", "code": "insufficient_stock", "lines": [ ... ] }
```

**B. Framework errors** — DRF validation, 401, 403, 404 from view lookups:

```json
{
  "error": {
    "code": 400,
    "message": "{'items': {'non_field_errors': [ErrorDetail(string='This list may not be empty.', code='empty')]}}",
    "errors": { "items": { "non_field_errors": ["This list may not be empty."] } }
  }
}
```

For shape B, render `error.errors`; `error.message` is a Python-style string and is
only useful for logs. For shape A, show `detail` (or a Persian translation of
`code`) and use `lines` to highlight specific basket rows.

---

## 2. Authentication (Staff JWT)

Cashiers must be Django **staff** users (`is_staff = true`): every endpoint here
uses `IsAdminUser`. A normal customer account gets `403`.

### Login

```http
POST /api/auth/login/
Content-Type: application/json

{ "phone_number": "09121234567", "password": "••••••••" }
```

```json
{
  "access": "eyJhbGciOi...",
  "refresh": "eyJhbGciOi...",
  "user": {
    "id": "74378c0c-1a32-4975-a9d0-47aa7c55520d",
    "phone_number": "09121234567",
    "first_name": "زهرا",
    "last_name": "محمدی",
    "is_staff": true,
    "is_superuser": false
  }
}
```

- Send `Authorization: Bearer <access>` on every POS request, including the PDF
  and CSV downloads (they are `fetch` + blob, not plain `<a href>`).
- `401` → "نشست شما منقضی شده است" and redirect to login. Do **not** silently retry
  a sale after a 401 with a new token until you know the first call's outcome —
  reuse the same `client_reference` (see §5.2).
- `403` → "دسترسی صندوق‌داری ندارید" (user is not staff).
- Refresh: `POST /api/auth/token/refresh/` with `{ "refresh": "..." }`.

```js
async function posFetch(path, { method = "GET", body, token } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}
```

---

## 3. Counter screen flow

```
[Scan input, always focused]
        │  GET /admin/pos/scan/<barcode>/
        ▼
[Local basket]  ← qty stepper, remove line, running total from variant.price
        │  POST /admin/pos/sales/   (client_reference generated once per basket attempt)
        ▼
[Sale committed — stock already deducted]
        │
        ├── optional: PATCH /admin/pos/sales/<sale_id>/   (phone, discount, notes)
        │
        └── optional: GET /admin/orders/<sale_id>/invoice.pdf   (receipt)
```

Two rules that shape the whole UI:

1. **Stock leaves the shop on Confirm Sale**, not when the invoice modal is saved.
   After a `201` you cannot "cancel" by closing a modal — a void/reversal is a
   separate future flow.
2. **The server prices the sale.** The client total is only a preview; the `201`
   response is the truth (see §5.6 "price drift").

---

## 4. Scan a barcode

```http
GET /api/admin/pos/scan/6260000000012/
Authorization: Bearer <access>
```

### 200 response

```json
{
  "id": "fb223d63-9688-4dfa-994d-d7d232180c5d",
  "barcode": "6260000000012",
  "sku": "MAVI-M-R",
  "product_id": "279e794e-f7c4-43cf-9f19-d2df84c0af26",
  "product_title": "مانتو کتان مدل رها",
  "product_slug": "manto-katan-raha",
  "price": 1850000,
  "status": "published",
  "availability": "in_stock",
  "is_active": true,
  "stock": 3,
  "reserved": 1,
  "sellable": 2,
  "is_sellable": true,
  "options": [
    { "option_name": "سایز", "value": "M" },
    { "option_name": "رنگ", "value": "مشکی" }
  ]
}
```

| Field | Meaning |
|---|---|
| `stock` | physical units on the shelf (`available_quantity`) |
| `reserved` | units held for online orders |
| `sellable` | `max(stock - reserved, 0)` — units you may sell without an override |
| `is_sellable` | `is_active && status === "published" && stock > 0` — "can this be added at all?" |
| `is_active` | variant and product are not soft-deleted |
| `status` | `published` / `draft` / `discontinued` / … |
| `availability` | merchandising flag (`in_stock` / `out_of_stock` / `pre_order`) |
| `options` | display pairs; empty for optionless products |
| `price` | integer toman; the authoritative unit price |

Images are not part of this payload (the counter needs speed, not thumbnails);
use `product_id`/`product_slug` only if your basket design truly needs artwork.

### Decision table

| Case | Response | UI |
|---|---|---|
| Unknown barcode | `404 {"detail":"Barcode not found.","code":"barcode_not_found"}` | toast «بارکد در سیستم نیست», clear input, keep focus. Do not treat as an error dialog. |
| `is_sellable === false` | `200` | Block "add". Message by cause: `!is_active` → «کالا حذف شده است»; `status !== "published"` → «کالا غیرفعال است»; `stock === 0` → «موجودی صفر است». |
| `sellable === 0 && stock > 0` | `200` | Reserved for online orders. Warn «این کالا برای سفارش آنلاین رزرو شده است» and require a deliberate confirmation. The basket then needs the override flag on Confirm Sale (§5.3). |
| `sellable < requested` | `200` | Cap the quantity stepper at `sellable` in normal mode; cap at `stock` in override mode. |
| Network error | — | Keep the scanner input usable; offer a manual SKU search fallback. |

### Keyboard-wedge scanners

Scanner guns type the barcode then `Enter`. Keep one hidden/visible input
focused at all times, buffer characters, and submit on `Enter`; ignore input
shorter than ~3 chars and debounce duplicate identical scans within ~800 ms.
Always restore focus after every modal/toast.

```js
async function scanBarcode(code) {
  const res = await posFetch(`/api/admin/pos/scan/${encodeURIComponent(code)}/`, { token });
  if (res.status === 404) return { kind: "not_found" };
  if (!res.ok) throw await toError(res);
  const v = await res.json();
  if (!v.is_sellable) return { kind: "blocked", variant: v };
  return { kind: "ok", variant: v };
}
```

---

## 5. Confirm Sale

```http
POST /api/admin/pos/sales/
Authorization: Bearer <access>
Content-Type: application/json
```

### 5.1 Payload

```json
{
  "client_reference": "3f0f9a26-1d1e-4a63-9d5b-8a5f0f6f4a11",
  "pos_terminal": "counter-1",
  "allow_reserved_override": false,
  "items": [
    { "variant_id": "fb223d63-9688-4dfa-994d-d7d232180c5d", "quantity": 2 },
    { "variant_id": "0a6e1c8c-1a6f-4a7c-8a0c-2b2a4f2b7d31", "quantity": 1 }
  ]
}
```

| Field | Required | Rules |
|---|---|---|
| `items` | yes | 1–200 lines, `quantity` 1–999. Repeat scans of the same `variant_id` are merged server-side into one line. |
| `client_reference` | strongly recommended | ≤ 64 chars. Idempotency key. |
| `pos_terminal` | no | ≤ 64 chars, free text (`counter-1`, `صندوق ۱`, …). Printed on the invoice. |
| `allow_reserved_override` | no | `false` by default. `true` lets the sale consume units reserved for online orders (never more than `stock`). |

Prices are **not** accepted from the client. Amounts are computed from
`Variant.price` at commit time.

### 5.2 Generating `client_reference` (idempotency)

One UUID per **basket attempt**, generated client-side:

```js
const newClientReference = () =>
  (crypto.randomUUID?.() ??
    `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`);

// Generate once, when the cashier first presses "Confirm Sale".
// Reuse the SAME value for every retry of that attempt (timeout, 5xx, offline).
// Only mint a new one after a definitive outcome (201/200, or a 4xx the cashier
// must fix) and when starting the next sale.
```

Why: a double-tap, a flaky connection, or a proxy retry must never deduct stock
twice. The server stores `client_reference` under a unique index and replies with
the original sale if the same reference arrives again — even under a race.

### 5.3 Response: `201 Created` vs `200 OK`

- **`201`** — a new sale was committed. Stock is now deducted. `"replayed": false`.
- **`200`** — this exact `client_reference` was already used; you receive the
  original sale unchanged. `"replayed": true`. Do **not** show an error and do
  **not** charge again.

Success body (abridged; the real object is the full order):

```json
{
  "id": "7e5b7ea8-49ff-4f4c-a42e-772bf3f08801",
  "order_number": "POS-20261111-000001",
  "status": "paid",
  "channel": "pos",
  "pos_terminal": "counter-1",
  "client_reference": "3f0f9a26-...",
  "cashier": { "id": "74378c0c-...", "name": "زهرا محمدی" },
  "subtotal": 200000,
  "discount_amount": 0,
  "tax_amount": 0,
  "shipping_cost": 0,
  "total": 200000,
  "customer": { "id": null, "full_name": "مشتری حضوری", "phone": "", "email": "" },
  "customer_name": "مشتری حضوری",
  "customer_phone": "",
  "shipping_method": "pickup",
  "placed_at": "2026-11-11T16:41:48.214040+00:00",
  "paid_at": "2026-11-11T16:41:48.214040+00:00",
  "items": [
    {
      "id": "1eda82ca-07ba-4c26-a5e3-0b9c51b91776",
      "product_snapshot": {
        "title": "مانتو کتان مدل رها",
        "options": "سایز: M، رنگ: مشکی",
        "sku": "MAVI-M-R",
        "image": ""
      },
      "quantity": 2,
      "price": 100000,
      "line_total": 200000
    }
  ],
  "payments": [],
  "payment_info": null,
  "status_history": [{ "from": null, "to": "paid", "note": "counter sale", "...": "..." }],
  "replayed": false
}
```

Notes:
- `payments` is always empty and `payment_info` is always `null`: the counter
  records a completed sale, there is no gateway step.
- `status` is already `paid`; do not offer a "mark as paid" action.
- Item snapshots carry `title`, `options` (single string) and `sku`; render those
  in the basket review and receipt preview.

### 5.4 `409` — conflicts that must be resolved by the cashier

All 409s change nothing: no order, no stock movement. Body shape:

```json
{
  "detail": "Not enough stock to complete the sale.",
  "code": "insufficient_stock",
  "lines": [
    {
      "variant_id": "fb223d63-9688-4dfa-994d-d7d232180c5d",
      "sku": "DOC-d065ee",
      "requested": 9,
      "available": 2,
      "reserved": 0,
      "sellable": 2,
      "reason": "insufficient_stock"
    }
  ]
}
```

| `code` | `reason` per line | Meaning | UI action |
|---|---|---|---|
| `insufficient_stock` | `insufficient_stock` | Not enough physical units | Highlight the lines, refresh `scan` for each, let the cashier reduce/remove; resend the **same** `client_reference` after fixing. |
| `reserved_stock` | `reserved_for_online_order` | Units exist but are reserved | Modal: «رزرو آنلاین» → cancel, or «فروش با تخصیص» which resends with `allow_reserved_override: true`. |
| `variant_not_found` | `variant_not_found` | Deleted variant (stale basket) | Remove line, toast, refresh basket. |
| `variant_not_sellable` | `variant_not_sellable` | Draft/discontinued/placeholder variant | Remove line, toast. |
| `client_reference_conflict` | — | The reference belongs to a non-POS order (should not happen with correct usage) | Mint a fresh UUID and resend; log it. |

`lines[]` may contain only the failing rows; success and failure are validated
line-by-line before anything is written.

### 5.5 `400` — malformed request

Framework envelope (§1.1 B). Typical causes: empty `items`, `quantity: 0`,
unknown fields are ignored. Fix and resend with the same `client_reference`.

### 5.6 Price drift

There is no "price lock" and no dedicated drift error. The server prices at
commit time, so:

- Compute the preview total from `variant.price` from the scan response.
- On `201`, compare `response.subtotal` with the preview.
  - Equal → normal flow.
  - Different → the catalog price changed between scan and commit. **The sale is
    already committed at the server price.** Show
    «قیمت کالا به‌روزرسانی شد؛ مبلغ نهایی: …» and continue with the response
    totals (do not silently re-run the sale, and never charge the preview).
- The same applies to a line whose price changed: use `items[].price` from the
  response for the receipt preview.

### 5.7 Example

```js
async function confirmSale({ items, terminal, allowReservedOverride, clientReference }) {
  const res = await posFetch("/api/admin/pos/sales/", {
    method: "POST",
    token,
    body: {
      client_reference: clientReference,
      pos_terminal: terminal,
      allow_reserved_override: allowReservedOverride,
      items: items.map((l) => ({ variant_id: l.variant.id, quantity: l.quantity })),
    },
  });

  if (res.status === 201 || res.status === 200) {
    const sale = await res.json();
    return { sale, replayed: sale.replayed === true };
  }
  if (res.status === 409) {
    const conflict = await res.json();
    return { conflict };           // { detail, code, lines }
  }
  throw await toError(res);        // 400 / 401 / 403 / 5xx
}
```

---

## 6. Optional invoice completion

The modal is **optional and dismissible**. Stock and the order already exist, so:

- Closing the modal (X / `Esc` / «بعداً») makes **no request**. Nothing is lost.
- Saving only enriches the order (phone on the receipt, discount, note).
- The PDF (§7) can be downloaded before or after this PATCH.

```http
PATCH /api/admin/pos/sales/<sale_id>/
Authorization: Bearer <access>
Content-Type: application/json
```

`<sale_id>` is the UUID from the `201`/`200` response (`id`), **not** `order_number`.

### 6.1 Payload (any subset)

```json
{
  "customer_phone": "09121234567",
  "discount_type": "percent",
  "discount_value": "10",
  "notes": "تعویض سایز تا ۴۸ ساعت"
}
```

| Field | Rules |
|---|---|
| `customer_phone` | Optional. Iranian mobile: `^09\d{9}$` (11 digits). Send `""` to clear. |
| `discount_type` | `"percent"` or `"flat"`. Must be sent **together** with `discount_value`. |
| `discount_value` | `percent`: 0–100. `flat`: 0 ≤ value ≤ `subtotal` (toman). Send as a **string** to avoid float issues. |
| `notes` | ≤ 2000 chars, printed under the totals as «یادداشت». |

Semantics:
- `percent` discount is computed on `subtotal` and rounded to 2 decimals;
  `flat` is taken as-is.
- `total = subtotal − discount + shipping + tax` (shipping and tax are 0 for a
  counter sale).
- The response is the full order object (same shape as §5.3), already updated.
- Send only the fields you want to change; old values are untouched. Sending
  `discount_type`/`discount_value` again replaces the previous discount rather
  than stacking.

### 6.2 Example

Basket: 1 × 1,850,000 + 2 × 980,000 = 3,810,000.
`{"discount_type":"percent","discount_value":"10"}` → `discount_amount: 381000`,
`total: 3429000`.

```js
await posFetch(`/api/admin/pos/sales/${saleId}/`, {
  method: "PATCH", token,
  body: { customer_phone, discount_type: "percent", discount_value: "10", notes },
});
```

### 6.3 Errors

| Status | Body | Meaning |
|---|---|---|
| `400` | `{"detail":"Discount cannot exceed the subtotal.","code":"invalid_discount"}` | Flat discount > subtotal, or percent > 100. |
| `400` | `{"detail":"discount_value is required with discount_type.","code":"discount_incomplete"}` | Send both together. |
| `400` | framework envelope | Bad phone, notes too long, missing paired field. |
| `404` | `{"detail":"Sale not found.","code":"sale_not_found"}` | Wrong id or malformed UUID. |
| `409` | `{"detail":"...","code":"not_pos_sale"}` | The id belongs to an online order. |

Because the PATCH is post-sale, a failed PATCH never needs a refund: fix the
field and retry, or dismiss.

---

## 7. Invoice PDF (receipt)

```http
GET /api/admin/orders/<sale_id_or_order_number>/invoice.pdf
Authorization: Bearer <access>
```

- Accepts the sale UUID **or** `POS-…` order number.
- `200` → `application/pdf`, `Content-Disposition: attachment; filename="POS-20261111-000001.pdf"`,
  `Cache-Control: private, no-store`.
- Rendered on demand: brand header, Jalali date/time (Tehran), cashier name,
  customer phone when present, line items with options, discount, total, and the
  return-policy footer «امکان تعویض کالا تا ۴۸ ساعت با ارائه فاکتور».
- A5 portrait, RTL, Vazirmatn — no client-side template.
- `503 {"detail":"Invoice PDF rendering is unavailable on this server.","code":"invoice_render_unavailable"}`
  if the deployment is missing the Pango runtime; show «چاپ فاکتور در حال حاضر
  امکان‌پذیر نیست» and fall back to the on-screen invoice.
- `404 {"detail":"Order not found.","code":"order_not_found"}` for unknown ids.

```js
async function downloadInvoice(orderRef) {
  const res = await posFetch(`/api/admin/orders/${orderRef}/invoice.pdf`, { token });
  if (!res.ok) throw await toError(res);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");                 // opens the browser PDF viewer
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
```

Do not use a plain `<a href>`: the download needs the `Authorization` header.
`Content-Disposition` is not readable on cross-origin responses unless exposed
(it is), but naming the blob from `order_number` is simpler and reliable.

Printing: open the blob URL and let the browser print. No thermal/ESC-POS
integration is provided or expected.

---

## 8. Selective label export (barcode printing)

```http
POST /api/admin/variants/export-labels/?format=csv
Authorization: Bearer <access>
Content-Type: application/json

{ "variant_ids": ["fb223d63-9688-4dfa-994d-d7d232180c5d", "0a6e1c8c-1a6f-4a7c-8a0c-2b2a4f2b7d31"] }
```

- When `variant_ids` is present it **wins over all filters**: exactly those
  variants are exported (soft-deleted variants and `-DEFAULT` placeholders are
  still skipped; a variant without a barcode exports an empty barcode cell).
- Omit `variant_ids` (or send it empty) to export the filtered catalog as before.
- `format=csv` for comma-separated; default is `?format=tsv` for BarTender.
- Query-string variants also work: `?variant_ids=id1,id2` or repeated
  `?variant_ids=id1&variant_ids=id2`.
- Invalid UUIDs → `400 {"detail":"Invalid variant id: …","code":"invalid_variant_ids"}`.

Response:

```
200 OK
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="variant-labels-20261111-2041.csv"
X-Label-Rows: 2
```

- UTF-8 **with BOM**, CRLF line endings (Excel/BarTender friendly).
- Columns: `barcode`, `product_name`, `options_summary`.
- `X-Label-Rows` is the data-row count (excluding header) — use it for "N labels
  queued" feedback.

```js
async function downloadLabels(variantIds) {
  const res = await fetch("/api/admin/variants/export-labels/?format=csv", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ variant_ids: variantIds }),
  });
  if (!res.ok) throw await toError(res);
  const rows = res.headers.get("X-Label-Rows");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `labels-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return Number(rows || 0);
}
```

Only variants that participate in the label sheet are counted; if the grid sends
selections that include placeholders, `X-Label-Rows` may be lower than the
selection size.

---

## 9. Showing counter sales in the admin orders list

`GET /api/admin/orders/` already returns POS sales (unpaginated array), newest
first. Relevant fields per row:

| Field | POS value |
|---|---|
| `order_number` | `POS-20261111-000001` |
| `channel` | `"pos"` — use it for the channel badge/filter |
| `customer_name` | account name, else `"مشتری حضوری"` |
| `customer_phone` | invoice phone if entered, else `""` |
| `status` | `"paid"` (already settled at the counter) |
| `total` | integer toman |
| `shipping_method` | `"pickup"` |
| `placed_at` | ISO-8601 UTC |
| `items_count` | number of lines |

- `GET /api/admin/orders/<order_number>/` returns the full order (items,
  snapshots, status history) — same object as the sale response without
  `replayed`.
- `GET /api/admin/orders/?user_id=<uuid>` filters by account, as before.

Suggested list affordances: channel chip «حضوری», phone column, a "فاکتور PDF"
row action, and a link to the cashier name from `cashier.name` on the detail view.

---

## 10. Normalising errors

```js
export async function toError(res) {
  let payload = null;
  try { payload = await res.json(); } catch { /* non-JSON */ }

  if (payload?.error) {
    return {
      status: res.status,
      code: payload.error.code,
      message: payload.error.message,
      fields: payload.error.errors,       // { field: ["..."] }
    };
  }
  if (payload?.detail) {
    return {
      status: res.status,
      code: payload.code || `http_${res.status}`,
      message: payload.detail,
      lines: payload.lines,               // 409 stock conflicts
    };
  }
  return { status: res.status, code: `http_${res.status}`, message: res.statusText };
}
```

### Persian copy for the important codes

| code | Suggested message |
|---|---|
| `barcode_not_found` | بارکد در سیستم ثبت نشده است |
| `insufficient_stock` | موجودی کافی نیست |
| `reserved_stock` | این کالا برای سفارش آنلاین رزرو شده است |
| `variant_not_sellable` | این کالا قابل فروش نیست |
| `invalid_discount` | مبلغ یا درصد تخفیف معتبر نیست |
| `sale_not_found` | فاکتور پیدا نشد |
| `not_pos_sale` | این فاکتور مربوط به فروش حضوری نیست |
| `invoice_render_unavailable` | چاپ فاکتور در حال حاضر امکان‌پذیر نیست |
| `invalid_variant_ids` | انتخاب کالاها معتبر نیست |

---

## 11. QA checklist

- [ ] Scanning with the keyboard-wedge gun adds the line and keeps focus.
- [ ] Unknown barcode → toast, basket unchanged.
- [ ] Out-of-stock and draft variants are rejected before Confirm Sale.
- [ ] Reserved units require the explicit «فروش با تخصیص» confirmation and send `allow_reserved_override: true`.
- [ ] Double-clicking Confirm Sale sends one deduction; second response is `200` with `replayed: true` and the same `order_number`.
- [ ] A forced network failure + retry with the same `client_reference` returns the original sale.
- [ ] `409 insufficient_stock` highlights the exact line and leaves the basket intact.
- [ ] Discount: percent 10 and flat both update `total`; percent 101 and flat > subtotal show a field error.
- [ ] Closing the invoice modal sends no request and leaves the sale intact.
- [ ] `customer_phone` rejects `12345` and accepts `09121234567`.
- [ ] Invoice PDF downloads with the auth header and opens in the browser viewer.
- [ ] Label export with 2 selected variants returns 2 rows and `X-Label-Rows: 2`.
- [ ] Orders list shows the new sale with `channel: "pos"` and the counter phone.
