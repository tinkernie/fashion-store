# Graph Report - fashion-store  (2026-08-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1946 nodes · 4064 edges · 219 communities (138 shown, 81 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 296 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `10122b50`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- common/exceptions.py
- Product
- BusinessException
- CategoryFactory
- UserFactory
- Variant
- UserService
- AnalyticsService
- button.tsx
- Wishlist
- ProductFactory
- cn
- ProductOption
- AuthService
- compilerOptions
- EmailVerificationToken
- BaseModel
- Cart
- PageFactory
- Media
- notifications/tests/test_services.py
- cms/views.py
- checkout/page.tsx
- OptionValueService
- components.json
- auth/page.tsx
- authentication/serializers.py
- CartViewSet
- notifications/models.py
- OrderFactory
- ProductOptionFactory
- authenticate
- api.ts
- devDependencies
- VariantFactory
- User
- dependencies
- orders/tests/test_services.py
- common/models.py
- OrderService
- CartService
- Page
- orders/views.py
- Payment
- payments/views.py
- backend/tests/test_services.py
- test_e2e_journeys.py
- DummyGateway
- SiteContent
- MediaService
- media_libm/views.py
- notifications/views.py
- CMSService
- NotificationService
- input.tsx
- MediaFactory
- package.json
- app/layout.tsx
- Notification
- orders/tests/test_api.py
- UserSelector
- order_status_changed_handler
- .create_verification_token
- UserManager
- notifications/admin.py
- TestAuthenticationAndOnboarding
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
- @hookform/resolvers
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
8. `AuthService` - 31 edges
9. `Order` - 31 edges
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
- `OptionValueInline` --uses--> `OptionValue`  [INFERRED]
  backend/product_options/admin.py → backend/product_options/models.py

## Import Cycles
- None detected.

## Communities (219 total, 81 thin omitted)

### Community 0 - "common/exceptions.py"
Cohesion: 0.05
Nodes (39): atomic, InventoryAdmin, register, ReservationAdmin, Inventory, Meta, Reservation, Status (+31 more)

### Community 1 - "Product"
Cohesion: 0.05
Nodes (25): action, ProductAdmin, register, Meta, Product, BaseModel, Review, Status (+17 more)

### Community 2 - "BusinessException"
Cohesion: 0.05
Nodes (33): APIException, InvalidTokenException, TokenExpiredException, BusinessException, CollectionAdmin, CollectionProductInline, register, Collection (+25 more)

### Community 3 - "CategoryFactory"
Cohesion: 0.06
Nodes (29): CategoryAdmin, register, Category, Meta, MPTTMeta, CategoryRepository, CategorySelector, Return active root nodes with their active descendants as a tree. (+21 more)

### Community 4 - "UserFactory"
Cohesion: 0.07
Nodes (27): django_db, patch, TestSignals, Meta, UserFactory, CouponAdmin, CouponUsageAdmin, register (+19 more)

### Community 5 - "Variant"
Cohesion: 0.07
Nodes (26): Command, register, VariantAdmin, VariantOptionInline, Availability, Meta, BaseModel, Status (+18 more)

### Community 6 - "UserService"
Cohesion: 0.06
Nodes (25): IsSelf, Object-level permission to only allow users to edit their own profile., AdminUserSerializer, AdminUserUpdateSerializer, AssignGroupsSerializer, ChangeEmailSerializer, ConfirmEmailSerializer, UpdateProfileSerializer (+17 more)

### Community 7 - "AnalyticsService"
Cohesion: 0.07
Nodes (24): register, TrackedEventAdmin, AnalyticsConfig, AppConfig, cart_changed_handler(), order_placed_handler(), Meta, TrackedEvent (+16 more)

### Community 8 - "button.tsx"
Cohesion: 0.08
Nodes (18): STATUS_TABS, OptionDef, VariantItem, MediaUploaderProps, Button(), buttonVariants, Dialog(), DialogContent() (+10 more)

### Community 9 - "Wishlist"
Cohesion: 0.08
Nodes (20): register, WishlistAdmin, WishlistItemInline, Meta, Wishlist, WishlistItem, WishlistRepository, WishlistSelector (+12 more)

### Community 10 - "ProductFactory"
Cohesion: 0.07
Nodes (18): Meta, ProductFactory, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, Build available filters based on the current product queryset. Returns a dict…, SearchSelector (+10 more)

### Community 11 - "cn"
Cohesion: 0.09
Nodes (29): metadata, FilterFacet, POPULAR_KEYWORDS, PRESET_COLORS, ProductItem, SearchPage(), SORT_OPTIONS, DropdownMenu() (+21 more)

### Community 12 - "ProductOption"
Cohesion: 0.13
Nodes (10): OptionValueInline, ProductOptionAdmin, register, Meta, OptionValue, ProductOption, OptionValueRepository, ProductOptionRepository (+2 more)

### Community 13 - "AuthService"
Cohesion: 0.11
Nodes (14): APIView, LoginSerializer, PasswordResetRequestSerializer, VerifyEmailSerializer, AuthService, CustomTokenRefreshView, LoginView, LogoutView (+6 more)

### Community 14 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 15 - "EmailVerificationToken"
Cohesion: 0.13
Nodes (18): EmailVerificationTokenAdmin, PasswordResetTokenAdmin, EmailVerificationToken, Meta, PasswordResetToken, Optional DB-backed password-reset token (complement to Django's…, TokenRepository, TokenSelector (+10 more)

### Community 16 - "BaseModel"
Cohesion: 0.16
Nodes (16): BaseModel, Ultimate base for all domain entities., OrderAdmin, OrderItemInline, register, StatusHistoryInline, Meta, Order (+8 more)

### Community 17 - "Cart"
Cohesion: 0.16
Nodes (7): Cart, CartItem, Meta, CartItemRepository, CartRepository, CartSelector, CartItem

### Community 18 - "PageFactory"
Cohesion: 0.15
Nodes (10): Meta, PageFactory, DjangoModelFactory, SiteContentFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 19 - "Media"
Cohesion: 0.17
Nodes (9): MediaAdmin, register, Media, MediaType, Meta, MediaRepository, MediaSelector, generate_thumbnails() (+1 more)

### Community 20 - "notifications/tests/test_services.py"
Cohesion: 0.15
Nodes (13): Meta, NotificationFactory, NotificationTemplateFactory, PreferenceFactory, DjangoModelFactory, django_db, TestUserEndpoints, django_db (+5 more)

### Community 21 - "cms/views.py"
Cohesion: 0.15
Nodes (8): PageSerializer, PageUpdateSerializer, SiteContentSerializer, AdminPageViewSet, AdminSiteContentViewSet, PublicPageViewSet, PublicSiteContentViewSet, action

### Community 22 - "checkout/page.tsx"
Cohesion: 0.13
Nodes (18): AuthPage(), CheckoutForm, CheckoutPage(), checkoutSchema, PRESET_COLORS, ProductDetailPage(), ProductOption, ProductOptionValue (+10 more)

### Community 23 - "OptionValueService"
Cohesion: 0.20
Nodes (8): OptionValueSerializer, ProductOptionDetailSerializer, ProductOptionSerializer, OptionValueService, ProductOptionService, AdminProductOptionViewSet, PublicProductOptionViewSet, action

### Community 24 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 25 - "auth/page.tsx"
Cohesion: 0.14
Nodes (19): ForgotPasswordForm, forgotPasswordSchema, identifierValidator, LoginForm, loginSchema, passwordRegisterSchema, RegisterForm, registerSchema (+11 more)

### Community 26 - "authentication/serializers.py"
Cohesion: 0.18
Nodes (10): ChangePasswordSerializer, PasswordResetConfirmSerializer, RegisterSerializer, TokenRefreshSerializer, PasswordValidator, ChangePasswordView, test_missing_digit(), test_missing_uppercase() (+2 more)

### Community 27 - "CartViewSet"
Cohesion: 0.22
Nodes (8): ApplyCouponSerializer, CartAddItemSerializer, CartMergeSerializer, CartUpdateQuantitySerializer, CartViewSet, action, Merge guest cart into user cart (called after login). Must be authenticated., Ensure a session key exists for guest users.

### Community 28 - "notifications/models.py"
Cohesion: 0.18
Nodes (7): Meta, NotificationTemplate, UserNotificationPreference, TemplateRepository, PreferenceSelector, shared_task, send_notification_email()

### Community 29 - "OrderFactory"
Cohesion: 0.14
Nodes (12): Meta, OrderFactory, OrderItemFactory, DjangoModelFactory, Meta, PaymentFactory, DjangoModelFactory, django_db (+4 more)

### Community 30 - "ProductOptionFactory"
Cohesion: 0.19
Nodes (10): Meta, OptionValueFactory, ProductOptionFactory, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 31 - "authenticate"
Cohesion: 0.16
Nodes (7): authenticate(), create_order(), TestAdminJourneyAndTasks, TestCustomerCommerceJourney, TestUserIsolationAndRBAC, parametrize, xfail

### Community 32 - "api.ts"
Cohesion: 0.15
Nodes (4): CollectionsSection(), api, WishlistItem, WishlistStore

### Community 33 - "devDependencies"
Cohesion: 0.11
Nodes (19): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 34 - "VariantFactory"
Cohesion: 0.15
Nodes (9): django_db, TestGuestCartAPI, Meta, DjangoModelFactory, post_generation, VariantFactory, django_db, TestAdminAPI (+1 more)

### Community 35 - "User"
Cohesion: 0.16
Nodes (6): AbstractBaseUser, UserRepository, UserSelector, User, UserRepository, PermissionsMixin

### Community 36 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, class-variance-authority, dependencies, axios, class-variance-authority, lucide-react, next, next-themes (+9 more)

### Community 37 - "orders/tests/test_services.py"
Cohesion: 0.24
Nodes (10): CartFactory, CartItemFactory, Meta, DjangoModelFactory, django_db, patch, TestCartService, django_db (+2 more)

### Community 38 - "common/models.py"
Cohesion: 0.19
Nodes (9): Meta, SoftDeleteManager, SoftDeleteModel, TimestampedModel, UUIDPrimaryKeyMixin, EmailChangeRequestAdmin, register, EmailChangeRequest (+1 more)

### Community 39 - "OrderService"
Cohesion: 0.18
Nodes (4): OrderService, atomic, Return stock for all items if order is cancelled before shipping., TestStatusTransitions

### Community 40 - "CartService"
Cohesion: 0.29
Nodes (4): CartService, atomic, Merge guest cart into authenticated user's cart., Cart

### Community 41 - "Page"
Cohesion: 0.25
Nodes (5): Page, Status, PageRepository, PageSelector, SiteContentSelector

### Community 42 - "orders/views.py"
Cohesion: 0.21
Nodes (7): CreateOrderSerializer, Meta, OrderListSerializer, StatusTransitionSerializer, AdminOrderViewSet, action, UserOrderViewSet

### Community 43 - "Payment"
Cohesion: 0.17
Nodes (8): PaymentAdmin, register, Meta, Payment, Status, PaymentRepository, PaymentSelector, PaymentService

### Community 44 - "payments/views.py"
Cohesion: 0.31
Nodes (5): CallbackSerializer, InitiatePaymentSerializer, CallbackViewSet, PaymentViewSet, action

### Community 45 - "backend/tests/test_services.py"
Cohesion: 0.20
Nodes (6): Meta, UserFactory, django_db, TestAuthEndpoints, django_db, TestAuthService

### Community 46 - "test_e2e_journeys.py"
Cohesion: 0.17
Nodes (11): admin(), catalog(), client(), customer(), customer_b(), End-to-end API journeys for the Luxe shop. Run with:: pytest -q…, Create a verified standard user without relying on the broken manager., A publicly purchasable product, one variant, and in-stock inventory. (+3 more)

### Community 47 - "DummyGateway"
Cohesion: 0.16
Nodes (6): ABC, BasePaymentGateway, Validate callback payload and return: - 'gateway_reference': str - 'status':…, Return a dict with at least: - 'gateway_reference': str - 'status': str…, DummyGateway, BasePaymentGateway

### Community 48 - "SiteContent"
Cohesion: 0.19
Nodes (7): PageAdmin, register, SiteContentAdmin, Meta, Key-value store for global site sections. Expected keys: 'homepage', 'header',…, SiteContent, SiteContentRepository

### Community 49 - "MediaService"
Cohesion: 0.23
Nodes (4): MediaService, Reorder media_libm items for a given object to match the order of IDs., django_db, TestMediaService

### Community 50 - "media_libm/views.py"
Cohesion: 0.30
Nodes (6): MediaUpdateSerializer, MediaUploadSerializer, ReorderSerializer, AdminMediaViewSet, PublicMediaViewSet, action

### Community 51 - "notifications/views.py"
Cohesion: 0.23
Nodes (6): MarkReadSerializer, NotificationListSerializer, PreferenceSerializer, AdminNotificationViewSet, action, UserNotificationViewSet

### Community 53 - "NotificationService"
Cohesion: 0.31
Nodes (3): PreferenceRepository, NotificationService, Create an in-app notification and conditionally send an email.

### Community 55 - "MediaFactory"
Cohesion: 0.28
Nodes (6): MediaFactory, Meta, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI

### Community 56 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 57 - "app/layout.tsx"
Cohesion: 0.28
Nodes (5): metadata, vazirmatn, LayoutShell(), Navbar(), Toaster()

### Community 59 - "orders/tests/test_api.py"
Cohesion: 0.29
Nodes (3): django_db, TestAdminEndpoints, TestUserEndpoints

### Community 61 - "order_status_changed_handler"
Cohesion: 0.40
Nodes (3): NotificationsConfig, AppConfig, order_status_changed_handler()

### Community 64 - "notifications/admin.py"
Cohesion: 0.60
Nodes (4): NotificationAdmin, NotificationTemplateAdmin, register, UserNotificationPreferenceAdmin

## Knowledge Gaps
- **172 isolated node(s):** `Meta`, `Migration`, `Migration`, `Migration`, `Migration` (+167 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **81 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BusinessException` connect `BusinessException` to `common/exceptions.py`, `Product`, `CategoryFactory`, `UserFactory`, `Variant`, `UserService`, `AnalyticsService`, `Wishlist`, `ProductOption`, `AuthService`, `BaseModel`, `Cart`, `PageFactory`, `Media`, `notifications/tests/test_services.py`, `OptionValueService`, `authentication/serializers.py`, `notifications/models.py`, `ProductOptionFactory`, `orders/tests/test_services.py`, `OrderService`, `Page`, `Payment`, `backend/tests/test_services.py`, `MediaService`, `CMSService`, `Notification`, `.create_verification_token`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `BaseModel` connect `BaseModel` to `common/exceptions.py`, `BusinessException`, `CategoryFactory`, `User`, `UserFactory`, `common/models.py`, `AnalyticsService`, `Page`, `Wishlist`, `Payment`, `ProductOption`, `SiteContent`, `Cart`, `Media`, `Notification`, `notifications/models.py`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `Product` connect `Product` to `CartService`, `Cart`, `Variant`, `test_e2e_journeys.py`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `BusinessException` (e.g. with `.change_password()` and `.login_user()`) actually correct?**
  _`BusinessException` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ProductFactory` (e.g. with `TestPublicAPI` and `TestProductService`) actually correct?**
  _`ProductFactory` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `VariantFactory` (e.g. with `TestAdminAPI` and `TestPublicAPI`) actually correct?**
  _`VariantFactory` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Meta`, `Migration`, `Migration` to the rest of the system?**
  _172 weakly-connected nodes found - possible documentation gaps or missing edges._