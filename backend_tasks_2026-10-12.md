# Backend Task Report — 2026-10-12

## 1. Report Metadata
- **Report Date:** 2026-10-12
- **Related Backend Commit SHAs:**
  - `03edfe680aa55f721b86b8de842aed65e3b2d5ae` (feat(remediation): cart-merge resilience, MAVI order prefix, admin product list, brand seeds)
  - `5ab531b237b0cedf880fa34482a407655308ef2e` (یک مایگریشن کوچک)
  - `f1d39f8988a141e9ad0e5220bc77807fce367c55` (feat(backend-tasks): profile email, clearable relations, rich collection cards, discount plumbing)
- **Overall Status:** Open / Action Required by Backend Engineer
- **Overall Priority:** Medium-High

---

## 2. Executive Summary
During the frontend-backend contract synchronization analysis of recent backend commits (`03edfe6`, `5ab531b`, and `f1d39f8`), two backend-side limitations/omissions were identified in the newly introduced `AdminProductViewSet.list` endpoint (`GET /api/admin/products/`):
1. **Missing `category` query parameter extraction:** The admin product listing endpoint supports `search` and `status`, but fails to extract and pass `category` or `category_id` to `ProductSelector.get_all_products_admin`, preventing administrators from filtering the product catalog by category.
2. **Standard pagination caps page size at 20 without admin override:** `AdminProductViewSet` inherits `StandardPagination` (`max_page_size = 20`). Administrators managing a large inventory cannot request larger batches (e.g., 50 or 100 items), forcing excessive client-side pagination roundtrips.

Resolving these two items will ensure seamless catalog management and robust inventory inspection from the admin panel.

---

## 3. Current Backend Behavior
- **File:** `backend/products/views.py` (`AdminProductViewSet.list`, lines 122–138)
  ```python
  def list(self, request):
      """GET /api/admin/products/?search=&status= — full catalog for admins,
      all statuses (draft/published/archived), soft-deleted excluded."""
      filters = {}
      search = request.query_params.get("search")
      if search:
          filters["search"] = search
      status_filter = request.query_params.get("status")
      if status_filter:
          filters["status"] = status_filter
      queryset = ProductSelector.get_all_products_admin(filters or None)
      page = self.paginate_queryset(queryset)
      if page is not None:
          serializer = ProductDetailSerializer(page, many=True, context={"request": request})
          return self.get_paginated_response(serializer.data)
      serializer = ProductDetailSerializer(queryset, many=True, context={"request": request})
      return Response(serializer.data)
  ```
- **File:** `backend/products/selectors.py` (`ProductSelector._apply_common_filters`, lines 57–67)
  `ProductSelector` fully supports filtering by category UUID or slug when `category` or `category_slug` is present in `filters`:
  ```python
  category = filters.get("category") or filters.get("category_slug")
  if category:
      ...
      qs = qs.filter(category=cat_obj)
  ```
  However, `AdminProductViewSet.list` never checks `request.query_params.get("category")`.
- **File:** `backend/core/pagination.py` (`StandardPagination`, lines 5–8)
  ```python
  class StandardPagination(PageNumberPagination):
      page_size = 20
      page_size_query_param = "page_size"
      max_page_size = 20
  ```
  Because `max_page_size = 20`, passing `?page_size=50` or `?page_size=100` is silently capped at 20 items.

---

## 4. Frontend Expectations
- **Admin Products Page (`frontend/src/app/admin/products/page.tsx`):**
  - Administrators need to filter the catalog by Category (via dropdown selector) as well as Status and Search text.
  - The frontend expects `GET /api/admin/products/?category=<category_id_or_slug>` to filter catalog products by category, matching the behavior of public `GET /api/products/?category=...`.
  - When batching products for export, table views, or quick audits, the frontend needs the ability to request up to 100 products per page via `?page_size=50` or `?page_size=100`.

---

## 5. Detailed Backend Tasks

### Task BET-2026-10-12-01: Add Category Filter Extraction to `AdminProductViewSet.list`
- **Task ID:** `BET-2026-10-12-01`
- **Title:** Support `category` and `category_id` query parameters in `AdminProductViewSet.list`
- **Priority:** High
- **Related Commit SHA:** `03edfe680aa55f721b86b8de842aed65e3b2d5ae`
- **Affected API Endpoints:** `GET /api/admin/products/`
- **Affected Backend Component:** `backend/products/views.py` (`AdminProductViewSet.list`)
- **Current Behavior:** Only `search` and `status` query parameters are extracted into `filters`. Any `category` query parameter sent by the client is discarded.
- **Problem / Contract Mismatch:** Admin catalog UI cannot filter products by category on the server.
- **Required Backend Changes:**
  In `backend/products/views.py` inside `AdminProductViewSet.list`:
  ```python
  category_filter = request.query_params.get("category") or request.query_params.get("category_id")
  if category_filter:
      filters["category"] = category_filter
  ```
- **Expected API Contract:**
  - **Method & Route:** `GET /api/admin/products/?category=<uuid-or-slug>`
  - **Status Code:** `200 OK`
  - **Response Payload:** Paginated list of products matching the specified category, plus any `status` and `search` filters provided.
- **Authentication & Authorization:** Requires staff/admin credentials (`IsAdminUser`).
- **Validation & Error Handling:** If category does not match, return an empty results page `{"count": 0, "results": []}` rather than a 500 server error (already handled by `ProductSelector`).
- **Compatibility Considerations:** 100% backward-compatible. Existing queries without `category` remain unchanged.
- **Acceptance Criteria:**
  - Requesting `GET /api/admin/products/?category=<category_uuid>` returns only products belonging to that category.
  - Requesting `GET /api/admin/products/?category=<category_slug>` returns only products belonging to that category.
- **Required Tests:** Unit/integration test in `backend/products/tests/` asserting that `GET /api/admin/products/?category={id}` filters products accordingly.
- **Expected Effect on Frontend Sync:** Enables the category filter dropdown in the Admin Products dashboard to filter products on the server.

---

### Task BET-2026-10-12-02: Provide Admin-Specific Pagination with Configurable `max_page_size`
- **Task ID:** `BET-2026-10-12-02`
- **Title:** Introduce `AdminPagination` with `max_page_size = 100` for Admin ViewSets
- **Priority:** Medium
- **Related Commit SHA:** `03edfe680aa55f721b86b8de842aed65e3b2d5ae`
- **Affected API Endpoints:** `GET /api/admin/products/` (and other admin list endpoints)
- **Affected Backend Component:** `backend/core/pagination.py` and `backend/products/views.py`
- **Current Behavior:** `StandardPagination` defines `max_page_size = 20`. This protects public APIs from OFFSET DoS attacks, but restricts authenticated administrators to 20 items per page.
- **Problem / Contract Mismatch:** Admin catalog views are forced to execute multiple page requests even when reviewing moderate catalogs of 50–100 products.
- **Required Backend Changes:**
  1. In `backend/core/pagination.py`, create:
     ```python
     class AdminPagination(PageNumberPagination):
         page_size = 50
         page_size_query_param = "page_size"
         max_page_size = 100
     ```
  2. In `AdminProductViewSet`, set `pagination_class = AdminPagination`.
- **Expected API Contract:**
  - **Method & Route:** `GET /api/admin/products/?page_size=50`
  - **Response Payload:** Up to 50 product items in `results`.
- **Authentication & Authorization:** Protected by `IsAdminUser`.
- **Acceptance Criteria:**
  - Requesting `GET /api/admin/products/?page_size=50` returns 50 products when available.
  - Requesting `GET /api/admin/products/?page_size=150` caps at 100 products.
- **Required Tests:** Test asserting `page_size` query parameter returns up to 100 items for authenticated admin requests.
- **Expected Effect on Frontend Sync:** Dramatically improves catalog table loading speed and reduces roundtrips in the admin panel.

---

## 6. Recommended Implementation Order
1. **Task BET-2026-10-12-01 (Category Filter):** Immediate quick-win (1 line in `backend/products/views.py`).
2. **Task BET-2026-10-12-02 (Admin Pagination):** Create `AdminPagination` class in `backend/core/pagination.py` and assign to `AdminProductViewSet`.

---

## 7. Frontend Impact and Follow-Up
- Frontend has been synchronized to pass `category` and pagination parameters in `adminApi.getProducts({ category, page, page_size })`.
- Frontend profile page has been updated to support `email` viewing and updates via `PATCH /api/users/me/`.
- Notification parser has been updated to recognize `MAVI-` order identifiers.

---

## 8. Completion Checklist (for Backend Engineer)
- [ ] Implement `category` query parameter extraction in `AdminProductViewSet.list` (`BET-2026-10-12-01`).
- [ ] Add `AdminPagination` with `max_page_size = 100` and attach to `AdminProductViewSet` (`BET-2026-10-12-02`).
- [ ] Run test suite: `pytest products/tests/`.
- [ ] Verify `GET /api/admin/products/?category=<id>&page_size=50` returns expected results.

---

## 9. Outstanding Questions
- None. All contract requirements are confirmed by existing selectors and serializers.
