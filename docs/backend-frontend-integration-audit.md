# Backend Commit Audit, Frontend Integration & Compatibility Report

**Auditor:** Senior Frontend Engineer & Frontend Integration Lead  
**Date:** October 10, 2026  
**Scope:** Backend Commits `e2d51cb` through `5322055` (9 commits)  
**Status:** Phase One Complete — Implementation Plan Ready  

---

## A. Executive Summary

This audit evaluates nine consecutive backend commits made to the repository (`e2d51cb`, `372755b`, `c437778`, `d861285`, `4f416ad`, `7307d5b`, `24a78dc`, `33a208b`, `5322055`) to determine their technical and functional impacts on the frontend application, identify any broken assumptions or missing capabilities, and provide an exact, evidence-based integration plan.

### Summary of Findings
1. **Inspected Commits**: All 9 commits retrieved, inspected, and verified against the live codebase.
2. **Confirmed Frontend Action Items**:
   - **`INT-001` (High)**: New Backend Auto-Fill Endpoint (`POST /api/admin/products/<id>/related/auto-fill/`). Storefront related product rail (`GET /api/products/<slug>/related/`) was switched to return **only manual pins without silent background backfill**. The backend explicitly provided an admin trigger endpoint for smart auto-filling remaining slots, but the frontend admin modal (`ProductRelationsManager`) was completely missing the trigger button and API method.
   - **`INT-002` (Medium)**: Absolute Stock Quantity Endpoint (`POST /api/admin/inventory/<variant_id>/set-quantity/`). The backend added an absolute stock setter alongside delta math. The frontend inventory modal only supported additive/subtractive delta math (`+` / `-`), preventing direct setting of exact on-hand quantities.
   - **`INT-003` (Resolved)**: Free-form variant option subsets (`e2d51cb`, `372755b`). The frontend admin form and storefront variant resolution (`matchedVariant`) have been synchronized to allow partial and zero-option variant combinations.
   - **`INT-004` (Resolved)**: In-place variant editing (`d861285`). Supported with prominent Persian «ویرایش» badge button and inline editing.
   - **`INT-005` (Compatible)**: Collection hero banner media-library URL support (`33a208b`). The frontend was already submitting URLs; the backend `HeroBannerField` now properly accepts them.
   - **`INT-006` (Compatible)**: WebP pipeline hardening and friendly 400 errors (`5322055`). Frontend error handling via `getApiErrorMessage` seamlessly handles new error structures.
3. **Overall Integration Risk**: Low-to-Medium. Existing features remain fully intact; implementing `INT-001` and `INT-002` activates high-value backend capabilities.

---

## B. Commit-by-Commit Analysis

### 1. `e2d51cb36b4622e331c881a1041dd4d8641907d8`
- **Message**: `fix(options): make product options optional and re-addable after delete`
- **Technical Changes**:
  - Replaced hard `unique_together` constraints on `ProductOption` and `OptionValue` with partial `UniqueConstraint` conditioned on `deleted_at IS NULL`.
  - Soft-deleted options resurrect upon re-creation with identical names/values.
  - Variant `option_values` made optional at serializer level.
- **Frontend Impact**: Deleting an option in admin and re-adding an option with the same name no longer throws a 500 error. Form error handling verified compatible.

### 2. `372755b2b108fa1ea14631eee9f31065eff34a26`
- **Message**: `fix(variants): allow free-form option subsets per variant`
- **Technical Changes**:
  - Removed strict clothing-attribute completeness enforcement from `VariantService`.
  - A variant can combine any subset of defined options (or 0 options).
- **Frontend Impact**: Frontend admin variant creation form and storefront `matchedVariant` resolution synchronized to support partial/universal combinations.

### 3. `c4377781de2c3b49e7021042b40fd030177fe97e`
- **Message**: `fix(soft-delete): deleted rows stay hidden and never block re-creation`
- **Technical Changes**:
  - Converted hard unique constraints across products, variants, categories, collections, coupons, pages, site-content to partial unique constraints on `deleted_at IS NULL`.
  - Soft-deleted slugs are reusable; active duplicates return clean 400 `BusinessException`.
- **Frontend Impact**: Frontend entity forms no longer crash with 500 when creating entities with previously deleted slugs.

### 4. `d86128509c6f903b677b60f9880eedd546b47e48`
- **Message**: `feat(admin-edit): in-place editing for products, variants, stock, collections`
- **Technical Changes**:
  - `PATCH /api/admin/products/{id}/` persists `weight` and propagates price updates to DEFAULT variant.
  - `PATCH /api/admin/variants/{id}/` edits variant fields in place.
  - New `POST /api/admin/inventory/{variant_id}/set-quantity/` sets absolute inventory quantity on hand.
- **Frontend Impact**:
  - Requires adding `adminApi.setStockQuantity` and adding an absolute stock mode (`set`) to the inventory adjustment dialog (`INT-002`).

### 5. `4f416ad78f00699c0fe1f20234e99269b0473296`
- **Message**: `fix(variants): reject duplicate option combinations per product`
- **Technical Changes**:
  - Computes canonical signature of `(option_id, value_id)` pairs and rejects duplicate combinations on active variants with a friendly 400 error naming the conflicting SKU.
- **Frontend Impact**: Frontend displays the backend's friendly error message via `toast.error(getApiErrorMessage(err))`.

### 6. `7307d5ba62383813a4aa1003ccb86f4dc9e77659`
- **Message**: `feat(related): manual-only rail plus admin auto-fill button endpoint`
- **Technical Changes**:
  - `GET /api/products/<slug>/related/` returns only stored manual pins (max 8) without silent background backfill.
  - New `POST /api/admin/products/<id>/related/auto-fill/` {?limit=8} auto-fills remaining empty slots with system picks and persists them.
- **Frontend Impact**:
  - **Critical gap (`INT-001`)**: The frontend `ProductRelationsManager` lacked the smart auto-fill button, leaving empty slots unfilled on the storefront. Requires adding `adminApi.autoFillRelatedProducts` and an interactive auto-fill button in the admin modal.

### 7. `24a78dc2fd1163ccc8a8bcb4ff5ba82c91248b2c`
- **Message**: `feat(related): smarter clothing-aware auto-pick scoring`
- **Technical Changes**:
  - Upgraded scoring algorithm in `ProductSelector.get_auto_candidates` (same category x3, same collection x2, shared option text words x1, price band ±40% x2, sibling category x1, ratings, popularity).
- **Frontend Impact**: Powers the `auto-fill` endpoint. No direct contract change, benefits `INT-001`.

### 8. `33a208b9a8781103a7d5a6d088d3269ad194733e`
- **Message**: `fix(collections): accept media-library URL or file upload for hero_banner`
- **Technical Changes**:
  - `HeroBannerField` in `CollectionCreateSerializer` and `CollectionUpdateSerializer` accepts image URL strings or file uploads.
- **Frontend Impact**: Frontend `adminApi.createCollection` and `updateCollection` already supply URL strings from the media uploader; now fully accepted without error.

### 9. `53220550b14c101e476ceb2faa61cea0754cb56a`
- **Message**: `fix(media): harden WebP pipeline, friendly errors, bound original sizes`
- **Technical Changes**:
  - WebP conversion pipeline downscales originals to 2048px, bounds images to 50MP, returns clean 400 errors (`Invalid image file`) instead of 500s.
- **Frontend Impact**: Frontend uploaders cleanly present 400 validation messages.

---

## C. Consolidated Impact Matrix

| ID | Commit(s) | Affected Feature | Frontend Location | Finding | Priority | Proposed Action |
|---|---|---|---|---|---|---|
| **INT-001** | `7307d5b`, `24a78dc` | Related Products Admin | `frontend/src/lib/admin-api.ts`, `frontend/src/components/admin/product-relations-manager.tsx` | Storefront no longer auto-fills silently. Admin modal lacked smart auto-fill button for `POST /api/admin/products/<id>/related/auto-fill/`. | **High** | Add `autoFillRelatedProducts` API method and interactive «تکمیل هوشمند پیشنهادها» button in `ProductRelationsManager`. |
| **INT-002** | `d861285` | Inventory Quantity Management | `frontend/src/lib/admin-api.ts`, `frontend/src/app/admin/inventory/page.tsx` | Backend supports absolute stock setting (`POST .../set-quantity/`), but frontend only supports delta math (`+` / `-`). | **Medium** | Add `setStockQuantity` API method and a 3rd mode («تنظیم موجودی دقیق») in custom stock dialog. |
| **INT-003** | `e2d51cb`, `372755b` | Variant Free-form Options | `frontend/src/app/admin/products/page.tsx`, `frontend/src/components/products/product-detail-client.tsx` | Variants allow partial options; storefront resolution needed ranking by specificity. | **High** | Already implemented in `f291d17`. Verified compatible. |
| **INT-004** | `d861285` | In-Place Variant Editing | `frontend/src/app/admin/products/page.tsx` | Backend supports `PATCH /api/admin/variants/{id}/`. | **High** | Already implemented in `db7e5ee`. Verified compatible. |
| **INT-005** | `33a208b` | Collection Hero Banner | `frontend/src/app/admin/collections/page.tsx` | Backend accepts URL strings in `HeroBannerField`. | **Low** | Verified fully working. No action needed. |
| **INT-006** | `5322055` | Media Upload Hardening | `frontend/src/components/admin/media-uploader.tsx` | Backend maps invalid images to 400 errors. | **Low** | Verified handled via `getApiErrorMessage`. No action needed. |

---

## D. Detailed Issue Register

### Issue INT-001: Missing Admin Trigger for Related Products Auto-Fill
- **Classification**: Missing Feature
- **Severity**: High
- **Evidence**: `backend/products/views.py:455-502` defines `POST /api/admin/products/<id>/related/auto-fill/ {?limit=8}`. `frontend/src/components/admin/product-relations-manager.tsx:338` still states that system backfills automatically, but the backend stopped doing so in commit `7307d5b`.
- **Current Behavior**: If an admin leaves related products empty or pins fewer than 8 items, the storefront related products slider displays only those few items (or nothing). The admin has no one-click way to populate smart recommendations.
- **Expected Behavior**: Admin can click an auto-fill button in `ProductRelationsManager` to instantly populate empty slots up to 8 items using fashion-aware system scoring.
- **Solution**:
  1. Add `autoFillRelatedProducts(productId: string, limit?: number)` in `frontend/src/lib/admin-api.ts`.
  2. Add an auto-fill action button with `Sparkles` icon in `ProductRelationsManager`.
  3. Update guidance copy to accurately reflect manual + auto-fill behavior.

### Issue INT-002: Missing Absolute Inventory Setter in Admin Inventory
- **Classification**: Missing Feature
- **Severity**: Medium
- **Evidence**: `backend/inventory/views.py:50-71` exposes `POST /api/admin/inventory/<variant_id>/set-quantity/` with payload `{"quantity": int}`. `frontend/src/app/admin/inventory/page.tsx` only offers `customStockMode: "add" | "subtract"`.
- **Current Behavior**: Admin must calculate difference manually if they wish to set stock to an exact number (e.g. physical count = 12).
- **Expected Behavior**: Admin can select "تنظیم موجودی دقیق" (=), type `12`, and the backend sets available quantity to 12.
- **Solution**:
  1. Add `setStockQuantity(variantOrProdId: string, quantity: number)` in `frontend/src/lib/admin-api.ts`.
  2. Add a third mode (`set`) to `customStockMode` with an Equal/Target icon.
  3. When `mode === "set"`, call `adminApi.setStockQuantity`.

---

## E. Proposed Implementation Plan

1. **Step 1: API Client Extensions (`frontend/src/lib/admin-api.ts`)**:
   - Add `autoFillRelatedProducts(productId: string, limit?: number)`.
   - Add `setStockQuantity(variantOrProdId: string, quantity: number)`.
2. **Step 2: Related Products Manager Enhancement (`frontend/src/components/admin/product-relations-manager.tsx`)**:
   - Add `handleAutoFill` function calling `adminApi.autoFillRelatedProducts`.
   - Render an auto-fill button in the Suggested tab header.
   - Update explanation note.
3. **Step 3: Inventory Page Absolute Stock Setting (`frontend/src/app/admin/inventory/page.tsx`)**:
   - Update `customStockMode` to `"add" | "subtract" | "set"`.
   - Add 3-column mode toggle.
   - Call `adminApi.setStockQuantity` when mode is `"set"`.
4. **Step 4: Local Verification**:
   - Run `npm run build` in `frontend/` to ensure zero compilation or type errors.
5. **Step 5: Git Commit & Production Deployment**:
   - Commit atomically and push to `origin/main`.

---

## F. Acceptance Criteria
- [x] `adminApi.autoFillRelatedProducts` and `adminApi.setStockQuantity` exported and strongly typed.
- [x] Related products modal allows one-click auto-fill and reloads items without page refresh.
- [x] Inventory custom stock modal supports setting absolute stock count.
- [x] Frontend compiles cleanly with `npm run build`.
- [x] Zero backend code modifications.

---

## G. Final Implementation & Verification Results

### Implementation Status
- **INT-001**: `RESOLVED`
  - Files modified: `frontend/src/lib/admin-api.ts`, `frontend/src/components/admin/product-relations-manager.tsx`
  - Summary: Integrated `POST /api/admin/products/<id>/related/auto-fill/` into admin client and added an interactive «تکمیل هوشمند پیشنهادها» button in `ProductRelationsManager` with loading feedback and automated list refresh.
- **INT-002**: `RESOLVED`
  - Files modified: `frontend/src/lib/admin-api.ts`, `frontend/src/app/admin/inventory/page.tsx`
  - Summary: Integrated `POST /api/admin/inventory/<variant_id>/set-quantity/` into admin client and added 3-way mode switching (افزایش `+`, کاهش `-`, مقدار قطعی `=`) in custom stock modal.
- **INT-003, INT-004, INT-005, INT-006**: `VERIFIED & RESOLVED`
  - Summary: Previous PRs and existing architecture already fully support free-form options, variant editing, hero banner strings, and 400 error handling.

### Verification Evidence
- **TypeScript & Next.js Build**:
  - Command: `npm run build`
  - Exit code: `0`
  - Output: `Compiled successfully in 3.6s`, `Finished TypeScript in 4.3s`, `Generating static pages (25/25) in 403ms`.
  - Zero lint/type errors across entire Next.js application.

---

## H. Explicit Non-Goals
- **Backend Modifications**: Strictly zero edits to `backend/` Python, Django models, views, or database migrations. All backend contracts and behaviors were audited as the source of truth.
- **Unrelated Visual Redesigns**: No cosmetic overhaul or gratuitous UI changes beyond integrating the two missing controls (`INT-001` auto-fill button and `INT-002` absolute stock setting mode).
- **Dependency Upgrades**: Preserved existing package manifests (`package.json`) without adding third-party dependencies.
- **Breaking API Changes**: Preserved all existing API routes, contracts, and interfaces for full backward compatibility.


