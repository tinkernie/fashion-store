# Graph Report - fashion-store  (2026-08-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1962 nodes · 4091 edges · 220 communities (132 shown, 88 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 266 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `00154d1e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CollectionService
- CategoryFactory
- UserFactory
- CartService
- Variant
- AnalyticsService
- Wishlist
- getApiErrorMessage
- cn
- ProductOption
- Media
- profile/page.tsx
- AuthService
- compilerOptions
- EmailVerificationToken
- Order
- PageFactory
- notifications/tests/test_signals.py
- cms/views.py
- common/exceptions.py
- ProductOptionFactory
- components.json
- auth/page.tsx
- VariantFactory
- Product
- authentication/serializers.py
- CartViewSet
- Payment
- ProductFactory
- authenticate
- devDependencies
- InventoryService
- InventoryFactory
- User
- BusinessException
- BaseModel
- PaymentService
- AdminProductOptionViewSet
- dependencies
- SearchService
- UserProfileViewSet
- UserService
- api.ts
- [id]/page.tsx
- media_libm/tests/test_services.py
- Notification
- OrderService
- orders/views.py
- Page
- OrderFactory
- ReviewSerializer
- backend/tests/test_services.py
- DummyGateway
- ProductService
- SiteContent
- CMSService
- media_libm/views.py
- NotificationService
- notifications/views.py
- AdminInventoryViewSet
- ProductDetailSerializer
- EmailChangeRequest
- users/services.py
- jalali.ts
- AdminProductViewSet
- action
- Inventory
- UserNotificationPreference
- test_e2e_journeys.py
- package.json
- PaymentFactory
- products/views.py
- search/views.py
- ProductOptionService
- app/layout.tsx
- inventory/tasks.py
- .create_verification_token
- TestGuestCartAPI
- notifications/admin.py
- TestAuthenticationAndOnboarding
- TestConcurrentAndFailureContracts
- IsTokenValid
- AuditLogMiddleware
- NotificationSelector
- notifications/services.py
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
- clsx
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
- atomic
- BaseCommand
- atomic
- Inventory
- Reservation
- atomic
- Order
- action
- DjangoModelFactory
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
8. `AuthService` - 31 edges
9. `ProductOptionFactory` - 30 edges
10. `InventoryService` - 30 edges

## Surprising Connections (you probably didn't know these)
- `CollectionProductInline` --uses--> `CollectionProduct`  [INFERRED]
  backend/store_collections/admin.py → backend/store_collections/models.py
- `ProductService` --uses--> `CategorySelector`  [INFERRED]
  backend/products/services.py → backend/categories/selectors.py
- `PublicMediaViewSet` --uses--> `MediaSelector`  [INFERRED]
  backend/media_libm/views.py → backend/media_libm/selectors.py
- `AdminMediaViewSet` --uses--> `MediaService`  [INFERRED]
  backend/media_libm/views.py → backend/media_libm/services.py
- `RegisterSerializer` --uses--> `AuthService`  [INFERRED]
  backend/authentication/serializers.py → backend/authentication/services.py

## Import Cycles
- None detected.

## Communities (220 total, 88 thin omitted)

### Community 0 - "CollectionService"
Cohesion: 0.06
Nodes (29): CollectionAdmin, CollectionProductInline, register, Collection, CollectionProduct, Meta, CollectionRepository, atomic (+21 more)

### Community 1 - "CategoryFactory"
Cohesion: 0.05
Nodes (30): CategoryAdmin, register, Category, Meta, MPTTMeta, CategoryRepository, CategorySelector, Return active root nodes with their active descendants as a tree. (+22 more)

### Community 2 - "UserFactory"
Cohesion: 0.06
Nodes (27): django_db, patch, TestSignals, Meta, UserFactory, CouponAdmin, CouponUsageAdmin, register (+19 more)

### Community 3 - "CartService"
Cohesion: 0.08
Nodes (23): atomic, Cart, CartItem, Meta, CartItemRepository, CartRepository, Cart, CartSelector (+15 more)

### Community 4 - "Variant"
Cohesion: 0.07
Nodes (24): Command, register, VariantAdmin, VariantOptionInline, Availability, Meta, BaseModel, Status (+16 more)

### Community 5 - "AnalyticsService"
Cohesion: 0.07
Nodes (24): register, TrackedEventAdmin, AnalyticsConfig, AppConfig, cart_changed_handler(), order_placed_handler(), Meta, TrackedEvent (+16 more)

### Community 6 - "Wishlist"
Cohesion: 0.08
Nodes (20): register, WishlistAdmin, WishlistItemInline, Meta, Wishlist, WishlistItem, WishlistRepository, WishlistSelector (+12 more)

### Community 7 - "getApiErrorMessage"
Cohesion: 0.09
Nodes (24): AdminCMSPage(), AdminCouponsPage(), AdminNotificationsPage(), AdminOrdersPage(), AdminProductsPage(), OptionDef, VariantItem, AdminReviewsPage() (+16 more)

### Community 8 - "cn"
Cohesion: 0.09
Nodes (29): metadata, FilterFacet, POPULAR_KEYWORDS, PRESET_COLORS, ProductItem, SearchPage(), SORT_OPTIONS, DropdownMenu() (+21 more)

### Community 9 - "ProductOption"
Cohesion: 0.14
Nodes (11): OptionValueInline, ProductOptionAdmin, register, Meta, OptionValue, ProductOption, OptionValueRepository, ProductOptionRepository (+3 more)

### Community 10 - "Media"
Cohesion: 0.12
Nodes (11): MediaAdmin, register, Media, MediaType, Meta, MediaRepository, MediaSelector, MediaService (+3 more)

### Community 11 - "profile/page.tsx"
Cohesion: 0.16
Nodes (19): STATUS_TABS, getStepIndex(), getUserIdFromToken(), ORDER_STEPS, ProfilePage(), Dialog(), DialogContent(), DialogDescription() (+11 more)

### Community 12 - "AuthService"
Cohesion: 0.11
Nodes (14): APIView, LoginSerializer, PasswordResetRequestSerializer, VerifyEmailSerializer, AuthService, CustomTokenRefreshView, LoginView, LogoutView (+6 more)

### Community 13 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 14 - "EmailVerificationToken"
Cohesion: 0.13
Nodes (18): EmailVerificationTokenAdmin, PasswordResetTokenAdmin, EmailVerificationToken, Meta, PasswordResetToken, Optional DB-backed password-reset token (complement to Django's…, TokenRepository, TokenSelector (+10 more)

### Community 15 - "Order"
Cohesion: 0.14
Nodes (13): OrderAdmin, OrderItemInline, register, StatusHistoryInline, Meta, Order, OrderItem, OrderSequence (+5 more)

### Community 16 - "PageFactory"
Cohesion: 0.15
Nodes (10): Meta, PageFactory, DjangoModelFactory, SiteContentFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 17 - "notifications/tests/test_signals.py"
Cohesion: 0.14
Nodes (13): Meta, NotificationFactory, NotificationTemplateFactory, PreferenceFactory, DjangoModelFactory, django_db, TestUserEndpoints, django_db (+5 more)

### Community 18 - "cms/views.py"
Cohesion: 0.15
Nodes (8): PageSerializer, PageUpdateSerializer, SiteContentSerializer, AdminPageViewSet, AdminSiteContentViewSet, PublicPageViewSet, PublicSiteContentViewSet, action

### Community 19 - "common/exceptions.py"
Cohesion: 0.18
Nodes (8): InventoryAdmin, register, ReservationAdmin, Inventory, Meta, Reservation, Status, InventorySelector

### Community 20 - "ProductOptionFactory"
Cohesion: 0.18
Nodes (10): Meta, OptionValueFactory, ProductOptionFactory, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 21 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 22 - "auth/page.tsx"
Cohesion: 0.12
Nodes (18): AuthPage(), ForgotPasswordForm, forgotPasswordSchema, identifierValidator, LoginForm, loginSchema, passwordRegisterSchema, RegisterForm (+10 more)

### Community 23 - "VariantFactory"
Cohesion: 0.15
Nodes (9): Meta, DjangoModelFactory, post_generation, VariantFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+1 more)

### Community 24 - "Product"
Cohesion: 0.15
Nodes (8): Meta, Product, BaseModel, Review, Status, ProductRepository, ProductSelector, Return published, non‑deleted products with active category.

### Community 25 - "authentication/serializers.py"
Cohesion: 0.18
Nodes (10): ChangePasswordSerializer, PasswordResetConfirmSerializer, RegisterSerializer, TokenRefreshSerializer, PasswordValidator, ChangePasswordView, test_missing_digit(), test_missing_uppercase() (+2 more)

### Community 26 - "CartViewSet"
Cohesion: 0.17
Nodes (8): ApplyCouponSerializer, CartAddItemSerializer, CartMergeSerializer, CartUpdateQuantitySerializer, CartViewSet, action, Merge guest cart into user cart (called after login). Must be authenticated., Ensure a session key exists for guest users.

### Community 27 - "Payment"
Cohesion: 0.18
Nodes (7): PaymentAdmin, register, Meta, Payment, Status, PaymentRepository, PaymentSelector

### Community 28 - "ProductFactory"
Cohesion: 0.14
Nodes (9): Meta, ProductFactory, DjangoModelFactory, django_db, TestPublicAPI, django_db, TestSearchAPI, django_db (+1 more)

### Community 29 - "authenticate"
Cohesion: 0.16
Nodes (7): authenticate(), create_order(), TestAdminJourneyAndTasks, TestCustomerCommerceJourney, TestUserIsolationAndRBAC, parametrize, xfail

### Community 30 - "devDependencies"
Cohesion: 0.11
Nodes (19): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 31 - "InventoryService"
Cohesion: 0.25
Nodes (7): Row lock using select_for_update. Must be called inside a transaction., InventoryService, atomic, Called by Celery Beat every 5 minutes (crontab minute=*/5). Finds all ACTIVE…, Add or remove available quantity (admin action). Supports variant_id or…, Inventory, Reservation

### Community 32 - "InventoryFactory"
Cohesion: 0.16
Nodes (9): InventoryFactory, Meta, DjangoModelFactory, post_generation, VariantFactory, django_db, TestAdminAPI, django_db (+1 more)

### Community 33 - "User"
Cohesion: 0.16
Nodes (7): AbstractBaseUser, UserRepository, UserSelector, User, UserSelector, PermissionsMixin, QuerySet

### Community 34 - "BusinessException"
Cohesion: 0.18
Nodes (6): APIException, InvalidTokenException, TokenExpiredException, BusinessException, UserValidator, User

### Community 35 - "BaseModel"
Cohesion: 0.19
Nodes (9): UserManager, BaseModel, Meta, Ultimate base for all domain entities., SoftDeleteManager, SoftDeleteModel, TimestampedModel, UUIDPrimaryKeyMixin (+1 more)

### Community 36 - "PaymentService"
Cohesion: 0.18
Nodes (9): CallbackSerializer, InitiatePaymentSerializer, PaymentService, django_db, patch, TestPaymentService, CallbackViewSet, PaymentViewSet (+1 more)

### Community 37 - "AdminProductOptionViewSet"
Cohesion: 0.18
Nodes (6): OptionValueSerializer, ProductOptionDetailSerializer, ProductOptionSerializer, AdminProductOptionViewSet, PublicProductOptionViewSet, action

### Community 38 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, class-variance-authority, dependencies, axios, class-variance-authority, lucide-react, next, next-themes (+9 more)

### Community 39 - "SearchService"
Cohesion: 0.18
Nodes (5): Build available filters based on the current product queryset. Returns a dict…, SearchSelector, SearchService, django_db, TestSearchService

### Community 40 - "UserProfileViewSet"
Cohesion: 0.16
Nodes (8): AdminUserSerializer, AdminUserUpdateSerializer, AssignGroupsSerializer, ChangeEmailSerializer, ConfirmEmailSerializer, UpdateProfileSerializer, UserProfileSerializer, UserProfileViewSet

### Community 41 - "UserService"
Cohesion: 0.24
Nodes (8): UserService, GroupFactory, Meta, UserFactory, django_db, TestUserEndpoints, django_db, TestUserService

### Community 42 - "api.ts"
Cohesion: 0.18
Nodes (3): NAV_ITEMS, CollectionsSection(), api

### Community 43 - "[id]/page.tsx"
Cohesion: 0.15
Nodes (13): PRESET_COLORS, ProductDetailPage(), ProductOption, ProductOptionValue, ProductVariant, SearchContent(), Navbar(), COLOR_MAP (+5 more)

### Community 44 - "media_libm/tests/test_services.py"
Cohesion: 0.17
Nodes (8): MediaFactory, Meta, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db, TestMediaService

### Community 45 - "Notification"
Cohesion: 0.23
Nodes (5): Meta, Notification, NotificationTemplate, NotificationRepository, TemplateRepository

### Community 46 - "OrderService"
Cohesion: 0.22
Nodes (5): OrderSelector, Order, OrderService, Return stock for all items if order is cancelled before shipping., Order

### Community 47 - "orders/views.py"
Cohesion: 0.21
Nodes (7): CreateOrderSerializer, Meta, OrderListSerializer, StatusTransitionSerializer, AdminOrderViewSet, action, UserOrderViewSet

### Community 48 - "Page"
Cohesion: 0.25
Nodes (5): Page, Status, PageRepository, PageSelector, SiteContentSelector

### Community 49 - "OrderFactory"
Cohesion: 0.19
Nodes (8): Meta, OrderFactory, OrderItemFactory, DjangoModelFactory, django_db, TestAdminEndpoints, TestUserEndpoints, TestStatusTransitions

### Community 50 - "ReviewSerializer"
Cohesion: 0.25
Nodes (5): AdminReviewUpdateSerializer, ReviewCreateSerializer, ReviewSerializer, AdminReviewViewSet, PublicReviewViewSet

### Community 51 - "backend/tests/test_services.py"
Cohesion: 0.20
Nodes (6): Meta, UserFactory, django_db, TestAuthEndpoints, django_db, TestAuthService

### Community 52 - "DummyGateway"
Cohesion: 0.16
Nodes (6): ABC, BasePaymentGateway, Validate callback payload and return: - 'gateway_reference': str - 'status':…, Return a dict with at least: - 'gateway_reference': str - 'status': str…, DummyGateway, BasePaymentGateway

### Community 53 - "ProductService"
Cohesion: 0.21
Nodes (3): ProductService, django_db, TestProductService

### Community 54 - "SiteContent"
Cohesion: 0.19
Nodes (7): PageAdmin, register, SiteContentAdmin, Meta, Key-value store for global site sections. Expected keys: 'homepage', 'header',…, SiteContent, SiteContentRepository

### Community 56 - "media_libm/views.py"
Cohesion: 0.30
Nodes (6): MediaUpdateSerializer, MediaUploadSerializer, ReorderSerializer, AdminMediaViewSet, PublicMediaViewSet, action

### Community 57 - "NotificationService"
Cohesion: 0.20
Nodes (5): NotificationsConfig, AppConfig, order_status_changed_handler(), NotificationService, Create an in-app notification and conditionally send an email.

### Community 58 - "notifications/views.py"
Cohesion: 0.19
Nodes (6): MarkReadSerializer, NotificationListSerializer, PreferenceSerializer, AdminNotificationViewSet, action, UserNotificationViewSet

### Community 59 - "AdminInventoryViewSet"
Cohesion: 0.31
Nodes (6): AdjustStockSerializer, InventorySerializer, ReservationExpirationSerializer, SafetyStockSerializer, AdminInventoryViewSet, action

### Community 60 - "ProductDetailSerializer"
Cohesion: 0.23
Nodes (3): Meta, ProductDetailSerializer, PublicProductViewSet

### Community 61 - "EmailChangeRequest"
Cohesion: 0.21
Nodes (5): EmailChangeRequestAdmin, register, EmailChangeRequest, Meta, UserRepository

### Community 62 - "users/services.py"
Cohesion: 0.20
Nodes (5): IsSelf, Object-level permission to only allow users to edit their own profile., shared_task, Async email-change confirmation — offloaded via transaction.on_commit in…, send_email_change_verification()

### Community 63 - "jalali.ts"
Cohesion: 0.33
Nodes (9): ShamsiDatePicker(), ShamsiDatePickerProps, getJalaliFirstDayOfWeek(), getJalaliMonthDays(), gregorianToJalali(), JALALI_MONTH_NAMES, JALALI_WEEK_DAYS, JALALI_WEEK_DAYS_SHORT (+1 more)

### Community 64 - "AdminProductViewSet"
Cohesion: 0.24
Nodes (3): ProductCreateSerializer, ProductUpdateSerializer, AdminProductViewSet

### Community 66 - "Inventory"
Cohesion: 0.29
Nodes (4): InventoryRepository, Inventory, Reservation, ReservationRepository

### Community 67 - "UserNotificationPreference"
Cohesion: 0.33
Nodes (3): UserNotificationPreference, PreferenceRepository, PreferenceSelector

### Community 68 - "test_e2e_journeys.py"
Cohesion: 0.29
Nodes (9): admin(), catalog(), client(), customer(), customer_b(), End-to-end API journeys for the Luxe shop. Run with:: pytest -q…, Create a verified standard user without relying on the broken manager., A publicly purchasable product, one variant, and in-stock inventory. (+1 more)

### Community 69 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 70 - "PaymentFactory"
Cohesion: 0.25
Nodes (5): Meta, PaymentFactory, DjangoModelFactory, django_db, TestPaymentAPI

### Community 72 - "search/views.py"
Cohesion: 0.32
Nodes (3): SearchSerializer, action, SearchViewSet

### Community 74 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): metadata, vazirmatn, LayoutShell(), Toaster()

### Community 75 - "inventory/tasks.py"
Cohesion: 0.40
Nodes (5): expire_reservations_task(), shared_task, Celery Beat periodic task — runs every 5 minutes via crontab(minute="*/5").…, Alias for expire_reservations_task — kept for spec compatibility. Directly…, release_expired_reservations()

### Community 78 - "notifications/admin.py"
Cohesion: 0.60
Nodes (4): NotificationAdmin, NotificationTemplateAdmin, register, UserNotificationPreferenceAdmin

## Knowledge Gaps
- **187 isolated node(s):** `ProductPositionSerializer`, `Meta`, `Meta`, `MPTTMeta`, `Meta` (+182 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **88 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BusinessException` connect `BusinessException` to `CollectionService`, `CategoryFactory`, `UserFactory`, `CartService`, `Variant`, `AnalyticsService`, `Wishlist`, `ProductOption`, `Media`, `AuthService`, `Order`, `PageFactory`, `common/exceptions.py`, `ProductOptionFactory`, `VariantFactory`, `Product`, `authentication/serializers.py`, `Payment`, `InventoryService`, `PaymentService`, `UserService`, `media_libm/tests/test_services.py`, `Notification`, `OrderService`, `Page`, `OrderFactory`, `backend/tests/test_services.py`, `ProductService`, `CMSService`, `ProductOptionService`, `.create_verification_token`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Why does `BaseModel` connect `BaseModel` to `CollectionService`, `CategoryFactory`, `User`, `CartService`, `UserFactory`, `AnalyticsService`, `Wishlist`, `ProductOption`, `Media`, `Notification`, `Order`, `Page`, `common/exceptions.py`, `SiteContent`, `Payment`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `InventoryService` connect `InventoryService` to `InventoryFactory`, `CartService`, `test_e2e_journeys.py`, `inventory/tasks.py`, `common/exceptions.py`, `AdminInventoryViewSet`, `authenticate`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 33 inferred relationships involving `BusinessException` (e.g. with `.change_password()` and `.login_user()`) actually correct?**
  _`BusinessException` has 33 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ProductFactory` (e.g. with `TestPublicAPI` and `TestProductService`) actually correct?**
  _`ProductFactory` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `VariantFactory` (e.g. with `TestAdminAPI` and `TestPublicAPI`) actually correct?**
  _`VariantFactory` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ProductPositionSerializer`, `Meta`, `Meta` to the rest of the system?**
  _187 weakly-connected nodes found - possible documentation gaps or missing edges._