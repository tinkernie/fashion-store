# Backend Task Report — 2026-10-13

## 1. Report Metadata
- **Date**: 2026-10-13
- **Related Backend Commit SHAs**:
  - `5653fd77dafbac3e4033a321efdb6ce6dae331e1` (`fix(auth): keep current session alive on password change/logout others`)
  - `9d2968a8061033a1065f73ffc364bd57f6136070` (`feat(auth): password-confirm support and working register endpoint`)
  - `f6a67d04f0ed58b29d0a1b34ad10627467521e7d` (`feat(auth): OTP-first signup ticket flow, safer reset verify, aligned password floor`)
- **Summary**: Comprehensive synchronization audit following the migration from email-based authentication to mobile phone + OTP authentication and OTP-first ticketed registration. Core runtime authentication APIs are verified, functional, and fully synchronized with the frontend. However, the legacy backend test suite suffers from severe bit-rot and broken imports that block test collection.
- **Overall Status**: Active
- **Priority**: High (Test Infrastructure & Regression Prevention)

---

## 2. Executive Summary
During backend commit analysis and frontend synchronization for the three authentication commits (`5653fd7`, `9d2968a`, `f6a67d0`), all runtime API contracts were confirmed operational and synchronized:
- `POST /api/auth/otp/request/` (purposes: `login`, `reset`, `signup`)
- `POST /api/auth/otp/verify/` (ticketed verification for `signup` returning `signup_token`)
- `POST /api/auth/signup/complete/` (account creation consuming `signup_token` with `password_confirm`)
- `POST /api/auth/login/` (returning user mobile + password login)
- `POST /api/auth/password-reset-otp/` (OTP-based password reset supporting `new_password_confirm`)
- `POST /api/auth/change-password/` (single-session preservation via `sid` claim with `new_password_confirm`)

However, running backend test verification (`pytest`) revealed that the backend test suite contains broken legacy imports and obsolete endpoints from the pre-OTP era. Specifically, `backend/tests/test_e2e_journeys.py` attempts to import the deleted `EmailVerificationToken` model, `backend/tests/test_api.py` requests unmounted `/api/v1/auth/` routes, and `backend/tests/test_validators.py` expects commented-out regex password validations. This prevents automated regression testing of the backend.

In accordance with Section 3 ("STRICT BACKEND RESTRICTION — FRONTEND-ONLY RESPONSIBILITY"), these backend tasks are documented here for the backend engineer.

---

## 3. Current Backend Behavior
- **Authentication Handlers & Models**:
  - Located in `backend/authentication/services.py`, `backend/authentication/views.py`, `backend/authentication/serializers.py`, `backend/authentication/models.py`.
  - All runtime code operates cleanly and correctly under Django 4.2+ and DRF.
- **Test Suite Files**:
  - `backend/tests/test_e2e_journeys.py:L26`: Imports `from authentication.models import EmailVerificationToken`, raising `ImportError: cannot import name 'EmailVerificationToken' from 'authentication.models'` during test collection.
  - `backend/tests/test_api.py:L27`: Executes requests to `/api/v1/auth/login/` and `/api/v1/auth/register/` (routes are mounted at `/api/auth/login/` and `/api/auth/signup/complete/`).
  - `backend/tests/test_validators.py:L15-L23`: Tests `test_missing_uppercase` and `test_missing_digit` by expecting `ValidationError`. In `backend/authentication/validators.py:L23-L36`, the regex checks for uppercase and digit characters are commented out to match the frontend 8-character floor, causing these tests to fail.

---

## 4. Frontend Expectations
- The frontend operates strictly against the confirmed and active endpoints:
  - Phone + OTP request: `/api/auth/otp/request/`
  - Phone + OTP verify: `/api/auth/otp/verify/`
  - Complete registration: `/api/auth/signup/complete/`
  - Returning user login: `/api/auth/login/`
  - OTP password reset: `/api/auth/password-reset-otp/`
  - Password change: `/api/auth/change-password/`
- The frontend expects CI/CD and backend regression suites to pass so that future backend refactors do not unintentionally break the OTP signup or session preservation contracts.

---

## 5. Detailed Backend Tasks

### Task BET-2026-10-13-01: Modernize E2E Journeys Test Suite for Phone/OTP Authentication
- **Task ID**: `BET-2026-10-13-01`
- **Title**: Update `backend/tests/test_e2e_journeys.py` to remove `EmailVerificationToken` and reflect OTP-first signup
- **Priority**: High
- **Related Commit SHAs**: `eb0ce70`, `f6a67d04f0ed58b29d0a1b34ad10627467521e7d`
- **Affected Backend Components**: `backend/tests/test_e2e_journeys.py`
- **Current Behavior**: `test_e2e_journeys.py` crashes on collection with `ImportError: cannot import name 'EmailVerificationToken'`.
- **Problem**: Model was removed when migrating from email tokens to `OtpCode` and `_make_signup_token`.
- **Required Backend Changes**:
  1. Remove `from authentication.models import EmailVerificationToken` from line 26 of `backend/tests/test_e2e_journeys.py`.
  2. Update `test_signup_creates_inactive_user_and_queues_verification` and `test_email_verification_is_single_use` to test the active OTP signup flow:
     - `POST /api/auth/otp/request/` with `{ phone_number, purpose: "signup" }`
     - `POST /api/auth/otp/verify/` with `{ phone_number, code, purpose: "signup" }` (returns `signup_token`)
     - `POST /api/auth/signup/complete/` with `{ phone_number, signup_token, first_name, last_name, password, password_confirm }` (returns 201 + tokens).
- **Expected API Contract**: `POST /api/auth/signup/complete/` returns HTTP 201 Created with `{ access, refresh, user, message }`.
- **Acceptance Criteria**: `pytest backend/tests/test_e2e_journeys.py` collects successfully and passes without `ImportError`.

---

### Task BET-2026-10-13-02: Fix Obsolete API Test Routes in `backend/tests/test_api.py`
- **Task ID**: `BET-2026-10-13-02`
- **Title**: Update `backend/tests/test_api.py` auth route paths and test payloads
- **Priority**: Medium
- **Related Commit SHAs**: `9d2968a8061033a1065f73ffc364bd57f6136070`, `f6a67d04f0ed58b29d0a1b34ad10627467521e7d`
- **Affected Backend Components**: `backend/tests/test_api.py`
- **Current Behavior**: Tests use `/api/v1/auth/login/` with `{ email, password }` and `/api/v1/auth/register/`, which return 404/500 Resolver404.
- **Problem**: API URL prefix is `/api/auth/` (no `v1/`), and user credentials require `phone_number` instead of `email`.
- **Required Backend Changes**:
  1. Change endpoint paths from `/api/v1/auth/...` to `/api/auth/...`.
  2. Use `phone_number` in `TestAuthEndpoints.test_login` and test `POST /api/auth/login/`.
  3. Update `test_register` to test `POST /api/auth/register/` (or `POST /api/auth/signup/complete/`).
- **Acceptance Criteria**: `pytest backend/tests/test_api.py` passes cleanly.

---

### Task BET-2026-10-13-03: Align `test_validators.py` with Relaxed Password Complexity Rules
- **Task ID**: `BET-2026-10-13-03`
- **Title**: Update unit tests in `backend/tests/test_validators.py` to match `PasswordValidator.MIN_LENGTH = 8`
- **Priority**: Low
- **Related Commit SHAs**: `f6a67d04f0ed58b29d0a1b34ad10627467521e7d`
- **Affected Backend Components**: `backend/tests/test_validators.py`
- **Current Behavior**: `test_missing_uppercase` and `test_missing_digit` fail because `PasswordValidator.validate` only checks length (`MIN_LENGTH = 8`, `MAX_LENGTH = 128`), with uppercase and digit checks commented out.
- **Problem**: Tests test rules that were intentionally disabled to improve user conversion and align with frontend validation.
- **Required Backend Changes**:
  1. Remove or update `test_missing_uppercase` and `test_missing_digit` in `backend/tests/test_validators.py` to assert that 8+ character passwords without uppercase or digits are accepted, OR restore active validation if uppercase/digit rules are strictly required by business policy.
- **Acceptance Criteria**: `pytest backend/tests/test_validators.py` passes 4/4 tests.

---

## 6. Recommended Implementation Order
1. **BET-2026-10-13-01**: Fix `test_e2e_journeys.py` collection error first so the primary integration test suite can run.
2. **BET-2026-10-13-02**: Fix `test_api.py` URL prefixes and payload shapes.
3. **BET-2026-10-13-03**: Align `test_validators.py` assertions with active validator logic.

---

## 7. Frontend Impact and Follow-Up
- **Active Frontend Implementation**:
  - The frontend has already implemented full support for the OTP-first ticketed signup flow (`/api/auth/otp/request/` -> `/api/auth/otp/verify/` -> `/api/auth/signup/complete/`), returning user password login (`/api/auth/login/`), and OTP password reset (`/api/auth/password-reset-otp/`).
  - Added Persian error message mappings for `phone_exists`, `invalid_token`, and validation errors.
  - Added `new_password_confirm` to profile and reset-password forms matching serializer support.
- **Follow-up**: After the backend engineer resolves `BET-2026-10-13-01` through `BET-2026-10-13-03`, run full pytest suite to verify all backend test journeys pass.

---

## 8. Completion Checklist
- [ ] Resolve `EmailVerificationToken` import error in `backend/tests/test_e2e_journeys.py` (`BET-2026-10-13-01`).
- [ ] Migrate `test_e2e_journeys.py` authentication tests to phone + OTP flow (`BET-2026-10-13-01`).
- [ ] Correct API endpoint routes and credentials in `backend/tests/test_api.py` (`BET-2026-10-13-02`).
- [ ] Align `backend/tests/test_validators.py` assertions with active password rules (`BET-2026-10-13-03`).
- [ ] Verify `pytest` runs and passes across all backend test modules.

---

## 9. Outstanding Questions
- None. Runtime API contracts and serializers are verified and operational.
