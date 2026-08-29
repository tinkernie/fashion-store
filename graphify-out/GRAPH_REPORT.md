# Graph Report - fashion-store  (2026-08-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1962 nodes · 4101 edges · 208 communities (126 shown, 82 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 264 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c1e86a75`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- VariantFactory
- CategoryFactory
- CollectionService
- UserFactory
- BusinessException
- Variant
- AnalyticsService
- BaseModel
- Wishlist
- getApiErrorMessage
- cn
- test_e2e_journeys.py
- AuthService
- Media
- profile/page.tsx
- compilerOptions
- EmailVerificationToken
- Product
- PageFactory
- common/exceptions.py
- notifications/tests/test_services.py
- Order
- ProductOptionFactory
- ProductFactory
- cms/views.py
- components.json
- auth/page.tsx
- Notification
- CartViewSet
- inventory/tests/factories.py
- InventoryFactory
- OrderFactory
- Payment
- devDependencies
- InventoryService
- dependencies
- authentication/serializers.py
- NotificationService
- products/views.py
- ProductService
- SearchService
- api.ts
- [id]/page.tsx
- Page
- orders/views.py
- backend/tests/test_services.py
- DummyGateway
- SiteContent
- media_libm/views.py
- notifications/views.py
- PaymentService
- AdminProductOptionViewSet
- CMSService
- AdminInventoryViewSet
- ProductDetailSerializer
- jalali.ts
- OrderService
- OptionValueService
- Inventory
- MediaFactory
- notifications/services.py
- ProductOptionService
- package.json
- .create_verification_token
- celery.py
- TestProductService
- search/views.py
- OrderSelector
- app/layout.tsx
- TestVariantService
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
- Inventory
- Reservation
- atomic
- Order
- action
- DjangoModelFactory
- action
- How to Run Instructions

## God Nodes (most connected - your core abstractions)
1. `BusinessException` - 109 edges
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
- `TestAdminAPI` --uses--> `VariantFactory`  [INFERRED]
  backend/variants/tests/test_api.py → backend/variants/tests/factories.py
- `TestPublicAPI` --uses--> `VariantFactory`  [INFERRED]
  backend/variants/tests/test_api.py → backend/variants/tests/factories.py
- `TestVariantService` --uses--> `VariantFactory`  [INFERRED]
  backend/variants/tests/test_services.py → backend/variants/tests/factories.py
- `OrderService` --uses--> `CartSelector`  [INFERRED]
  backend/orders/services.py → backend/cart/selectors.py
- `ProductService` --uses--> `CategorySelector`  [INFERRED]
  backend/products/services.py → backend/categories/selectors.py

## Import Cycles
- None detected.

## Communities (208 total, 82 thin omitted)

### Community 0 - "VariantFactory"
Cohesion: 0.06
Nodes (32): atomic, Cart, CartItem, Meta, CartItemRepository, CartRepository, Cart, CartSelector (+24 more)

### Community 1 - "CategoryFactory"
Cohesion: 0.05
Nodes (30): CategoryAdmin, register, Category, Meta, MPTTMeta, CategoryRepository, CategorySelector, Return active root nodes with their active descendants as a tree. (+22 more)

### Community 2 - "CollectionService"
Cohesion: 0.06
Nodes (29): CollectionAdmin, CollectionProductInline, register, Collection, CollectionProduct, Meta, CollectionRepository, atomic (+21 more)

### Community 3 - "UserFactory"
Cohesion: 0.07
Nodes (28): django_db, patch, TestSignals, Meta, UserFactory, CouponAdmin, CouponUsageAdmin, register (+20 more)

### Community 4 - "BusinessException"
Cohesion: 0.06
Nodes (27): action, APIException, InvalidTokenException, TokenExpiredException, BusinessException, AdminUserSerializer, AdminUserUpdateSerializer, AssignGroupsSerializer (+19 more)

### Community 5 - "Variant"
Cohesion: 0.07
Nodes (24): Command, register, VariantAdmin, VariantOptionInline, Availability, Meta, BaseModel, Status (+16 more)

### Community 6 - "AnalyticsService"
Cohesion: 0.07
Nodes (24): register, TrackedEventAdmin, AnalyticsConfig, AppConfig, cart_changed_handler(), order_placed_handler(), Meta, TrackedEvent (+16 more)

### Community 7 - "BaseModel"
Cohesion: 0.06
Nodes (24): AbstractBaseUser, UserRepository, UserManager, BaseModel, Meta, Ultimate base for all domain entities., SoftDeleteManager, SoftDeleteModel (+16 more)

### Community 8 - "Wishlist"
Cohesion: 0.08
Nodes (20): register, WishlistAdmin, WishlistItemInline, Meta, Wishlist, WishlistItem, WishlistRepository, WishlistSelector (+12 more)

### Community 9 - "getApiErrorMessage"
Cohesion: 0.09
Nodes (24): AdminCMSPage(), AdminCouponsPage(), AdminNotificationsPage(), AdminOrdersPage(), AdminProductsPage(), OptionDef, VariantItem, AdminReviewsPage() (+16 more)

### Community 10 - "cn"
Cohesion: 0.09
Nodes (29): metadata, FilterFacet, POPULAR_KEYWORDS, PRESET_COLORS, ProductItem, SearchPage(), SORT_OPTIONS, DropdownMenu() (+21 more)

### Community 11 - "test_e2e_journeys.py"
Cohesion: 0.08
Nodes (19): admin(), authenticate(), catalog(), client(), create_order(), customer(), customer_b(), End-to-end API journeys for the Luxe shop. Run with:: pytest -q… (+11 more)

### Community 12 - "AuthService"
Cohesion: 0.10
Nodes (15): APIView, LoginSerializer, PasswordResetRequestSerializer, VerifyEmailSerializer, AuthService, ChangePasswordView, CustomTokenRefreshView, LoginView (+7 more)

### Community 13 - "Media"
Cohesion: 0.12
Nodes (11): Media, MediaType, Meta, MediaRepository, MediaSelector, MediaService, Reorder media_libm items for a given object to match the order of IDs., generate_thumbnails() (+3 more)

### Community 14 - "profile/page.tsx"
Cohesion: 0.16
Nodes (19): STATUS_TABS, getStepIndex(), getUserIdFromToken(), ORDER_STEPS, ProfilePage(), Dialog(), DialogContent(), DialogDescription() (+11 more)

### Community 15 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 16 - "EmailVerificationToken"
Cohesion: 0.13
Nodes (18): EmailVerificationTokenAdmin, PasswordResetTokenAdmin, EmailVerificationToken, Meta, PasswordResetToken, Optional DB-backed password-reset token (complement to Django's…, TokenRepository, TokenSelector (+10 more)

### Community 17 - "Product"
Cohesion: 0.14
Nodes (9): ProductAdmin, register, Meta, Product, BaseModel, Review, Status, ProductRepository (+1 more)

### Community 18 - "PageFactory"
Cohesion: 0.15
Nodes (10): Meta, PageFactory, DjangoModelFactory, SiteContentFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 19 - "common/exceptions.py"
Cohesion: 0.18
Nodes (9): OptionValueInline, ProductOptionAdmin, register, Meta, OptionValue, ProductOption, OptionValueRepository, OptionValueSelector (+1 more)

### Community 20 - "notifications/tests/test_services.py"
Cohesion: 0.15
Nodes (13): Meta, NotificationFactory, NotificationTemplateFactory, PreferenceFactory, DjangoModelFactory, django_db, TestUserEndpoints, django_db (+5 more)

### Community 21 - "Order"
Cohesion: 0.16
Nodes (13): OrderAdmin, OrderItemInline, register, StatusHistoryInline, Meta, Order, OrderItem, OrderSequence (+5 more)

### Community 22 - "ProductOptionFactory"
Cohesion: 0.16
Nodes (11): Meta, OptionValueFactory, ProductOptionFactory, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+3 more)

### Community 23 - "ProductFactory"
Cohesion: 0.11
Nodes (11): Meta, ProductFactory, DjangoModelFactory, django_db, TestPublicAPI, django_db, TestSearchAPI, django_db (+3 more)

### Community 24 - "cms/views.py"
Cohesion: 0.15
Nodes (8): PageSerializer, PageUpdateSerializer, SiteContentSerializer, AdminPageViewSet, AdminSiteContentViewSet, PublicPageViewSet, PublicSiteContentViewSet, action

### Community 25 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 26 - "auth/page.tsx"
Cohesion: 0.12
Nodes (18): AuthPage(), ForgotPasswordForm, forgotPasswordSchema, identifierValidator, LoginForm, loginSchema, passwordRegisterSchema, RegisterForm (+10 more)

### Community 27 - "Notification"
Cohesion: 0.19
Nodes (10): NotificationAdmin, NotificationTemplateAdmin, register, UserNotificationPreferenceAdmin, Meta, Notification, NotificationTemplate, UserNotificationPreference (+2 more)

### Community 28 - "CartViewSet"
Cohesion: 0.17
Nodes (8): ApplyCouponSerializer, CartAddItemSerializer, CartMergeSerializer, CartUpdateQuantitySerializer, CartViewSet, action, Merge guest cart into user cart (called after login). Must be authenticated., Ensure a session key exists for guest users.

### Community 29 - "inventory/tests/factories.py"
Cohesion: 0.22
Nodes (8): InventoryAdmin, register, ReservationAdmin, Inventory, Meta, Reservation, Status, InventorySelector

### Community 30 - "InventoryFactory"
Cohesion: 0.15
Nodes (9): InventoryFactory, Meta, DjangoModelFactory, post_generation, VariantFactory, django_db, TestAdminAPI, django_db (+1 more)

### Community 31 - "OrderFactory"
Cohesion: 0.13
Nodes (13): Meta, OrderFactory, OrderItemFactory, DjangoModelFactory, TestStatusTransitions, Meta, PaymentFactory, DjangoModelFactory (+5 more)

### Community 32 - "Payment"
Cohesion: 0.18
Nodes (7): PaymentAdmin, register, Meta, Payment, Status, PaymentRepository, PaymentSelector

### Community 33 - "devDependencies"
Cohesion: 0.11
Nodes (19): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 34 - "InventoryService"
Cohesion: 0.25
Nodes (7): Row lock using select_for_update. Must be called inside a transaction., InventoryService, atomic, Called by Celery Beat every 5 minutes (crontab minute=*/5). Finds all ACTIVE…, Add or remove available quantity (admin action). Supports variant_id or…, Inventory, Reservation

### Community 35 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, class-variance-authority, dependencies, axios, class-variance-authority, lucide-react, next, next-themes (+9 more)

### Community 36 - "authentication/serializers.py"
Cohesion: 0.24
Nodes (9): ChangePasswordSerializer, PasswordResetConfirmSerializer, RegisterSerializer, TokenRefreshSerializer, PasswordValidator, test_missing_digit(), test_missing_uppercase(), test_short_password() (+1 more)

### Community 37 - "NotificationService"
Cohesion: 0.18
Nodes (4): NotificationRepository, PreferenceRepository, NotificationService, Create an in-app notification and conditionally send an email.

### Community 38 - "products/views.py"
Cohesion: 0.24
Nodes (5): AdminReviewUpdateSerializer, ReviewCreateSerializer, ReviewSerializer, AdminReviewViewSet, PublicReviewViewSet

### Community 39 - "ProductService"
Cohesion: 0.18
Nodes (4): ProductCreateSerializer, ProductUpdateSerializer, ProductService, AdminProductViewSet

### Community 40 - "SearchService"
Cohesion: 0.18
Nodes (5): Build available filters based on the current product queryset. Returns a dict…, SearchSelector, SearchService, django_db, TestSearchService

### Community 41 - "api.ts"
Cohesion: 0.18
Nodes (3): NAV_ITEMS, CollectionsSection(), api

### Community 42 - "[id]/page.tsx"
Cohesion: 0.15
Nodes (13): PRESET_COLORS, ProductDetailPage(), ProductOption, ProductOptionValue, ProductVariant, SearchContent(), Navbar(), COLOR_MAP (+5 more)

### Community 43 - "Page"
Cohesion: 0.25
Nodes (5): Page, Status, PageRepository, PageSelector, SiteContentSelector

### Community 44 - "orders/views.py"
Cohesion: 0.21
Nodes (7): CreateOrderSerializer, Meta, OrderListSerializer, StatusTransitionSerializer, AdminOrderViewSet, action, UserOrderViewSet

### Community 45 - "backend/tests/test_services.py"
Cohesion: 0.20
Nodes (6): Meta, UserFactory, django_db, TestAuthEndpoints, django_db, TestAuthService

### Community 46 - "DummyGateway"
Cohesion: 0.16
Nodes (6): ABC, BasePaymentGateway, Validate callback payload and return: - 'gateway_reference': str - 'status':…, Return a dict with at least: - 'gateway_reference': str - 'status': str…, DummyGateway, BasePaymentGateway

### Community 47 - "SiteContent"
Cohesion: 0.19
Nodes (7): PageAdmin, register, SiteContentAdmin, Meta, Key-value store for global site sections. Expected keys: 'homepage', 'header',…, SiteContent, SiteContentRepository

### Community 48 - "media_libm/views.py"
Cohesion: 0.30
Nodes (6): MediaUpdateSerializer, MediaUploadSerializer, ReorderSerializer, AdminMediaViewSet, PublicMediaViewSet, action

### Community 49 - "notifications/views.py"
Cohesion: 0.19
Nodes (6): MarkReadSerializer, NotificationListSerializer, PreferenceSerializer, AdminNotificationViewSet, action, UserNotificationViewSet

### Community 50 - "PaymentService"
Cohesion: 0.24
Nodes (6): CallbackSerializer, InitiatePaymentSerializer, PaymentService, CallbackViewSet, PaymentViewSet, action

### Community 51 - "AdminProductOptionViewSet"
Cohesion: 0.22
Nodes (4): ProductOptionDetailSerializer, ProductOptionSerializer, AdminProductOptionViewSet, PublicProductOptionViewSet

### Community 53 - "AdminInventoryViewSet"
Cohesion: 0.31
Nodes (6): AdjustStockSerializer, InventorySerializer, ReservationExpirationSerializer, SafetyStockSerializer, AdminInventoryViewSet, action

### Community 54 - "ProductDetailSerializer"
Cohesion: 0.23
Nodes (3): Meta, ProductDetailSerializer, PublicProductViewSet

### Community 55 - "jalali.ts"
Cohesion: 0.33
Nodes (9): ShamsiDatePicker(), ShamsiDatePickerProps, getJalaliFirstDayOfWeek(), getJalaliMonthDays(), gregorianToJalali(), JALALI_MONTH_NAMES, JALALI_WEEK_DAYS, JALALI_WEEK_DAYS_SHORT (+1 more)

### Community 56 - "OrderService"
Cohesion: 0.31
Nodes (3): OrderService, Return stock for all items if order is cancelled before shipping., Order

### Community 57 - "OptionValueService"
Cohesion: 0.27
Nodes (3): OptionValueSerializer, OptionValueService, action

### Community 58 - "Inventory"
Cohesion: 0.29
Nodes (4): InventoryRepository, Inventory, Reservation, ReservationRepository

### Community 59 - "MediaFactory"
Cohesion: 0.27
Nodes (6): MediaFactory, Meta, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI

### Community 60 - "notifications/services.py"
Cohesion: 0.24
Nodes (5): NotificationsConfig, AppConfig, order_status_changed_handler(), shared_task, send_notification_email()

### Community 62 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 63 - ".create_verification_token"
Cohesion: 0.25
Nodes (3): UserSelector, ResendVerificationSerializer, ResendVerificationView

### Community 64 - "celery.py"
Cohesion: 0.29
Nodes (5): expire_reservations_task(), shared_task, Celery Beat periodic task — runs every 5 minutes via crontab(minute="*/5").…, Alias for expire_reservations_task — kept for spec compatibility. Directly…, release_expired_reservations()

### Community 65 - "TestProductService"
Cohesion: 0.25
Nodes (3): Return published, non‑deleted products with active category., django_db, TestProductService

### Community 66 - "search/views.py"
Cohesion: 0.32
Nodes (3): SearchSerializer, action, SearchViewSet

### Community 68 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): metadata, vazirmatn, LayoutShell(), Toaster()

## Knowledge Gaps
- **187 isolated node(s):** `Meta`, `Meta`, `MPTTMeta`, `Meta`, `FilterFacet` (+182 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **82 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BusinessException` connect `BusinessException` to `VariantFactory`, `CategoryFactory`, `CollectionService`, `UserFactory`, `Variant`, `AnalyticsService`, `Wishlist`, `AuthService`, `Media`, `Product`, `PageFactory`, `common/exceptions.py`, `notifications/tests/test_services.py`, `Order`, `ProductOptionFactory`, `Notification`, `inventory/tests/factories.py`, `Payment`, `InventoryService`, `NotificationService`, `Page`, `backend/tests/test_services.py`, `PaymentService`, `CMSService`, `OrderService`, `OptionValueService`, `ProductOptionService`, `.create_verification_token`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Why does `BaseModel` connect `BaseModel` to `VariantFactory`, `CategoryFactory`, `Payment`, `UserFactory`, `CollectionService`, `AnalyticsService`, `Wishlist`, `Page`, `Media`, `SiteContent`, `common/exceptions.py`, `Order`, `Notification`, `inventory/tests/factories.py`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `ProductFactory` connect `ProductFactory` to `TestProductService`, `CategoryFactory`, `Variant`, `TestVariantService`, `SearchService`, `Wishlist`, `Product`, `ProductOptionFactory`, `inventory/tests/factories.py`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 27 inferred relationships involving `BusinessException` (e.g. with `.change_password()` and `.login_user()`) actually correct?**
  _`BusinessException` has 27 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ProductFactory` (e.g. with `TestPublicAPI` and `TestProductService`) actually correct?**
  _`ProductFactory` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `VariantFactory` (e.g. with `TestAdminAPI` and `TestPublicAPI`) actually correct?**
  _`VariantFactory` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Meta`, `Meta`, `MPTTMeta` to the rest of the system?**
  _187 weakly-connected nodes found - possible documentation gaps or missing edges._