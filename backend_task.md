# Backend Tasks — Frontend/Backend Synchronization

## Overview
This document outlines verified backend gaps, missing API endpoints, and proposed contract improvements identified during the comprehensive frontend-to-backend synchronization audit for the MAVi Fashion Store project. The frontend has been brought into full alignment with the authoritative backend implementation (`backend/`), and the tasks below represent server-side enhancements that will expand application capabilities without breaking existing contracts.

## Priority Definitions
- **P0 — Critical:** Security, authentication, authorization, or major blockers preventing essential application functionality.
- **P1 — High:** Important missing capabilities that prevent major user or administrative workflows from working.
- **P2 — Medium:** Missing functionality affecting secondary workflows or important edge cases.
- **P3 — Low:** Minor improvements, contract clarifications, or nonessential enhancements.

---

## Tasks

### [BACKEND-001] User Address Book Persistence API

- **Priority:** P1
- **Affected feature:** Customer Profile (`/profile` Addresses tab) and Checkout Delivery Address Selection (`/checkout`).
- **Current backend behavior:** The backend stores shipping and billing addresses only as static JSON payloads inside individual `Order` records (`backend/orders/models.py`). There is no user-level address book model or REST endpoint under `/api/users/` to store, list, update, or delete addresses for authenticated customers.
- **Current frontend expectation:** The customer profile provides a full address management interface where users can add multiple delivery addresses, edit existing ones, assign labels (home, work), and choose them during checkout. Because the backend does not provide an address book API, the frontend currently falls back to `localStorage` keyed by `user_addresses_<userId>`.
- **Gap:** Saved addresses are device-local and do not sync across multiple devices or user sessions.
- **Required backend change:**
  1. Create a `UserAddress` model in `backend/users/models.py` with fields: `id` (UUID), `user` (ForeignKey), `title` (CharField), `full_name` (CharField), `phone` (CharField with PhoneValidator), `province` (CharField), `city` (CharField), `address` (TextField), `postal_code` (CharField 10 digits), `is_default` (BooleanField), `created_at`, `updated_at`.
  2. Implement `UserAddressViewSet` in `backend/users/views.py` registered at `/api/users/addresses/`.
- **Expected API contract:**
  - `GET /api/users/addresses/` -> Returns array of user's addresses: `[{ "id": "...", "title": "خانه", "full_name": "...", "phone": "09...", "province": "...", "city": "...", "address": "...", "postal_code": "...", "is_default": true }]`
  - `POST /api/users/addresses/` -> Creates new address for `request.user`.
  - `PATCH /api/users/addresses/<uuid:pk>/` -> Partial update of address fields.
  - `DELETE /api/users/addresses/<uuid:pk>/` -> Deletes user address.
- **Acceptance criteria:** Authenticated users can persist, list, update, and remove delivery addresses from any device via `/api/users/addresses/`.
- **Dependencies:** None.
- **Frontend status:** Frontend address management is fully functional using client-side fallback; will immediately bind to this endpoint once available.

---

### [BACKEND-002] Customer Order Self-Cancellation for Pending Orders

- **Priority:** P2
- **Affected feature:** Customer Profile Order History (`/profile` Orders tab).
- **Current backend behavior:** Order status transitions are only exposed through `AdminOrderViewSet.transition` at `POST /api/admin/orders/<id>/transition/` (`backend/orders/views.py`), which is protected by `IsAdminUser`. The customer-facing `UserOrderViewSet` (`backend/orders/views.py`) supports `list`, `retrieve`, and `checkout`, but lacks an action for customers to cancel their own pending orders.
- **Current frontend expectation:** When an order is in `pending` or `awaiting_payment` status and has not yet been paid or packed, customers should be able to cancel the order without having to contact customer support.
- **Gap:** Customers cannot self-cancel pending orders.
- **Required backend change:**
  1. Add a `@action(detail=True, methods=["post"], url_path="cancel")` to `UserOrderViewSet` in `backend/orders/views.py`.
  2. In `OrderService`, implement `customer_cancel_order(order, user)` that ensures `order.user == user` and `order.status in [Order.Status.PENDING, Order.Status.AWAITING_PAYMENT]`.
  3. Release any inventory stock reservations if held, and transition order status to `Order.Status.CANCELLED`.
- **Expected API contract:**
  - `POST /api/orders/<order_number>/cancel/` -> Returns `{ "message": "سفارش با موفقیت لغو شد.", "status": "cancelled" }` with HTTP 200.
  - Returns HTTP 400 with `{ "detail": "این سفارش در این مرحله قابل لغو نیست." }` if order is already paid, packing, or shipped.
- **Acceptance criteria:** Regular customers can cancel their own orders if unpaid; unauthorized users or attempts to cancel fulfilled orders are rejected.
- **Dependencies:** None.
- **Frontend status:** Frontend currently displays status badges; a "لغو سفارش" button will be activated once this endpoint is available.

---

### [BACKEND-003] Standardized Payment Status Query & Verification Endpoint

- **Priority:** P2
- **Affected feature:** Checkout Payment Callback (`/checkout/callback` and `/checkout/success`).
- **Current backend behavior:** The backend provides `POST /api/payments/initiate/` and handles webhooks at `POST /api/callbacks/<gateway>/` (`backend/payments/views.py`).
- **Current frontend expectation:** When external payment gateways (e.g. ZarinPal, Shaparak) redirect the user back to the frontend with URL parameters (e.g., `?Authority=...&Status=OK`), the client needs to query the verification state of the order payment.
- **Gap:** Lack of a dedicated `GET /api/payments/verify/` query endpoint for client-side callback verification.
- **Required backend change:**
  1. Add `@action(detail=False, methods=['get', 'post'], url_path='verify')` to `PaymentViewSet` in `backend/payments/views.py`.
  2. Implement verification inquiry in `PaymentService` that checks payment status and returns the gateway reference code and updated order status.
- **Expected API contract:**
  - `GET /api/payments/verify/?authority=<authority>&order_id=<order_id>` -> Returns `{ "status": "paid", "order_number": "...", "gateway_reference": "..." }`
- **Acceptance criteria:** Client can reliably verify payment result on the return page without exposing sensitive gateway credentials.
- **Dependencies:** None.
- **Frontend status:** Synchronous payments and direct checkout completion work; client-side callback page will bind directly to this endpoint.

---

### [BACKEND-004] Email-Based Authentication Option for Staff / Administrators

- **Priority:** P3
- **Affected feature:** Admin Login Gate (`/admin`).
- **Current backend behavior:** The user model `User` uses `phone_number` as the primary identifier (`USERNAME_FIELD = "phone_number"`). `LoginSerializer` in `backend/authentication/serializers.py` strictly requires and validates `phone_number` via `PhoneValidator` (`09\d{9}`).
- **Current frontend expectation:** Frontend admin panel gate was originally written with email and password fields. It has now been updated to use the backend's required Iranian phone number format with password or SMS OTP.
- **Gap:** If administrative staff prefer logging into the backoffice using their corporate email address rather than mobile phone, the backend currently does not support email authentication.
- **Required backend change:**
  1. Add an optional `email` field to the user model or serializer authentication lookup.
  2. Allow `LoginSerializer` to accept either an Iranian phone number or email address, resolving the corresponding user record before verifying password.
- **Expected API contract:**
  - `POST /api/auth/login/` accepting `{ "phone_number": "0912..." }` OR `{ "email": "admin@example.com" }` with `"password"`.
- **Acceptance criteria:** Admin users can authenticate with either mobile phone or email without breaking existing mobile-based authentication.
- **Dependencies:** None.
- **Frontend status:** Frontend admin gate has been fully synchronized to use `phone_number` with password and SMS OTP.

---

## Unresolved Contract Questions

1. **Guest Cart Expiration & Cleanup:**
   - Guest carts are tracked via `session_key` header `X-Cart-Session-Key`. What is the retention policy and expiration window for abandoned guest carts in Redis / database?
2. **Product Weight Units:**
   - Product `weight` field defaults to `1` in serializers. Is the canonical unit grams (g) or kilograms (kg)? (Frontend postal calculation currently assumes grams with postal factor `1.6`).

---

## Verification Checklist

The backend developer should verify the following after implementing the tasks above:

- [ ] Run `python manage.py test` to ensure all existing test suites pass.
- [ ] Verify `POST /api/users/addresses/` validates Iranian 10-digit postal codes and phone numbers.
- [ ] Verify `POST /api/orders/<order_number>/cancel/` releases any inventory locks and restricts action strictly to order owner.
- [ ] Test `POST /api/auth/login/` backward compatibility with both phone number and email if implemented.
- [ ] Verify simple JWT token payloads continue to include `is_staff`, `is_superuser`, and `phone_number`.
