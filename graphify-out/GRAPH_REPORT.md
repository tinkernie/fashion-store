# Graph Report - fashion-store  (2026-08-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1963 nodes · 4144 edges · 223 communities (143 shown, 80 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 286 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fef8dec2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Product
- Collection
- CategoryFactory
- UserFactory
- Cart
- UserService
- BusinessException
- Media
- AnalyticsService
- Variant
- Wishlist
- cn
- AuthService
- getApiErrorMessage
- compilerOptions
- EmailVerificationToken
- profile/page.tsx
- User
- PageFactory
- notifications/tests/test_services.py
- cms/views.py
- ProductOptionFactory
- Order
- components.json
- auth/page.tsx
- VariantFactory
- InventoryService
- ProductFactory
- CartViewSet
- common/exceptions.py
- BaseModel
- notifications/models.py
- authenticate
- button.tsx
- devDependencies
- Payment
- .lock_inventory
- dependencies
- authentication/serializers.py
- api.ts
- orders/views.py
- SearchService
- Page
- common/models.py
- PaymentService
- backend/tests/test_services.py
- DummyGateway
- SiteContent
- CMSService
- notifications/views.py
- OrderFactory
- AdminInventoryViewSet
- coupons/page.tsx
- [id]/page.tsx
- NotificationService
- Inventory
- test_e2e_journeys.py
- package.json
- .create_verification_token
- celery.py
- Notification
- PaymentFactory
- search/views.py
- app/layout.tsx
- order_status_changed_handler
- notifications/admin.py
- TestAuthenticationAndOnboarding
- TestConcurrentAndFailureContracts
- IsTokenValid
- AuditLogMiddleware
- NotificationSelector
- AuthenticationConfig
- CartConfig
- CategoriesConfig
- CmsConfig
- CommonConfig
- CoreConfig
- StandardPagination
- BaseAPIView
- CouponsConfig
- InventoryConfig
- main
- MediaConfig
- Command
- OrdersConfig
- PaymentsConfig
- ProductOptionsConfig
- ProductsConfig
- SearchConfig
- StoreCollectionsConfig
- users/admin.py
- UsersConfig
- VariantsConfig
- WishlistConfig
- product-card.tsx
- analytics/migrations/0001_initial.py
- analytics/migrations/0002_initial.py
- authentication/migrations/0001_initial.py
- authentication/migrations/0002_initial.py
- 0003_add_password_reset_token.py
- cart/migrations/0001_initial.py
- cart/migrations/0002_initial.py
- categories/migrations/0001_initial.py
- cms/migrations/0001_initial.py
- common/migrations/0001_initial.py
- asgi.py
- wsgi.py
- coupons/migrations/0001_initial.py
- coupons/migrations/0002_initial.py
- inventory/migrations/0001_initial.py
- media_libm/migrations/0001_initial.py
- notifications/migrations/0001_initial.py
- orders/migrations/0001_initial.py
- orders/migrations/0002_initial.py
- payments/migrations/0001_initial.py
- product_options/migrations/0001_initial.py
- products/migrations/0001_initial.py
- 0002_review.py
- store_collections/migrations/0001_initial.py
- users/migrations/0001_initial.py
- variants/migrations/0001_initial.py
- wishlist/migrations/0001_initial.py
- class-variance-authority
- framer-motion
- eslint.config.mjs
- next.config.ts
- next-env.d.ts
- @hookform/resolvers
- react
- react-dom
- react-hook-form
- shadcn
- sonner
- tw-animate-css
- zod
- postcss.config.mjs
- register
- BaseCommand
- atomic
- Inventory
- Reservation
- action
- action
- How to Run Instructions

## God Nodes (most connected - your core abstractions)
1. `BusinessException` - 107 edges
2. `ProductFactory` - 47 edges
3. `UserFactory` - 45 edges
4. `BaseModel` - 42 edges
5. `VariantFactory` - 38 edges
6. `cn()` - 36 edges
7. `getApiErrorMessage()` - 33 edges
8. `InventoryService` - 32 edges
9. `AuthService` - 31 edges
10. `Order` - 31 edges

## Surprising Connections (you probably didn't know these)
- `CartService` --uses--> `Product`  [INFERRED]
  backend/cart/services.py → backend/products/models.py
- `Command` --uses--> `Product`  [INFERRED]
  backend/common/management/commands/seed_data.py → backend/products/models.py
- `ProductService` --uses--> `CategorySelector`  [INFERRED]
  backend/products/services.py → backend/categories/selectors.py
- `TestProductService` --uses--> `ProductFactory`  [INFERRED]
  backend/products/tests/test_services.py → backend/products/tests/factories.py
- `CollectionProductInline` --uses--> `CollectionProduct`  [INFERRED]
  backend/store_collections/admin.py → backend/store_collections/models.py

## Import Cycles
- None detected.

## Communities (223 total, 80 thin omitted)

### Community 0 - "Product"
Cohesion: 0.05
Nodes (24): ProductAdmin, register, Meta, Product, BaseModel, Review, Status, ProductRepository (+16 more)

### Community 1 - "Collection"
Cohesion: 0.05
Nodes (29): CollectionAdmin, CollectionProductInline, register, Collection, CollectionProduct, Meta, CollectionRepository, atomic (+21 more)

### Community 2 - "CategoryFactory"
Cohesion: 0.05
Nodes (30): CategoryAdmin, register, Category, Meta, MPTTMeta, CategoryRepository, CategorySelector, Return active root nodes with their active descendants as a tree. (+22 more)

### Community 3 - "UserFactory"
Cohesion: 0.07
Nodes (27): django_db, patch, TestSignals, Meta, UserFactory, CouponAdmin, CouponUsageAdmin, register (+19 more)

### Community 4 - "Cart"
Cohesion: 0.07
Nodes (24): Cart, CartItem, Meta, CartItemRepository, CartRepository, CartSelector, CartService, atomic (+16 more)

### Community 5 - "UserService"
Cohesion: 0.05
Nodes (25): action, IsSelf, Object-level permission to only allow users to edit their own profile., AdminUserSerializer, AdminUserUpdateSerializer, AssignGroupsSerializer, ChangeEmailSerializer, ConfirmEmailSerializer (+17 more)

### Community 6 - "BusinessException"
Cohesion: 0.08
Nodes (23): APIException, InvalidTokenException, TokenExpiredException, BusinessException, OptionValueInline, ProductOptionAdmin, register, Meta (+15 more)

### Community 7 - "Media"
Cohesion: 0.07
Nodes (25): MediaAdmin, register, Media, MediaType, Meta, MediaRepository, MediaSelector, MediaUpdateSerializer (+17 more)

### Community 8 - "AnalyticsService"
Cohesion: 0.07
Nodes (24): register, TrackedEventAdmin, AnalyticsConfig, AppConfig, cart_changed_handler(), order_placed_handler(), Meta, TrackedEvent (+16 more)

### Community 9 - "Variant"
Cohesion: 0.08
Nodes (23): Command, register, VariantAdmin, VariantOptionInline, Availability, Meta, BaseModel, Status (+15 more)

### Community 10 - "Wishlist"
Cohesion: 0.08
Nodes (20): register, WishlistAdmin, WishlistItemInline, Meta, Wishlist, WishlistItem, WishlistRepository, WishlistSelector (+12 more)

### Community 11 - "cn"
Cohesion: 0.09
Nodes (29): metadata, FilterFacet, POPULAR_KEYWORDS, PRESET_COLORS, ProductItem, SearchPage(), SORT_OPTIONS, DropdownMenu() (+21 more)

### Community 12 - "AuthService"
Cohesion: 0.10
Nodes (15): APIView, LoginSerializer, PasswordResetRequestSerializer, VerifyEmailSerializer, AuthService, ChangePasswordView, CustomTokenRefreshView, LoginView (+7 more)

### Community 13 - "getApiErrorMessage"
Cohesion: 0.13
Nodes (20): AdminCMSPage(), AdminCouponsPage(), AdminNotificationsPage(), AdminOrdersPage(), AdminProductsPage(), OptionDef, VariantItem, AdminReviewsPage() (+12 more)

### Community 14 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 15 - "EmailVerificationToken"
Cohesion: 0.13
Nodes (18): EmailVerificationTokenAdmin, PasswordResetTokenAdmin, EmailVerificationToken, Meta, PasswordResetToken, Optional DB-backed password-reset token (complement to Django's…, TokenRepository, TokenSelector (+10 more)

### Community 16 - "profile/page.tsx"
Cohesion: 0.15
Nodes (18): STATUS_TABS, getStepIndex(), getUserIdFromToken(), ORDER_STEPS, ProfilePage(), Dialog(), DialogContent(), DialogDescription() (+10 more)

### Community 17 - "User"
Cohesion: 0.13
Nodes (9): AbstractBaseUser, UserRepository, User, EmailChangeRequest, Meta, UserRepository, UserSelector, PermissionsMixin (+1 more)

### Community 18 - "PageFactory"
Cohesion: 0.15
Nodes (10): Meta, PageFactory, DjangoModelFactory, SiteContentFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 19 - "notifications/tests/test_services.py"
Cohesion: 0.15
Nodes (13): Meta, NotificationFactory, NotificationTemplateFactory, PreferenceFactory, DjangoModelFactory, django_db, TestUserEndpoints, django_db (+5 more)

### Community 20 - "cms/views.py"
Cohesion: 0.15
Nodes (8): PageSerializer, PageUpdateSerializer, SiteContentSerializer, AdminPageViewSet, AdminSiteContentViewSet, PublicPageViewSet, PublicSiteContentViewSet, action

### Community 21 - "ProductOptionFactory"
Cohesion: 0.17
Nodes (11): Meta, OptionValueFactory, ProductOptionFactory, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+3 more)

### Community 22 - "Order"
Cohesion: 0.17
Nodes (7): Order, Status, atomic, OrderSelector, OrderService, atomic, Return stock for all items if order is cancelled before shipping.

### Community 23 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 24 - "auth/page.tsx"
Cohesion: 0.12
Nodes (18): AuthPage(), ForgotPasswordForm, forgotPasswordSchema, identifierValidator, LoginForm, loginSchema, passwordRegisterSchema, RegisterForm (+10 more)

### Community 25 - "VariantFactory"
Cohesion: 0.12
Nodes (10): django_db, TestGuestCartAPI, Meta, DjangoModelFactory, post_generation, VariantFactory, django_db, TestPublicAPI (+2 more)

### Community 26 - "InventoryService"
Cohesion: 0.17
Nodes (10): InventoryService, InventoryFactory, Meta, DjangoModelFactory, post_generation, VariantFactory, django_db, TestAdminAPI (+2 more)

### Community 27 - "ProductFactory"
Cohesion: 0.13
Nodes (9): Meta, ProductFactory, DjangoModelFactory, django_db, TestPublicAPI, django_db, TestSearchAPI, django_db (+1 more)

### Community 28 - "CartViewSet"
Cohesion: 0.22
Nodes (8): ApplyCouponSerializer, CartAddItemSerializer, CartMergeSerializer, CartUpdateQuantitySerializer, CartViewSet, action, Merge guest cart into user cart (called after login). Must be authenticated., Ensure a session key exists for guest users.

### Community 29 - "common/exceptions.py"
Cohesion: 0.22
Nodes (8): InventoryAdmin, register, ReservationAdmin, Inventory, Meta, Reservation, Status, InventorySelector

### Community 30 - "BaseModel"
Cohesion: 0.20
Nodes (12): BaseModel, Ultimate base for all domain entities., OrderAdmin, OrderItemInline, register, StatusHistoryInline, Meta, OrderItem (+4 more)

### Community 31 - "notifications/models.py"
Cohesion: 0.18
Nodes (7): Meta, NotificationTemplate, UserNotificationPreference, TemplateRepository, PreferenceSelector, shared_task, send_notification_email()

### Community 32 - "authenticate"
Cohesion: 0.16
Nodes (7): authenticate(), create_order(), TestAdminJourneyAndTasks, TestCustomerCommerceJourney, TestUserIsolationAndRBAC, parametrize, xfail

### Community 33 - "button.tsx"
Cohesion: 0.16
Nodes (5): NAV_ITEMS, ResetPasswordForm(), Button(), buttonVariants, Input()

### Community 34 - "devDependencies"
Cohesion: 0.11
Nodes (19): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 35 - "Payment"
Cohesion: 0.20
Nodes (7): PaymentAdmin, register, Meta, Payment, Status, PaymentRepository, PaymentSelector

### Community 36 - ".lock_inventory"
Cohesion: 0.22
Nodes (6): atomic, Row lock using select_for_update. Must be called inside a transaction., Called by Celery Beat every 5 minutes (crontab minute=*/5). Finds all ACTIVE…, Add or remove available quantity (admin action). Supports variant_id or…, Inventory, Reservation

### Community 37 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, clsx, dependencies, axios, clsx, lucide-react, next, next-themes (+9 more)

### Community 38 - "authentication/serializers.py"
Cohesion: 0.24
Nodes (9): ChangePasswordSerializer, PasswordResetConfirmSerializer, RegisterSerializer, TokenRefreshSerializer, PasswordValidator, test_missing_digit(), test_missing_uppercase(), test_short_password() (+1 more)

### Community 39 - "api.ts"
Cohesion: 0.18
Nodes (3): VerifyEmailContent(), CollectionsSection(), api

### Community 40 - "orders/views.py"
Cohesion: 0.21
Nodes (7): CreateOrderSerializer, Meta, OrderListSerializer, StatusTransitionSerializer, AdminOrderViewSet, action, UserOrderViewSet

### Community 41 - "SearchService"
Cohesion: 0.21
Nodes (5): Build available filters based on the current product queryset. Returns a dict…, SearchSelector, SearchService, django_db, TestSearchService

### Community 42 - "Page"
Cohesion: 0.25
Nodes (5): Page, Status, PageRepository, PageSelector, SiteContentSelector

### Community 43 - "common/models.py"
Cohesion: 0.20
Nodes (7): UserManager, Meta, SoftDeleteManager, SoftDeleteModel, TimestampedModel, UUIDPrimaryKeyMixin, BaseUserManager

### Community 44 - "PaymentService"
Cohesion: 0.23
Nodes (6): CallbackSerializer, InitiatePaymentSerializer, PaymentService, CallbackViewSet, PaymentViewSet, action

### Community 45 - "backend/tests/test_services.py"
Cohesion: 0.20
Nodes (6): Meta, UserFactory, django_db, TestAuthEndpoints, django_db, TestAuthService

### Community 46 - "DummyGateway"
Cohesion: 0.16
Nodes (6): ABC, BasePaymentGateway, Validate callback payload and return: - 'gateway_reference': str - 'status':…, Return a dict with at least: - 'gateway_reference': str - 'status': str…, DummyGateway, BasePaymentGateway

### Community 47 - "SiteContent"
Cohesion: 0.19
Nodes (7): PageAdmin, register, SiteContentAdmin, Meta, Key-value store for global site sections. Expected keys: 'homepage', 'header',…, SiteContent, SiteContentRepository

### Community 49 - "notifications/views.py"
Cohesion: 0.23
Nodes (6): MarkReadSerializer, NotificationListSerializer, PreferenceSerializer, AdminNotificationViewSet, action, UserNotificationViewSet

### Community 50 - "OrderFactory"
Cohesion: 0.22
Nodes (8): Meta, OrderFactory, OrderItemFactory, DjangoModelFactory, TestStatusTransitions, django_db, patch, TestPaymentService

### Community 51 - "AdminInventoryViewSet"
Cohesion: 0.31
Nodes (6): AdjustStockSerializer, InventorySerializer, ReservationExpirationSerializer, SafetyStockSerializer, AdminInventoryViewSet, action

### Community 52 - "coupons/page.tsx"
Cohesion: 0.32
Nodes (9): ShamsiDatePicker(), ShamsiDatePickerProps, getJalaliFirstDayOfWeek(), getJalaliMonthDays(), gregorianToJalali(), JALALI_MONTH_NAMES, JALALI_WEEK_DAYS, JALALI_WEEK_DAYS_SHORT (+1 more)

### Community 53 - "[id]/page.tsx"
Cohesion: 0.18
Nodes (10): PRESET_COLORS, ProductDetailPage(), ProductOption, ProductOptionValue, ProductVariant, SearchContent(), Navbar(), useWishlist (+2 more)

### Community 54 - "NotificationService"
Cohesion: 0.31
Nodes (3): PreferenceRepository, NotificationService, Create an in-app notification and conditionally send an email.

### Community 55 - "Inventory"
Cohesion: 0.29
Nodes (4): InventoryRepository, Inventory, Reservation, ReservationRepository

### Community 56 - "test_e2e_journeys.py"
Cohesion: 0.29
Nodes (9): admin(), catalog(), client(), customer(), customer_b(), End-to-end API journeys for the Luxe shop. Run with:: pytest -q…, Create a verified standard user without relying on the broken manager., A publicly purchasable product, one variant, and in-stock inventory. (+1 more)

### Community 57 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 58 - ".create_verification_token"
Cohesion: 0.25
Nodes (3): UserSelector, ResendVerificationSerializer, ResendVerificationView

### Community 59 - "celery.py"
Cohesion: 0.29
Nodes (5): expire_reservations_task(), shared_task, Celery Beat periodic task — runs every 5 minutes via crontab(minute="*/5").…, Alias for expire_reservations_task — kept for spec compatibility. Directly…, release_expired_reservations()

### Community 61 - "PaymentFactory"
Cohesion: 0.25
Nodes (5): Meta, PaymentFactory, DjangoModelFactory, django_db, TestPaymentAPI

### Community 62 - "search/views.py"
Cohesion: 0.43
Nodes (3): SearchSerializer, action, SearchViewSet

### Community 63 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): metadata, vazirmatn, LayoutShell(), Toaster()

### Community 64 - "order_status_changed_handler"
Cohesion: 0.40
Nodes (3): NotificationsConfig, AppConfig, order_status_changed_handler()

### Community 65 - "notifications/admin.py"
Cohesion: 0.60
Nodes (4): NotificationAdmin, NotificationTemplateAdmin, register, UserNotificationPreferenceAdmin

## Knowledge Gaps
- **177 isolated node(s):** `ProductPositionSerializer`, `Meta`, `Migration`, `Migration`, `Migration` (+172 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **80 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BusinessException` connect `BusinessException` to `Product`, `Collection`, `CategoryFactory`, `UserFactory`, `Cart`, `UserService`, `Media`, `AnalyticsService`, `Variant`, `Wishlist`, `AuthService`, `PageFactory`, `notifications/tests/test_services.py`, `ProductOptionFactory`, `Order`, `common/exceptions.py`, `BaseModel`, `notifications/models.py`, `Payment`, `.lock_inventory`, `Page`, `PaymentService`, `backend/tests/test_services.py`, `CMSService`, `OrderFactory`, `.create_verification_token`, `Notification`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `Product` connect `Product` to `test_e2e_journeys.py`, `Variant`, `Cart`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `BaseModel` connect `BaseModel` to `Collection`, `CategoryFactory`, `UserFactory`, `Cart`, `Payment`, `BusinessException`, `Media`, `AnalyticsService`, `Page`, `common/models.py`, `Wishlist`, `SiteContent`, `User`, `Order`, `Notification`, `common/exceptions.py`, `notifications/models.py`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `BusinessException` (e.g. with `.change_password()` and `.login_user()`) actually correct?**
  _`BusinessException` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ProductFactory` (e.g. with `TestPublicAPI` and `TestProductService`) actually correct?**
  _`ProductFactory` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `VariantFactory` (e.g. with `TestAdminAPI` and `TestPublicAPI`) actually correct?**
  _`VariantFactory` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ProductPositionSerializer`, `Meta`, `Migration` to the rest of the system?**
  _177 weakly-connected nodes found - possible documentation gaps or missing edges._