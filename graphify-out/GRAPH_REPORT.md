# Graph Report - fashion-store  (2026-08-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1948 nodes · 4047 edges · 221 communities (138 shown, 83 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 285 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cc3da2a6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- common/exceptions.py
- BusinessException
- Product
- VariantFactory
- CategoryFactory
- UserFactory
- Variant
- ProductOption
- AnalyticsService
- button.tsx
- Wishlist
- cn
- AuthService
- EmailVerificationToken
- compilerOptions
- BaseModel
- User
- PageFactory
- Media
- notifications/tests/test_services.py
- Payment
- ProductFactory
- cms/views.py
- SearchService
- checkout/page.tsx
- ProductOptionFactory
- components.json
- auth/page.tsx
- CartViewSet
- notifications/models.py
- authenticate
- api.ts
- devDependencies
- OrderFactory
- UserService
- dependencies
- authentication/serializers.py
- OrderService
- Page
- orders/views.py
- common/models.py
- DummyGateway
- SiteContent
- MediaService
- media_libm/views.py
- notifications/views.py
- UserFactory
- UserProfileViewSet
- CMSService
- NotificationService
- action
- payments/views.py
- test_e2e_journeys.py
- UserFactory
- input.tsx
- MediaFactory
- IsSelf
- package.json
- app/layout.tsx
- users/services.py
- Notification
- UserSelector
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
- clsx
- framer-motion
- eslint.config.mjs
- next.config.ts
- next-env.d.ts
- @hookform/resolvers
- class-variance-authority
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
7. `InventoryService` - 32 edges
8. `AuthService` - 31 edges
9. `Order` - 31 edges
10. `Variant` - 31 edges

## Surprising Connections (you probably didn't know these)
- `CollectionProductInline` --uses--> `CollectionProduct`  [INFERRED]
  backend/store_collections/admin.py → backend/store_collections/models.py
- `WishlistItemInline` --uses--> `WishlistItem`  [INFERRED]
  backend/wishlist/admin.py → backend/wishlist/models.py
- `RegisterSerializer` --uses--> `AuthService`  [INFERRED]
  backend/authentication/serializers.py → backend/authentication/services.py
- `AuthService` --uses--> `EmailVerificationToken`  [INFERRED]
  backend/authentication/services.py → backend/authentication/models.py
- `OrderItemInline` --uses--> `OrderItem`  [INFERRED]
  backend/orders/admin.py → backend/orders/models.py

## Import Cycles
- None detected.

## Communities (221 total, 83 thin omitted)

### Community 0 - "common/exceptions.py"
Cohesion: 0.05
Nodes (39): atomic, InventoryAdmin, register, ReservationAdmin, Inventory, Meta, Reservation, Status (+31 more)

### Community 1 - "BusinessException"
Cohesion: 0.05
Nodes (33): APIException, InvalidTokenException, TokenExpiredException, BusinessException, CollectionAdmin, CollectionProductInline, register, Collection (+25 more)

### Community 2 - "Product"
Cohesion: 0.05
Nodes (24): ProductAdmin, register, Meta, Product, BaseModel, Review, Status, ProductRepository (+16 more)

### Community 3 - "VariantFactory"
Cohesion: 0.06
Nodes (30): Cart, CartItem, Meta, CartItemRepository, CartRepository, CartSelector, CartService, atomic (+22 more)

### Community 4 - "CategoryFactory"
Cohesion: 0.06
Nodes (29): CategoryAdmin, register, Category, Meta, MPTTMeta, CategoryRepository, CategorySelector, Return active root nodes with their active descendants as a tree. (+21 more)

### Community 5 - "UserFactory"
Cohesion: 0.07
Nodes (27): django_db, patch, TestSignals, Meta, UserFactory, CouponAdmin, CouponUsageAdmin, register (+19 more)

### Community 6 - "Variant"
Cohesion: 0.07
Nodes (26): Command, register, VariantAdmin, VariantOptionInline, Availability, Meta, BaseModel, Status (+18 more)

### Community 7 - "ProductOption"
Cohesion: 0.08
Nodes (20): OptionValueInline, ProductOptionAdmin, register, Meta, OptionValue, ProductOption, OptionValueRepository, ProductOptionRepository (+12 more)

### Community 8 - "AnalyticsService"
Cohesion: 0.07
Nodes (24): register, TrackedEventAdmin, AnalyticsConfig, AppConfig, cart_changed_handler(), order_placed_handler(), Meta, TrackedEvent (+16 more)

### Community 9 - "button.tsx"
Cohesion: 0.08
Nodes (18): STATUS_TABS, OptionDef, VariantItem, MediaUploaderProps, Button(), buttonVariants, Dialog(), DialogContent() (+10 more)

### Community 10 - "Wishlist"
Cohesion: 0.08
Nodes (20): register, WishlistAdmin, WishlistItemInline, Meta, Wishlist, WishlistItem, WishlistRepository, WishlistSelector (+12 more)

### Community 11 - "cn"
Cohesion: 0.09
Nodes (29): metadata, FilterFacet, POPULAR_KEYWORDS, PRESET_COLORS, ProductItem, SearchPage(), SORT_OPTIONS, DropdownMenu() (+21 more)

### Community 12 - "AuthService"
Cohesion: 0.09
Nodes (15): APIView, LoginSerializer, PasswordResetRequestSerializer, VerifyEmailSerializer, AuthService, ChangePasswordView, CustomTokenRefreshView, LoginView (+7 more)

### Community 13 - "EmailVerificationToken"
Cohesion: 0.13
Nodes (18): EmailVerificationTokenAdmin, PasswordResetTokenAdmin, EmailVerificationToken, Meta, PasswordResetToken, Optional DB-backed password-reset token (complement to Django's…, TokenRepository, TokenSelector (+10 more)

### Community 14 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 15 - "BaseModel"
Cohesion: 0.16
Nodes (16): BaseModel, Ultimate base for all domain entities., OrderAdmin, OrderItemInline, register, StatusHistoryInline, Meta, Order (+8 more)

### Community 16 - "User"
Cohesion: 0.13
Nodes (9): AbstractBaseUser, UserRepository, User, EmailChangeRequest, Meta, UserRepository, UserSelector, PermissionsMixin (+1 more)

### Community 17 - "PageFactory"
Cohesion: 0.15
Nodes (10): Meta, PageFactory, DjangoModelFactory, SiteContentFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 18 - "Media"
Cohesion: 0.17
Nodes (9): MediaAdmin, register, Media, MediaType, Meta, MediaRepository, MediaSelector, generate_thumbnails() (+1 more)

### Community 19 - "notifications/tests/test_services.py"
Cohesion: 0.15
Nodes (13): Meta, NotificationFactory, NotificationTemplateFactory, PreferenceFactory, DjangoModelFactory, django_db, TestUserEndpoints, django_db (+5 more)

### Community 20 - "Payment"
Cohesion: 0.17
Nodes (8): PaymentAdmin, register, Meta, Payment, Status, PaymentRepository, PaymentSelector, PaymentService

### Community 21 - "ProductFactory"
Cohesion: 0.11
Nodes (10): Meta, ProductFactory, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db, TestSearchAPI (+2 more)

### Community 22 - "cms/views.py"
Cohesion: 0.15
Nodes (8): PageSerializer, PageUpdateSerializer, SiteContentSerializer, AdminPageViewSet, AdminSiteContentViewSet, PublicPageViewSet, PublicSiteContentViewSet, action

### Community 23 - "SearchService"
Cohesion: 0.15
Nodes (8): Build available filters based on the current product queryset. Returns a dict…, SearchSelector, SearchSerializer, SearchService, django_db, TestSearchService, action, SearchViewSet

### Community 24 - "checkout/page.tsx"
Cohesion: 0.13
Nodes (18): AuthPage(), CheckoutForm, CheckoutPage(), checkoutSchema, PRESET_COLORS, ProductDetailPage(), ProductOption, ProductOptionValue (+10 more)

### Community 25 - "ProductOptionFactory"
Cohesion: 0.16
Nodes (11): Meta, OptionValueFactory, ProductOptionFactory, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, TestOptionValueService (+3 more)

### Community 26 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 27 - "auth/page.tsx"
Cohesion: 0.14
Nodes (19): ForgotPasswordForm, forgotPasswordSchema, identifierValidator, LoginForm, loginSchema, passwordRegisterSchema, RegisterForm, registerSchema (+11 more)

### Community 28 - "CartViewSet"
Cohesion: 0.22
Nodes (8): ApplyCouponSerializer, CartAddItemSerializer, CartMergeSerializer, CartUpdateQuantitySerializer, CartViewSet, action, Merge guest cart into user cart (called after login). Must be authenticated., Ensure a session key exists for guest users.

### Community 29 - "notifications/models.py"
Cohesion: 0.18
Nodes (7): Meta, NotificationTemplate, UserNotificationPreference, TemplateRepository, PreferenceSelector, shared_task, send_notification_email()

### Community 30 - "authenticate"
Cohesion: 0.16
Nodes (7): authenticate(), create_order(), TestAdminJourneyAndTasks, TestCustomerCommerceJourney, TestUserIsolationAndRBAC, parametrize, xfail

### Community 31 - "api.ts"
Cohesion: 0.15
Nodes (4): CollectionsSection(), api, WishlistItem, WishlistStore

### Community 32 - "devDependencies"
Cohesion: 0.11
Nodes (19): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 33 - "OrderFactory"
Cohesion: 0.14
Nodes (12): Meta, OrderFactory, OrderItemFactory, DjangoModelFactory, Meta, PaymentFactory, DjangoModelFactory, django_db (+4 more)

### Community 34 - "UserService"
Cohesion: 0.24
Nodes (3): UserService, UserValidator, User

### Community 35 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, dependencies, axios, lucide-react, next, next-themes, radix-ui, react (+9 more)

### Community 36 - "authentication/serializers.py"
Cohesion: 0.24
Nodes (9): ChangePasswordSerializer, PasswordResetConfirmSerializer, RegisterSerializer, TokenRefreshSerializer, PasswordValidator, test_missing_digit(), test_missing_uppercase(), test_short_password() (+1 more)

### Community 37 - "OrderService"
Cohesion: 0.18
Nodes (4): OrderService, atomic, Return stock for all items if order is cancelled before shipping., TestStatusTransitions

### Community 38 - "Page"
Cohesion: 0.25
Nodes (5): Page, Status, PageRepository, PageSelector, SiteContentSelector

### Community 39 - "orders/views.py"
Cohesion: 0.21
Nodes (7): CreateOrderSerializer, Meta, OrderListSerializer, StatusTransitionSerializer, AdminOrderViewSet, action, UserOrderViewSet

### Community 40 - "common/models.py"
Cohesion: 0.20
Nodes (7): UserManager, Meta, SoftDeleteManager, SoftDeleteModel, TimestampedModel, UUIDPrimaryKeyMixin, BaseUserManager

### Community 41 - "DummyGateway"
Cohesion: 0.16
Nodes (6): ABC, BasePaymentGateway, Validate callback payload and return: - 'gateway_reference': str - 'status':…, Return a dict with at least: - 'gateway_reference': str - 'status': str…, DummyGateway, BasePaymentGateway

### Community 42 - "SiteContent"
Cohesion: 0.19
Nodes (7): PageAdmin, register, SiteContentAdmin, Meta, Key-value store for global site sections. Expected keys: 'homepage', 'header',…, SiteContent, SiteContentRepository

### Community 43 - "MediaService"
Cohesion: 0.23
Nodes (4): MediaService, Reorder media_libm items for a given object to match the order of IDs., django_db, TestMediaService

### Community 44 - "media_libm/views.py"
Cohesion: 0.30
Nodes (6): MediaUpdateSerializer, MediaUploadSerializer, ReorderSerializer, AdminMediaViewSet, PublicMediaViewSet, action

### Community 45 - "notifications/views.py"
Cohesion: 0.23
Nodes (6): MarkReadSerializer, NotificationListSerializer, PreferenceSerializer, AdminNotificationViewSet, action, UserNotificationViewSet

### Community 46 - "UserFactory"
Cohesion: 0.20
Nodes (6): Meta, UserFactory, django_db, TestAuthEndpoints, django_db, TestAuthService

### Community 47 - "UserProfileViewSet"
Cohesion: 0.15
Nodes (8): AdminUserSerializer, AdminUserUpdateSerializer, AssignGroupsSerializer, ChangeEmailSerializer, ConfirmEmailSerializer, UpdateProfileSerializer, UserProfileSerializer, UserProfileViewSet

### Community 49 - "NotificationService"
Cohesion: 0.31
Nodes (3): PreferenceRepository, NotificationService, Create an in-app notification and conditionally send an email.

### Community 51 - "payments/views.py"
Cohesion: 0.31
Nodes (5): CallbackSerializer, InitiatePaymentSerializer, CallbackViewSet, PaymentViewSet, action

### Community 52 - "test_e2e_journeys.py"
Cohesion: 0.29
Nodes (9): admin(), catalog(), client(), customer(), customer_b(), End-to-end API journeys for the Luxe shop. Run with:: pytest -q…, Create a verified standard user without relying on the broken manager., A publicly purchasable product, one variant, and in-stock inventory. (+1 more)

### Community 53 - "UserFactory"
Cohesion: 0.23
Nodes (7): GroupFactory, Meta, UserFactory, django_db, TestUserEndpoints, django_db, TestUserService

### Community 55 - "MediaFactory"
Cohesion: 0.28
Nodes (6): MediaFactory, Meta, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI

### Community 57 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 58 - "app/layout.tsx"
Cohesion: 0.28
Nodes (5): metadata, vazirmatn, LayoutShell(), Navbar(), Toaster()

### Community 59 - "users/services.py"
Cohesion: 0.33
Nodes (3): shared_task, Async email-change confirmation — offloaded via transaction.on_commit in…, send_email_change_verification()

### Community 61 - "UserSelector"
Cohesion: 0.33
Nodes (3): UserSelector, ResendVerificationSerializer, ResendVerificationView

### Community 62 - "order_status_changed_handler"
Cohesion: 0.40
Nodes (3): NotificationsConfig, AppConfig, order_status_changed_handler()

### Community 63 - "notifications/admin.py"
Cohesion: 0.60
Nodes (4): NotificationAdmin, NotificationTemplateAdmin, register, UserNotificationPreferenceAdmin

## Knowledge Gaps
- **175 isolated node(s):** `ProductPositionSerializer`, `Meta`, `Migration`, `Migration`, `Migration` (+170 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **83 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BusinessException` connect `BusinessException` to `common/exceptions.py`, `Product`, `VariantFactory`, `CategoryFactory`, `UserFactory`, `Variant`, `ProductOption`, `AnalyticsService`, `Wishlist`, `AuthService`, `EmailVerificationToken`, `BaseModel`, `PageFactory`, `Media`, `notifications/tests/test_services.py`, `Payment`, `notifications/models.py`, `UserService`, `OrderService`, `Page`, `MediaService`, `CMSService`, `UserFactory`, `Notification`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `BaseModel` connect `BaseModel` to `common/exceptions.py`, `BusinessException`, `VariantFactory`, `CategoryFactory`, `UserFactory`, `Page`, `ProductOption`, `AnalyticsService`, `common/models.py`, `SiteContent`, `Wishlist`, `User`, `Media`, `Payment`, `Notification`, `notifications/models.py`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `ProductFactory` connect `ProductFactory` to `common/exceptions.py`, `Product`, `Variant`, `ProductOption`, `Wishlist`, `SearchService`, `ProductOptionFactory`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `BusinessException` (e.g. with `.change_password()` and `.login_user()`) actually correct?**
  _`BusinessException` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ProductFactory` (e.g. with `TestPublicAPI` and `TestProductService`) actually correct?**
  _`ProductFactory` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `VariantFactory` (e.g. with `TestAdminAPI` and `TestPublicAPI`) actually correct?**
  _`VariantFactory` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ProductPositionSerializer`, `Meta`, `Migration` to the rest of the system?**
  _175 weakly-connected nodes found - possible documentation gaps or missing edges._