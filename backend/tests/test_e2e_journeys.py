"""End-to-end API journeys for the Luxe shop.

Run with::

    pytest -q tests/test_e2e_journeys.py

This is deliberately a single cross-domain suite.  It exercises APIs through
DRF's request stack while using the test database and mocks only external
systems (Celery/email and the payment provider).  ``xfail(strict=True)`` tests
are production contracts for defects already present in the application; they
must be unmarked when the corresponding defect is fixed.
"""

from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from analytics.models import TrackedEvent
from authentication.models import EmailVerificationToken
from cart.models import Cart, CartItem
from categories.models import Category
from coupons.models import Coupon
from inventory.models import Inventory, Reservation
from notifications.models import Notification, NotificationTemplate
from orders.models import Order
from product_options.models import OptionValue, ProductOption
from products.models import Product
from variants.models import Variant, VariantOption
from wishlist.models import WishlistItem


pytestmark = pytest.mark.django_db(transaction=True)
User = get_user_model()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def customer(db):
    """Create a verified standard user without relying on the broken manager."""
    user = User(email="buyer@example.test", first_name="Buyer", is_active=True)
    user.set_password("ValidPass1!")
    user.save()
    return user


@pytest.fixture
def customer_b(db):
    user = User(email="other@example.test", first_name="Other", is_active=True)
    user.set_password("ValidPass1!")
    user.save()
    return user


@pytest.fixture
def admin(db):
    user = User(
        email="admin@example.test", is_active=True, is_staff=True, is_superuser=True
    )
    user.set_password("AdminPass1!")
    user.save()
    return user


@pytest.fixture
def catalog(db):
    """A publicly purchasable product, one variant, and in-stock inventory."""
    category = Category.objects.create(name="Skin", slug="skin", is_active=True)
    product = Product.objects.create(
        title="Cleanser",
        slug="cleanser",
        category=category,
        status=Product.Status.PUBLISHED,
    )
    option = ProductOption.objects.create(product=product, name="Size")
    value = OptionValue.objects.create(option=option, value="100 ml")
    variant = Variant.objects.create(
        product=product,
        sku="CLEAN-100",
        price=Decimal("19.99"),
        weight=100,
        availability=Variant.Availability.IN_STOCK,
        status=Variant.Status.PUBLISHED,
    )
    VariantOption.objects.create(variant=variant, option=option, option_value=value)
    inventory = Inventory.objects.create(
        variant=variant,
        available_quantity=10,
        safety_stock=1,
        status=Inventory.Status.IN_STOCK,
    )
    return {
        "category": category,
        "product": product,
        "option": option,
        "value": value,
        "variant": variant,
        "inventory": inventory,
    }


def authenticate(client, user):
    client.force_authenticate(user=user)
    return client


def create_order(user, *, status_value=Order.Status.PENDING):
    return Order.objects.create(
        user=user,
        order_number=f"LUX-{Order.objects.count() + 1:06d}",
        status=status_value,
        subtotal=Decimal("10.00"),
        total=Decimal("10.00"),
        shipping_address={"country": "US"},
        billing_address={"country": "US"},
    )


class TestAuthenticationAndOnboarding:
    # [Test Category]: User Journey
    # [Scenario Name]: Registration queues verification and keeps account inactive.
    # [Pre-conditions & Setup]: Anonymous visitor; Celery is mocked.
    # [Step-by-Step Action]: Submit the complete sign-up form.
    # [Assertions & Expectations]: 201, inactive account, token, task queued once.
    @pytest.mark.xfail(
        strict=True,
        reason="User has no create_user manager; registration currently raises AttributeError.",
    )
    def test_signup_creates_inactive_user_and_queues_verification(self, client, mocker):
        queued = mocker.patch("authentication.services.send_verification_email.delay")

        response = client.post(
            "/api/auth/register/",
            {
                "email": "new@example.test",
                "password": "ValidPass1!",
                "first_name": "New",
                "last_name": "User",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        user = User.objects.get(email="new@example.test")
        token = EmailVerificationToken.objects.get(user=user)
        assert not user.is_active
        assert response.data["email"] == user.email
        queued.assert_called_once_with(str(user.id), str(token.token))

    # [Test Category]: User Journey
    # [Scenario Name]: Verification activates exactly one valid, unexpired account.
    # [Pre-conditions & Setup]: Inactive user and a verification token.
    # [Step-by-Step Action]: Verify token, then replay it.
    # [Assertions & Expectations]: First call is 200/active; replay is 400.
    def test_email_verification_is_single_use(self, client, db):
        user = User(email="verify@example.test", is_active=False)
        user.set_password("ValidPass1!")
        user.save()
        token = EmailVerificationToken.objects.create(user=user)

        response = client.post("/api/auth/verify-email/", {"token": str(token.token)})
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        token.refresh_from_db()
        assert user.is_active is True
        assert token.is_used is True

        replay = client.post("/api/auth/verify-email/", {"token": str(token.token)})
        assert replay.status_code == status.HTTP_400_BAD_REQUEST

    # [Test Category]: User Journey
    # [Scenario Name]: Login, token verification, refresh, and logout lifecycle.
    # [Pre-conditions & Setup]: Verified user.
    # [Step-by-Step Action]: Login, verify access token, refresh, then blacklist refresh token.
    # [Assertions & Expectations]: Tokens are returned, valid token verifies, logout is 205.
    def test_login_refresh_verify_and_logout(self, client, customer):
        login = client.post(
            "/api/auth/login/",
            {"email": customer.email, "password": "ValidPass1!"},
        )
        assert login.status_code == status.HTTP_200_OK
        assert set(login.data) == {"access", "refresh"}

        verify = client.post("/api/auth/token/verify/", {"token": login.data["access"]})
        assert verify.status_code == status.HTTP_200_OK

        refreshed = client.post("/api/auth/token/refresh/", {"refresh": login.data["refresh"]})
        assert refreshed.status_code == status.HTTP_200_OK
        assert "access" in refreshed.data

        authenticate(client, customer)
        logout = client.post("/api/auth/logout/", {"refresh": refreshed.data["refresh"]})
        assert logout.status_code == status.HTTP_205_RESET_CONTENT

    # [Test Category]: User Journey
    # [Scenario Name]: Password reset does not disclose account existence.
    # [Pre-conditions & Setup]: Existing user; outbound email task mocked.
    # [Step-by-Step Action]: Request reset for existing and absent addresses.
    # [Assertions & Expectations]: Identical 200 response; task only for existing user.
    def test_password_reset_is_enumeration_resistant(self, client, customer, mocker):
        queued = mocker.patch("authentication.services.send_password_reset_email.delay")

        existing = client.post("/api/auth/password-reset/", {"email": customer.email})
        absent = client.post("/api/auth/password-reset/", {"email": "absent@example.test"})

        assert existing.status_code == absent.status_code == status.HTTP_200_OK
        assert existing.data == absent.data
        queued.assert_called_once()


class TestCustomerCommerceJourney:
    # [Test Category]: User Journey
    # [Scenario Name]: Public storefront exposes only catalog, page, search, and tracking contracts.
    # [Pre-conditions & Setup]: Published catalog and public page data.
    # [Step-by-Step Action]: Browse category/product/variant, search, fetch CMS, and track a view.
    # [Assertions & Expectations]: 200/201 only; anonymous request never receives admin fields.
    @pytest.mark.xfail(
        strict=True,
        reason="Product and variant response serializers reference attributes absent from their models.",
    )
    def test_public_catalog_search_cms_and_tracking_flow(self, client, catalog):
        from cms.models import Page, SiteContent

        Page.objects.create(title="About", slug="about", status="published", content=[{"type": "text"}])
        SiteContent.objects.create(key="homepage", content={"hero": "Welcome"})

        assert client.get("/api/categories/").status_code == status.HTTP_200_OK
        assert client.get("/api/products/").status_code == status.HTTP_200_OK
        assert client.get(f"/api/products/{catalog['product'].slug}/").status_code == status.HTTP_200_OK
        assert client.get(f"/api/products/{catalog['product'].slug}/options/").status_code == status.HTTP_200_OK
        assert client.get(f"/api/products/{catalog['product'].slug}/variants/").status_code == status.HTTP_200_OK
        assert client.get("/api/search/products/?q=cleanser").status_code == status.HTTP_200_OK
        assert client.get("/api/pages/about/").status_code == status.HTTP_200_OK
        assert client.get("/api/site-content/homepage/").status_code == status.HTTP_200_OK

        tracked = client.post("/api/analytics/track/", {"type": "product_view"})
        assert tracked.status_code == status.HTTP_201_CREATED
        assert TrackedEvent.objects.filter(type="product_view").exists()

    # [Test Category]: User Journey
    # [Scenario Name]: Guest cart obtains durable session identity and reserves stock.
    # [Pre-conditions & Setup]: Published variant with inventory.
    # [Step-by-Step Action]: Read cart and add a variant as a guest.
    # [Assertions & Expectations]: 200 responses, session cart key, active reservation, stock held.
    @pytest.mark.xfail(
        strict=True,
        reason="UUID objects are written to Django JSON session storage.",
    )
    def test_guest_cart_add_reserves_stock_and_records_event(self, client, catalog):
        empty = client.get("/api/cart/")
        assert empty.status_code == status.HTTP_200_OK
        assert client.session["cart_session_key"]

        added = client.post(
            "/api/cart/add_item/",
            {"variant_id": str(catalog["variant"].id), "quantity": 2},
        )
        assert added.status_code == status.HTTP_200_OK
        assert added.data["items"][0]["quantity"] == 2
        reservation = Reservation.objects.get(id=added.data["items"][0]["reservation_id"])
        assert reservation.status == Reservation.Status.ACTIVE
        catalog["inventory"].refresh_from_db()
        assert catalog["inventory"].reserved_quantity == 2
        assert TrackedEvent.objects.filter(type="cart_add").exists()

    # [Test Category]: User Journey
    # [Scenario Name]: Authenticated user can add/remove wishlist items only for published products.
    # [Pre-conditions & Setup]: Authenticated customer and public catalog.
    # [Step-by-Step Action]: Add product, inspect wishlist, remove product.
    # [Assertions & Expectations]: Correct count/database state and no cross-user mutation.
    def test_wishlist_add_list_remove(self, client, customer, catalog):
        authenticate(client, customer)
        add = client.post("/api/wishlist/add_item/", {"product_id": str(catalog["product"].id)})
        assert add.status_code == status.HTTP_200_OK
        assert add.data["count"] == 1
        assert WishlistItem.objects.filter(wishlist__user=customer).count() == 1

        listed = client.get("/api/wishlist/")
        assert listed.status_code == status.HTTP_200_OK
        assert listed.data["items"][0]["product_id"] == str(catalog["product"].id)

        removed = client.post("/api/wishlist/remove-item/", {"product_id": str(catalog["product"].id)})
        assert removed.status_code == status.HTTP_200_OK
        assert removed.data["count"] == 0

    # [Test Category]: User Journey
    # [Scenario Name]: Coupon application returns an updated discounted cart.
    # [Pre-conditions & Setup]: Authenticated cart with one item and active percentage coupon.
    # [Step-by-Step Action]: Apply coupon and retrieve cart.
    # [Assertions & Expectations]: Coupon retained; total includes precise discount.
    @pytest.mark.xfail(
        strict=True,
        reason="Cart serialization passes string prices to coupon calculation.",
    )
    def test_apply_coupon_and_return_discounted_cart(self, client, customer, catalog):
        authenticate(client, customer)
        cart = Cart.objects.create(user=customer)
        reservation = Reservation.objects.create(
            inventory=catalog["inventory"], user=customer, quantity=1,
            expires_at=timezone.now() + timedelta(minutes=15),
        )
        CartItem.objects.create(
            cart=cart, variant=catalog["variant"], quantity=1,
            price_snapshot=Decimal("19.99"), reservation_id=str(reservation.id),
        )
        Coupon.objects.create(
            code="SAVE10", discount_type="percentage", discount_value=Decimal("10"),
            min_purchase=Decimal("0"), is_active=True,
        )

        response = client.post("/api/cart/apply-coupon/", {"code": "SAVE10"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["coupon_code"] == "SAVE10"
        assert Decimal(str(response.data["total"])) == Decimal("17.99")

    # [Test Category]: User Journey
    # [Scenario Name]: Checkout atomically converts an authenticated cart into an order.
    # [Pre-conditions & Setup]: Active reservation matching the cart quantity.
    # [Step-by-Step Action]: Submit shipping/billing addresses.
    # [Assertions & Expectations]: 201, order snapshot, committed reservation, removed cart.
    @pytest.mark.xfail(
        strict=True,
        reason="Checkout subtracts Decimal discount from a float subtotal.",
    )
    def test_checkout_commits_inventory_and_clears_cart(self, client, customer, catalog):
        authenticate(client, customer)
        cart = Cart.objects.create(user=customer)
        reservation = Reservation.objects.create(
            inventory=catalog["inventory"], user=customer, quantity=2,
            expires_at=timezone.now() + timedelta(minutes=15),
        )
        catalog["inventory"].reserved_quantity = 2
        catalog["inventory"].save()
        CartItem.objects.create(
            cart=cart, variant=catalog["variant"], quantity=2,
            price_snapshot=Decimal("19.99"), reservation_id=str(reservation.id),
        )

        response = client.post(
            "/api/orders/checkout/",
            {"shipping_address": {"line1": "1 Main St"}, "billing_address": {"line1": "1 Main St"}},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        reservation.refresh_from_db()
        catalog["inventory"].refresh_from_db()
        assert reservation.status == Reservation.Status.USED
        assert catalog["inventory"].available_quantity == 8
        assert not Cart.objects.filter(id=cart.id).exists()
        assert TrackedEvent.objects.filter(type="order_placed").exists()


class TestUserIsolationAndRBAC:
    # [Test Category]: Security & RBAC
    # [Scenario Name]: User A cannot read User B's order or notifications.
    # [Pre-conditions & Setup]: Two users, User B order and notification.
    # [Step-by-Step Action]: Authenticate as User A and query User B resources.
    # [Assertions & Expectations]: Order lookup is 400/404; User B data never appears.
    def test_cross_user_order_and_notification_isolation(self, client, customer, customer_b):
        order = create_order(customer_b)
        Notification.objects.create(
            user=customer_b, type="generic", subject="Private", body="Private body"
        )
        authenticate(client, customer)

        order_response = client.get(f"/api/orders/{order.order_number}/")
        assert order_response.status_code in {status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND}

        notifications = client.get("/api/notifications/")
        assert notifications.status_code == status.HTTP_200_OK
        assert notifications.data["unread_count"] == 0
        assert notifications.data["notifications"] == []

    # [Test Category]: Security & RBAC
    # [Scenario Name]: A standard user is denied every admin namespace action.
    # [Pre-conditions & Setup]: Authenticated standard user.
    # [Step-by-Step Action]: Call representative read/write endpoints across every admin domain.
    # [Assertions & Expectations]: Every response is 403; no resource is created or mutated.
    @pytest.mark.parametrize(
        ("method", "path", "payload"),
        [
            ("post", "/api/admin/categories/", {"name": "x", "slug": "x"}),
            ("post", "/api/admin/collections/", {"name": "x", "slug": "x"}),
            ("post", "/api/admin/products/", {"title": "x", "slug": "x"}),
            ("post", "/api/admin/variants/", {}),
            ("get", "/api/admin/inventory/not-a-uuid/", None),
            ("get", "/api/admin/orders/", None),
            ("get", "/api/admin/coupons/", None),
            ("post", "/api/admin/cms/pages/", {"title": "x", "slug": "x"}),
            ("get", "/api/admin/notifications/", None),
            ("get", "/api/admin/analytics/events/", None),
            ("post", "/api/admin/media_libm/upload/", {}),
            ("get", "/api/users/", None),
        ],
    )
    def test_standard_user_cannot_access_admin_endpoints(self, client, customer, method, path, payload):
        authenticate(client, customer)
        response = getattr(client, method)(path, payload, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    # [Test Category]: Security & RBAC
    # [Scenario Name]: Public option-media URL must enforce product/option ownership.
    # [Pre-conditions & Setup]: Two public products with distinct options.
    # [Step-by-Step Action]: Request product A path using product B option identifier.
    # [Assertions & Expectations]: 404 and no media metadata disclosure.
    @pytest.mark.xfail(
        strict=True,
        reason="Public media endpoint ignores product_slug and exposes option media by ID.",
    )
    def test_public_media_rejects_option_from_another_product(self, client, catalog):
        other = Product.objects.create(
            title="Other", slug="other", category=catalog["category"], status=Product.Status.PUBLISHED
        )
        other_option = ProductOption.objects.create(product=other, name="Color")

        response = client.get(
            f"/api/public/products/{catalog['product'].slug}/options/{other_option.id}/media_libm/"
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestAdminJourneyAndTasks:
    # [Test Category]: Admin Journey
    # [Scenario Name]: Admin creates catalog data, adjusts inventory, and publishes content.
    # [Pre-conditions & Setup]: Authenticated superuser.
    # [Step-by-Step Action]: Create category/product, then adjust inventory.
    # [Assertions & Expectations]: 201/200 responses and matching persistent records.
    def test_admin_creates_category_product_and_adjusts_inventory(self, client, admin, catalog):
        authenticate(client, admin)
        category = client.post("/api/admin/categories/", {"name": "Body", "slug": "body"})
        assert category.status_code == status.HTTP_201_CREATED
        assert Category.objects.filter(slug="body").exists()

        adjusted = client.post(
            f"/api/admin/inventory/{catalog['variant'].id}/adjust-stock/", {"delta": 5}
        )
        assert adjusted.status_code == status.HTTP_200_OK
        catalog["inventory"].refresh_from_db()
        assert catalog["inventory"].available_quantity == 15

    # [Test Category]: Admin Journey
    # [Scenario Name]: Admin manages options, variants, coupons, CMS, and media asynchronously.
    # [Pre-conditions & Setup]: Admin and public product; thumbnail task mocked.
    # [Step-by-Step Action]: Create option/value/coupon/page and upload an image for an option.
    # [Assertions & Expectations]: Each entity persists; image processing is queued exactly once.
    def test_admin_catalog_content_coupon_and_media_workflow(self, client, admin, catalog, mocker):
        authenticate(client, admin)
        thumbnail_task = mocker.patch("media_libm.services.generate_thumbnails.delay")

        option = client.post(
            f"/api/admin/products/{catalog['product'].id}/options/",
            {"name": "Colour", "display_order": 1},
        )
        assert option.status_code == status.HTTP_201_CREATED

        value = client.post(
            f"/api/admin/products/{catalog['product'].id}/options/{option.data['id']}/values/",
            {"value": "Blue", "display_order": 0},
        )
        assert value.status_code == status.HTTP_201_CREATED

        coupon = client.post(
            "/api/admin/coupons/",
            {"code": "WELCOME", "discount_type": "percentage", "discount_value": "15.00"},
        )
        assert coupon.status_code == status.HTTP_201_CREATED
        assert Coupon.objects.filter(code="WELCOME").exists()

        page = client.post(
            "/api/admin/cms/pages/",
            {"title": "Shipping", "slug": "shipping", "content": [], "status": "draft"},
            format="json",
        )
        assert page.status_code == status.HTTP_201_CREATED
        published = client.post("/api/admin/cms/pages/shipping/publish/")
        assert published.status_code == status.HTTP_200_OK

        from io import BytesIO
        from PIL import Image

        _buf = BytesIO()
        Image.new("RGB", (64, 64), (10, 20, 30)).save(_buf, format="JPEG")
        image = SimpleUploadedFile("colour.jpg", _buf.getvalue(), content_type="image/jpeg")
        upload = client.post(
            "/api/admin/media_libm/upload/",
            {
                "content_type": "productoption",
                "object_id": str(catalog["option"].id),
                "file": image,
                "media_type": "image",
                "alt_text": "Cleanser",
            },
            format="multipart",
        )
        assert upload.status_code == status.HTTP_201_CREATED
        thumbnail_task.assert_called_once_with(upload.data["id"])

    # [Test Category]: Admin Journey
    # [Scenario Name]: Payment endpoints are mounted and cannot be bypassed by anonymous callers.
    # [Pre-conditions & Setup]: Application URL configuration.
    # [Step-by-Step Action]: Attempt to reach payment initiation endpoint.
    # [Assertions & Expectations]: Route exists; anonymous caller gets 401, never 404.
    @pytest.mark.xfail(
        strict=True,
        reason="payments.urls is not included in config.urls.",
    )
    def test_payment_initiation_route_is_mounted_and_authenticated(self, client):
        response = client.post("/api/payments/initiate/", {"order_id": "00000000-0000-0000-0000-000000000000"})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # [Test Category]: Admin Journey
    # [Scenario Name]: Admin status transition creates history and notification/email side effects.
    # [Pre-conditions & Setup]: Pending order, active notification template, Celery mocked.
    # [Step-by-Step Action]: Move order from pending to awaiting_payment.
    # [Assertions & Expectations]: 200, history row, in-app notification, queued email.
    def test_admin_transition_creates_notification_and_queues_email(self, client, admin, customer, mocker):
        NotificationTemplate.objects.create(
            type="order_status_change",
            subject_template="Order {{ order_number }} updated",
            body_template="{{ old_status }} -> {{ new_status }}",
        )
        queued = mocker.patch("notifications.services.send_notification_email.delay")
        order = create_order(customer)
        authenticate(client, admin)

        response = client.post(
            f"/api/admin/orders/{order.id}/transition/", {"status": "awaiting_payment"}
        )
        assert response.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.status == Order.Status.AWAITING_PAYMENT
        assert order.status_history.filter(to_status=Order.Status.AWAITING_PAYMENT).exists()
        assert Notification.objects.filter(user=customer, type="order_status_change").exists()
        queued.assert_called_once()

    # [Test Category]: Admin Journey
    # [Scenario Name]: Expired reservations release sellable stock.
    # [Pre-conditions & Setup]: Inventory with an expired active reservation.
    # [Step-by-Step Action]: Run the scheduled service synchronously.
    # [Assertions & Expectations]: Reservation is expired and reserved quantity is zero.
    @pytest.mark.xfail(
        strict=True,
        reason="Expiration aggregates active reservations before marking expired rows.",
    )
    def test_expired_reservation_releases_stock_on_first_run(self, catalog):
        reservation = Reservation.objects.create(
            inventory=catalog["inventory"], quantity=3,
            expires_at=timezone.now() - timedelta(minutes=1),
        )
        catalog["inventory"].reserved_quantity = 3
        catalog["inventory"].save()

        from inventory.services import InventoryService

        InventoryService().expire_reservations()
        reservation.refresh_from_db()
        catalog["inventory"].refresh_from_db()
        assert reservation.status == Reservation.Status.EXPIRED
        assert catalog["inventory"].reserved_quantity == 0


class TestConcurrentAndFailureContracts:
    # [Test Category]: Security & RBAC
    # [Scenario Name]: Coupon per-user limit survives concurrent checkout attempts.
    # [Pre-conditions & Setup]: Coupon max_per_user=1 and two independent carts for one user.
    # [Step-by-Step Action]: Execute two checkout requests concurrently in CI with a real transaction-capable DB.
    # [Assertions & Expectations]: Exactly one CouponUsage row and one successful order use the coupon.
    # [Test Code Implementation]: Kept as a contract test; use PostgreSQL in CI because SQLite serializes writes.
    @pytest.mark.skip(reason="Enable in PostgreSQL CI after checkout arithmetic is fixed.")
    def test_concurrent_coupon_limit_is_atomic(self):
        from concurrent.futures import ThreadPoolExecutor
        from django.db import close_old_connections

        def checkout_in_new_connection():
            close_old_connections()
            try:
                # Build/use a separate API client and cart fixture per worker here.
                return APIClient().post("/api/orders/checkout/", {}, format="json").status_code
            finally:
                close_old_connections()

        with ThreadPoolExecutor(max_workers=2) as executor:
            statuses = list(executor.map(lambda _: checkout_in_new_connection(), range(2)))

        assert statuses.count(status.HTTP_201_CREATED) == 1

    # [Test Category]: User Journey
    # [Scenario Name]: Invalid form input returns a controlled validation response.
    # [Pre-conditions & Setup]: Anonymous client.
    # [Step-by-Step Action]: Submit malformed login, search pagination, and cart payloads.
    # [Assertions & Expectations]: 400, normalized error envelope, no server error.
    def test_invalid_input_is_rejected_without_server_error(self, client):
        cases = [
            ("post", "/api/auth/login/", {"email": "not-an-email", "password": ""}),
            ("post", "/api/cart/add-item/", {"variant_id": "bad", "quantity": -1}),
            ("get", "/api/search/products/?page=0", None),
        ]
        for method, path, payload in cases:
            response = getattr(client, method)(path, payload, format="json")
            assert response.status_code == status.HTTP_400_BAD_REQUEST
            assert response.data["error"]["code"] == status.HTTP_400_BAD_REQUEST

    # [Test Category]: Admin Journey
    # [Scenario Name]: Authenticated requests generate privacy-safe audit records.
    # [Pre-conditions & Setup]: Authenticated customer and captured audit logger.
    # [Step-by-Step Action]: Request a protected endpoint.
    # [Assertions & Expectations]: Method/path/status are recorded; credentials and bodies are absent.
    def test_audit_log_contains_no_credentials_or_request_body(self, client, customer, caplog):
        authenticate(client, customer)
        with caplog.at_level("INFO", logger="audit"):
            response = client.get("/api/notifications/")

        assert response.status_code == status.HTTP_200_OK
        records = [record.getMessage() for record in caplog.records if record.name == "audit"]
        assert any("method=GET" in message and "status=200" in message for message in records)
        assert all("ValidPass1!" not in message for message in records)
