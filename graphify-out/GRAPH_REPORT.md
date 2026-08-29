# Graph Report - fashion-store  (2026-08-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1934 nodes · 4029 edges · 228 communities (149 shown, 79 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 296 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e00f7b67`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Product
- Collection
- VariantFactory
- UserFactory
- Variant
- AnalyticsService
- cn
- Media
- EmailVerificationToken
- common/exceptions.py
- profile/page.tsx
- Order
- OrderFactory
- compilerOptions
- ProductOptionFactory
- notifications/tests/test_signals.py
- PageFactory
- authenticate
- BaseModel
- ProductFactory
- auth/page.tsx
- AuthService
- CategorySelector
- cms/views.py
- SearchService
- button.tsx
- User
- OptionValueService
- components.json
- authentication/serializers.py
- WishlistService
- CartViewSet
- inventory/tests/factories.py
- InventoryFactory
- Wishlist
- admin/products/page.tsx
- InventoryService
- devDependencies
- users/views.py
- api.ts
- CategoryFactory
- BusinessException
- dependencies
- Page
- orders/views.py
- Payment
- PaymentService
- UserFactory
- backend/tests/test_services.py
- test_e2e_journeys.py
- EmailChangeRequest
- DummyGateway
- SiteContent
- media_libm/views.py
- notifications/views.py
- CMSService
- AdminInventoryViewSet
- ProductOptionService
- UserService
- NotificationService
- Category
- UserNotificationPreference
- Notification
- WishlistViewSet
- CategoryRepository
- Inventory
- MediaFactory
- OrderService
- package.json
- celery.py
- app/layout.tsx
- AdminCategoryViewSet
- notifications/admin.py
- @hookform/resolvers
- IsTokenValid
- AuditLogMiddleware
- notifications/services.py
- app/products/page.tsx
- AuthenticationConfig
- .create_verification_token
- CartConfig
- CategoriesConfig
- TestAdminAPI
- CmsConfig
- CommonConfig
- CoreConfig
- StandardPagination
- BaseAPIView
- CouponsConfig
- InventoryConfig
- main
- MediaConfig
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
- How to Run Instructions

## God Nodes (most connected - your core abstractions)
1. `BusinessException` - 107 edges
2. `ProductFactory` - 47 edges
3. `UserFactory` - 45 edges
4. `BaseModel` - 42 edges
5. `VariantFactory` - 38 edges
6. `cn()` - 36 edges
7. `InventoryService` - 32 edges
8. `Order` - 31 edges
9. `AuthService` - 31 edges
10. `Variant` - 31 edges

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

## Communities (228 total, 79 thin omitted)

### Community 0 - "Product"
Cohesion: 0.05
Nodes (25): action, ProductAdmin, register, Meta, Product, BaseModel, Review, Status (+17 more)

### Community 1 - "Collection"
Cohesion: 0.06
Nodes (29): CollectionAdmin, CollectionProductInline, register, Collection, CollectionProduct, Meta, CollectionRepository, atomic (+21 more)

### Community 2 - "VariantFactory"
Cohesion: 0.06
Nodes (27): Cart, CartItem, Meta, CartItemRepository, CartRepository, CartSelector, CartService, atomic (+19 more)

### Community 3 - "UserFactory"
Cohesion: 0.07
Nodes (27): django_db, patch, TestSignals, Meta, UserFactory, CouponAdmin, CouponUsageAdmin, register (+19 more)

### Community 4 - "Variant"
Cohesion: 0.07
Nodes (25): Command, register, VariantAdmin, VariantOptionInline, Availability, Meta, BaseModel, Status (+17 more)

### Community 5 - "AnalyticsService"
Cohesion: 0.07
Nodes (24): register, TrackedEventAdmin, AnalyticsConfig, AppConfig, cart_changed_handler(), order_placed_handler(), Meta, TrackedEvent (+16 more)

### Community 6 - "cn"
Cohesion: 0.10
Nodes (29): FilterFacet, POPULAR_KEYWORDS, PRESET_COLORS, ProductItem, SearchContent(), SORT_OPTIONS, DropdownMenu(), DropdownMenuCheckboxItem() (+21 more)

### Community 7 - "Media"
Cohesion: 0.11
Nodes (13): MediaAdmin, register, Media, MediaType, Meta, MediaRepository, MediaSelector, MediaService (+5 more)

### Community 8 - "EmailVerificationToken"
Cohesion: 0.13
Nodes (18): EmailVerificationTokenAdmin, PasswordResetTokenAdmin, EmailVerificationToken, Meta, PasswordResetToken, Optional DB-backed password-reset token (complement to Django's…, TokenRepository, TokenSelector (+10 more)

### Community 9 - "common/exceptions.py"
Cohesion: 0.15
Nodes (9): OptionValueInline, ProductOptionAdmin, register, Meta, OptionValue, ProductOption, OptionValueRepository, OptionValueSelector (+1 more)

### Community 10 - "profile/page.tsx"
Cohesion: 0.14
Nodes (19): STATUS_TABS, getStepIndex(), getUserIdFromToken(), ORDER_STEPS, ProfilePage(), Dialog(), DialogContent(), DialogDescription() (+11 more)

### Community 11 - "Order"
Cohesion: 0.15
Nodes (14): OrderAdmin, OrderItemInline, register, StatusHistoryInline, Meta, Order, OrderItem, OrderSequence (+6 more)

### Community 12 - "OrderFactory"
Cohesion: 0.09
Nodes (16): Meta, OrderFactory, OrderItemFactory, DjangoModelFactory, django_db, TestAdminEndpoints, TestUserEndpoints, TestStatusTransitions (+8 more)

### Community 13 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 14 - "ProductOptionFactory"
Cohesion: 0.13
Nodes (13): Meta, OptionValueFactory, ProductOptionFactory, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+5 more)

### Community 15 - "notifications/tests/test_signals.py"
Cohesion: 0.15
Nodes (13): Meta, NotificationFactory, NotificationTemplateFactory, PreferenceFactory, DjangoModelFactory, django_db, TestUserEndpoints, django_db (+5 more)

### Community 16 - "PageFactory"
Cohesion: 0.15
Nodes (10): Meta, PageFactory, DjangoModelFactory, SiteContentFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 17 - "authenticate"
Cohesion: 0.12
Nodes (8): authenticate(), create_order(), TestAdminJourneyAndTasks, TestAuthenticationAndOnboarding, TestCustomerCommerceJourney, TestUserIsolationAndRBAC, parametrize, xfail

### Community 18 - "BaseModel"
Cohesion: 0.13
Nodes (12): UserManager, BaseModel, Meta, Ultimate base for all domain entities., SoftDeleteManager, SoftDeleteModel, TimestampedModel, UUIDPrimaryKeyMixin (+4 more)

### Community 19 - "ProductFactory"
Cohesion: 0.11
Nodes (10): Meta, ProductFactory, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db, TestSearchAPI (+2 more)

### Community 20 - "auth/page.tsx"
Cohesion: 0.11
Nodes (20): AuthPage(), ForgotPasswordForm, forgotPasswordSchema, getApiErrorMessage(), identifierValidator, LoginForm, loginSchema, passwordRegisterSchema (+12 more)

### Community 21 - "AuthService"
Cohesion: 0.11
Nodes (14): APIView, LoginSerializer, PasswordResetRequestSerializer, VerifyEmailSerializer, AuthService, CustomTokenRefreshView, LoginView, LogoutView (+6 more)

### Community 22 - "CategorySelector"
Cohesion: 0.15
Nodes (9): CategorySelector, Return active root nodes with their active descendants as a tree., CategoryTreeSerializer, Output for nested tree representation., PublicCategoryViewSet, action, Return active categories as a nested tree., Return flat list of active categories with parent references. (+1 more)

### Community 23 - "cms/views.py"
Cohesion: 0.15
Nodes (8): PageSerializer, PageUpdateSerializer, SiteContentSerializer, AdminPageViewSet, AdminSiteContentViewSet, PublicPageViewSet, PublicSiteContentViewSet, action

### Community 24 - "SearchService"
Cohesion: 0.15
Nodes (8): Build available filters based on the current product queryset. Returns a dict…, SearchSelector, SearchSerializer, SearchService, django_db, TestSearchService, action, SearchViewSet

### Community 26 - "User"
Cohesion: 0.13
Nodes (8): AbstractBaseUser, UserRepository, UserSelector, User, UserRepository, UserSelector, PermissionsMixin, QuerySet

### Community 27 - "OptionValueService"
Cohesion: 0.18
Nodes (7): OptionValueSerializer, ProductOptionDetailSerializer, ProductOptionSerializer, OptionValueService, AdminProductOptionViewSet, PublicProductOptionViewSet, action

### Community 28 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 29 - "authentication/serializers.py"
Cohesion: 0.18
Nodes (10): ChangePasswordSerializer, PasswordResetConfirmSerializer, RegisterSerializer, TokenRefreshSerializer, PasswordValidator, ChangePasswordView, test_missing_digit(), test_missing_uppercase() (+2 more)

### Community 30 - "WishlistService"
Cohesion: 0.18
Nodes (7): WishlistService, Meta, DjangoModelFactory, WishlistFactory, WishlistItemFactory, django_db, TestWishlistService

### Community 31 - "CartViewSet"
Cohesion: 0.22
Nodes (8): ApplyCouponSerializer, CartAddItemSerializer, CartMergeSerializer, CartUpdateQuantitySerializer, CartViewSet, action, Merge guest cart into user cart (called after login). Must be authenticated., Ensure a session key exists for guest users.

### Community 32 - "inventory/tests/factories.py"
Cohesion: 0.22
Nodes (8): InventoryAdmin, register, ReservationAdmin, Inventory, Meta, Reservation, Status, InventorySelector

### Community 33 - "InventoryFactory"
Cohesion: 0.15
Nodes (9): InventoryFactory, Meta, DjangoModelFactory, post_generation, VariantFactory, django_db, TestAdminAPI, django_db (+1 more)

### Community 34 - "Wishlist"
Cohesion: 0.20
Nodes (9): register, WishlistAdmin, WishlistItemInline, Meta, Wishlist, WishlistItem, WishlistRepository, WishlistSelector (+1 more)

### Community 35 - "admin/products/page.tsx"
Cohesion: 0.15
Nodes (8): OptionDef, VariantItem, MediaUploader(), MediaUploaderProps, Input(), CMSPage, ProductReview, SiteContentData

### Community 36 - "InventoryService"
Cohesion: 0.25
Nodes (7): atomic, Row lock using select_for_update. Must be called inside a transaction., InventoryService, Called by Celery Beat every 5 minutes (crontab minute=*/5). Finds all ACTIVE…, Add or remove available quantity (admin action). Supports variant_id or…, Inventory, Reservation

### Community 37 - "devDependencies"
Cohesion: 0.11
Nodes (19): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 38 - "users/views.py"
Cohesion: 0.21
Nodes (10): IsSelf, Object-level permission to only allow users to edit their own profile., AdminUserSerializer, AdminUserUpdateSerializer, AssignGroupsSerializer, ChangeEmailSerializer, ConfirmEmailSerializer, UpdateProfileSerializer (+2 more)

### Community 39 - "api.ts"
Cohesion: 0.16
Nodes (5): NAV_ITEMS, CollectionsSection(), api, WishlistItem, WishlistStore

### Community 40 - "CategoryFactory"
Cohesion: 0.21
Nodes (8): CategoryService, CategoryFactory, Meta, DjangoModelFactory, django_db, TestPublicAPI, django_db, TestCategoryService

### Community 41 - "BusinessException"
Cohesion: 0.20
Nodes (6): APIException, InvalidTokenException, TokenExpiredException, BusinessException, UserValidator, User

### Community 42 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, class-variance-authority, dependencies, axios, class-variance-authority, lucide-react, next, next-themes (+9 more)

### Community 43 - "Page"
Cohesion: 0.25
Nodes (5): Page, Status, PageRepository, PageSelector, SiteContentSelector

### Community 44 - "orders/views.py"
Cohesion: 0.21
Nodes (7): CreateOrderSerializer, Meta, OrderListSerializer, StatusTransitionSerializer, AdminOrderViewSet, action, UserOrderViewSet

### Community 45 - "Payment"
Cohesion: 0.24
Nodes (7): PaymentAdmin, register, Meta, Payment, Status, PaymentRepository, PaymentSelector

### Community 46 - "PaymentService"
Cohesion: 0.21
Nodes (6): CallbackSerializer, InitiatePaymentSerializer, PaymentService, CallbackViewSet, PaymentViewSet, action

### Community 47 - "UserFactory"
Cohesion: 0.23
Nodes (7): GroupFactory, Meta, UserFactory, django_db, TestUserEndpoints, django_db, TestUserService

### Community 48 - "backend/tests/test_services.py"
Cohesion: 0.20
Nodes (6): Meta, UserFactory, django_db, TestAuthEndpoints, django_db, TestAuthService

### Community 49 - "test_e2e_journeys.py"
Cohesion: 0.17
Nodes (11): admin(), catalog(), client(), customer(), customer_b(), End-to-end API journeys for the Luxe shop. Run with:: pytest -q…, Create a verified standard user without relying on the broken manager., A publicly purchasable product, one variant, and in-stock inventory. (+3 more)

### Community 50 - "EmailChangeRequest"
Cohesion: 0.18
Nodes (7): EmailChangeRequestAdmin, register, EmailChangeRequest, Meta, shared_task, Async email-change confirmation — offloaded via transaction.on_commit in…, send_email_change_verification()

### Community 51 - "DummyGateway"
Cohesion: 0.16
Nodes (6): ABC, BasePaymentGateway, Validate callback payload and return: - 'gateway_reference': str - 'status':…, Return a dict with at least: - 'gateway_reference': str - 'status': str…, DummyGateway, BasePaymentGateway

### Community 52 - "SiteContent"
Cohesion: 0.19
Nodes (7): PageAdmin, register, SiteContentAdmin, Meta, Key-value store for global site sections. Expected keys: 'homepage', 'header',…, SiteContent, SiteContentRepository

### Community 53 - "media_libm/views.py"
Cohesion: 0.30
Nodes (6): MediaUpdateSerializer, MediaUploadSerializer, ReorderSerializer, AdminMediaViewSet, PublicMediaViewSet, action

### Community 54 - "notifications/views.py"
Cohesion: 0.23
Nodes (6): MarkReadSerializer, NotificationListSerializer, PreferenceSerializer, AdminNotificationViewSet, action, UserNotificationViewSet

### Community 56 - "AdminInventoryViewSet"
Cohesion: 0.31
Nodes (6): AdjustStockSerializer, InventorySerializer, ReservationExpirationSerializer, SafetyStockSerializer, AdminInventoryViewSet, action

### Community 57 - "ProductOptionService"
Cohesion: 0.23
Nodes (3): ProductOptionRepository, ProductOptionService, Ensure each assignment has a valid option_id and value_id, and the value…

### Community 58 - "UserService"
Cohesion: 0.26
Nodes (3): UserService, AdminUserViewSet, action

### Community 59 - "NotificationService"
Cohesion: 0.24
Nodes (5): NotificationsConfig, AppConfig, order_status_changed_handler(), NotificationService, Create an in-app notification and conditionally send an email.

### Community 60 - "Category"
Cohesion: 0.20
Nodes (7): CategoryAdmin, register, Category, Meta, MPTTMeta, MPTTModel, MPTTModelAdmin

### Community 61 - "UserNotificationPreference"
Cohesion: 0.24
Nodes (4): UserNotificationPreference, PreferenceRepository, TemplateRepository, PreferenceSelector

### Community 62 - "Notification"
Cohesion: 0.19
Nodes (4): Meta, Notification, NotificationRepository, NotificationSelector

### Community 63 - "WishlistViewSet"
Cohesion: 0.31
Nodes (4): WishlistAddItemSerializer, WishlistRemoveItemSerializer, action, WishlistViewSet

### Community 65 - "Inventory"
Cohesion: 0.29
Nodes (4): InventoryRepository, Inventory, Reservation, ReservationRepository

### Community 66 - "MediaFactory"
Cohesion: 0.27
Nodes (6): MediaFactory, Meta, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI

### Community 67 - "OrderService"
Cohesion: 0.36
Nodes (3): OrderService, atomic, Return stock for all items if order is cancelled before shipping.

### Community 68 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 69 - "celery.py"
Cohesion: 0.29
Nodes (5): expire_reservations_task(), shared_task, Celery Beat periodic task — runs every 5 minutes via crontab(minute="*/5").…, Alias for expire_reservations_task — kept for spec compatibility. Directly…, release_expired_reservations()

### Community 70 - "app/layout.tsx"
Cohesion: 0.32
Nodes (4): metadata, vazirmatn, Footer(), Toaster()

### Community 71 - "AdminCategoryViewSet"
Cohesion: 0.43
Nodes (3): CategoryCreateSerializer, CategoryUpdateSerializer, AdminCategoryViewSet

### Community 72 - "notifications/admin.py"
Cohesion: 0.60
Nodes (4): NotificationAdmin, NotificationTemplateAdmin, register, UserNotificationPreferenceAdmin

## Knowledge Gaps
- **167 isolated node(s):** `ProductPositionSerializer`, `Meta`, `ProductCardProps`, `Migration`, `Migration` (+162 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **79 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BusinessException` connect `BusinessException` to `Product`, `Collection`, `VariantFactory`, `UserFactory`, `Variant`, `AnalyticsService`, `Media`, `common/exceptions.py`, `Order`, `ProductOptionFactory`, `notifications/tests/test_signals.py`, `PageFactory`, `AuthService`, `CategorySelector`, `OptionValueService`, `authentication/serializers.py`, `WishlistService`, `inventory/tests/factories.py`, `Wishlist`, `InventoryService`, `CategoryFactory`, `Page`, `Payment`, `PaymentService`, `UserFactory`, `backend/tests/test_services.py`, `CMSService`, `ProductOptionService`, `UserService`, `UserNotificationPreference`, `Notification`, `CategoryRepository`, `OrderService`, `.create_verification_token`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Why does `BaseModel` connect `BaseModel` to `inventory/tests/factories.py`, `Collection`, `VariantFactory`, `UserFactory`, `Wishlist`, `AnalyticsService`, `Media`, `common/exceptions.py`, `Page`, `Order`, `Payment`, `SiteContent`, `User`, `Category`, `Notification`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `AuthService` connect `AuthService` to `EmailVerificationToken`, `backend/tests/test_services.py`, `.create_verification_token`, `authentication/serializers.py`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `BusinessException` (e.g. with `.change_password()` and `.login_user()`) actually correct?**
  _`BusinessException` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ProductFactory` (e.g. with `TestPublicAPI` and `TestProductService`) actually correct?**
  _`ProductFactory` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `VariantFactory` (e.g. with `TestAdminAPI` and `TestPublicAPI`) actually correct?**
  _`VariantFactory` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ProductPositionSerializer`, `Meta`, `ProductCardProps` to the rest of the system?**
  _167 weakly-connected nodes found - possible documentation gaps or missing edges._