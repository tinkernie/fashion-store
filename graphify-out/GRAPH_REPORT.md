# Graph Report - fashion-store  (2026-08-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1950 nodes · 4057 edges · 221 communities (138 shown, 83 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 285 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c48a6b11`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- InventoryService
- Product
- Collection
- VariantFactory
- UserFactory
- Variant
- AnalyticsService
- UserService
- button.tsx
- Wishlist
- BaseModel
- cn
- test_e2e_journeys.py
- Media
- ProductOption
- AuthService
- compilerOptions
- EmailVerificationToken
- PageFactory
- Order
- Payment
- notifications/tests/test_services.py
- OptionValueService
- cms/views.py
- checkout/page.tsx
- PaymentService
- components.json
- auth/page.tsx
- CategoryFactory
- ProductFactory
- authentication/serializers.py
- CartViewSet
- notifications/models.py
- ProductOptionFactory
- api.ts
- BusinessException
- devDependencies
- OrderService
- dependencies
- CategorySelector
- categories/views.py
- Page
- orders/views.py
- SearchService
- media_libm/tests/test_services.py
- backend/tests/test_services.py
- DummyGateway
- SiteContent
- media_libm/views.py
- notifications/views.py
- CMSService
- Category
- NotificationService
- .create_order_from_cart
- input.tsx
- package.json
- app/layout.tsx
- Notification
- search/views.py
- order_status_changed_handler
- .create_verification_token
- notifications/admin.py
- IsTokenValid
- .flat
- AuditLogMiddleware
- NotificationSelector
- TestProductOptionService
- TestPublicAPI
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
- TestAdminAPI
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
- `CartService` --uses--> `Product`  [INFERRED]
  backend/cart/services.py → backend/products/models.py
- `Command` --uses--> `Product`  [INFERRED]
  backend/common/management/commands/seed_data.py → backend/products/models.py
- `ProductService` --uses--> `CategorySelector`  [INFERRED]
  backend/products/services.py → backend/categories/selectors.py
- `TestProductService` --uses--> `ProductFactory`  [INFERRED]
  backend/products/tests/test_services.py → backend/products/tests/factories.py
- `admin()` --calls--> `User`  [INFERRED]
  backend/tests/test_e2e_journeys.py → backend/common/models.py

## Import Cycles
- None detected.

## Communities (221 total, 83 thin omitted)

### Community 0 - "InventoryService"
Cohesion: 0.05
Nodes (39): atomic, InventoryAdmin, register, ReservationAdmin, Inventory, Meta, Reservation, Status (+31 more)

### Community 1 - "Product"
Cohesion: 0.05
Nodes (24): ProductAdmin, register, Meta, Product, BaseModel, Review, Status, ProductRepository (+16 more)

### Community 2 - "Collection"
Cohesion: 0.06
Nodes (29): CollectionAdmin, CollectionProductInline, register, Collection, CollectionProduct, Meta, CollectionRepository, atomic (+21 more)

### Community 3 - "VariantFactory"
Cohesion: 0.06
Nodes (27): Cart, CartItem, Meta, CartItemRepository, CartRepository, CartSelector, CartService, atomic (+19 more)

### Community 4 - "UserFactory"
Cohesion: 0.07
Nodes (27): django_db, patch, TestSignals, Meta, UserFactory, CouponAdmin, CouponUsageAdmin, register (+19 more)

### Community 5 - "Variant"
Cohesion: 0.07
Nodes (26): Command, register, VariantAdmin, VariantOptionInline, Availability, Meta, BaseModel, Status (+18 more)

### Community 6 - "AnalyticsService"
Cohesion: 0.07
Nodes (24): register, TrackedEventAdmin, AnalyticsConfig, AppConfig, cart_changed_handler(), order_placed_handler(), Meta, TrackedEvent (+16 more)

### Community 7 - "UserService"
Cohesion: 0.06
Nodes (23): action, IsSelf, Object-level permission to only allow users to edit their own profile., AdminUserSerializer, AdminUserUpdateSerializer, AssignGroupsSerializer, ChangeEmailSerializer, ConfirmEmailSerializer (+15 more)

### Community 8 - "button.tsx"
Cohesion: 0.08
Nodes (18): STATUS_TABS, OptionDef, VariantItem, MediaUploaderProps, Button(), buttonVariants, Dialog(), DialogContent() (+10 more)

### Community 9 - "Wishlist"
Cohesion: 0.08
Nodes (20): register, WishlistAdmin, WishlistItemInline, Meta, Wishlist, WishlistItem, WishlistRepository, WishlistSelector (+12 more)

### Community 10 - "BaseModel"
Cohesion: 0.07
Nodes (21): AbstractBaseUser, UserRepository, UserSelector, UserManager, BaseModel, Meta, Ultimate base for all domain entities., SoftDeleteManager (+13 more)

### Community 11 - "cn"
Cohesion: 0.09
Nodes (29): metadata, FilterFacet, POPULAR_KEYWORDS, PRESET_COLORS, ProductItem, SearchPage(), SORT_OPTIONS, DropdownMenu() (+21 more)

### Community 12 - "test_e2e_journeys.py"
Cohesion: 0.08
Nodes (19): admin(), authenticate(), catalog(), client(), create_order(), customer(), customer_b(), End-to-end API journeys for the Luxe shop. Run with:: pytest -q… (+11 more)

### Community 13 - "Media"
Cohesion: 0.13
Nodes (11): MediaAdmin, register, Media, MediaType, Meta, MediaRepository, MediaSelector, MediaService (+3 more)

### Community 14 - "ProductOption"
Cohesion: 0.11
Nodes (8): OptionValueInline, ProductOptionAdmin, register, Meta, OptionValue, ProductOption, OptionValueRepository, ProductOptionRepository

### Community 15 - "AuthService"
Cohesion: 0.11
Nodes (14): APIView, LoginSerializer, PasswordResetRequestSerializer, VerifyEmailSerializer, AuthService, CustomTokenRefreshView, LoginView, LogoutView (+6 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 17 - "EmailVerificationToken"
Cohesion: 0.13
Nodes (18): EmailVerificationTokenAdmin, PasswordResetTokenAdmin, EmailVerificationToken, Meta, PasswordResetToken, Optional DB-backed password-reset token (complement to Django's…, TokenRepository, TokenSelector (+10 more)

### Community 18 - "PageFactory"
Cohesion: 0.15
Nodes (10): Meta, PageFactory, DjangoModelFactory, SiteContentFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 19 - "Order"
Cohesion: 0.18
Nodes (13): OrderAdmin, OrderItemInline, register, StatusHistoryInline, Meta, Order, OrderItem, OrderSequence (+5 more)

### Community 20 - "Payment"
Cohesion: 0.14
Nodes (12): PaymentAdmin, register, Meta, Payment, Status, PaymentRepository, PaymentSelector, Meta (+4 more)

### Community 21 - "notifications/tests/test_services.py"
Cohesion: 0.15
Nodes (13): Meta, NotificationFactory, NotificationTemplateFactory, PreferenceFactory, DjangoModelFactory, django_db, TestUserEndpoints, django_db (+5 more)

### Community 22 - "OptionValueService"
Cohesion: 0.21
Nodes (10): OptionValueSelector, ProductOptionSelector, OptionValueSerializer, ProductOptionDetailSerializer, ProductOptionSerializer, OptionValueService, ProductOptionService, AdminProductOptionViewSet (+2 more)

### Community 23 - "cms/views.py"
Cohesion: 0.15
Nodes (8): PageSerializer, PageUpdateSerializer, SiteContentSerializer, AdminPageViewSet, AdminSiteContentViewSet, PublicPageViewSet, PublicSiteContentViewSet, action

### Community 24 - "checkout/page.tsx"
Cohesion: 0.13
Nodes (18): AuthPage(), CheckoutForm, CheckoutPage(), checkoutSchema, PRESET_COLORS, ProductDetailPage(), ProductOption, ProductOptionValue (+10 more)

### Community 25 - "PaymentService"
Cohesion: 0.14
Nodes (9): CallbackSerializer, InitiatePaymentSerializer, PaymentService, django_db, patch, TestPaymentService, CallbackViewSet, PaymentViewSet (+1 more)

### Community 26 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 27 - "auth/page.tsx"
Cohesion: 0.14
Nodes (19): ForgotPasswordForm, forgotPasswordSchema, identifierValidator, LoginForm, loginSchema, passwordRegisterSchema, RegisterForm, registerSchema (+11 more)

### Community 28 - "CategoryFactory"
Cohesion: 0.17
Nodes (9): CategoryService, CategoryFactory, Meta, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+1 more)

### Community 29 - "ProductFactory"
Cohesion: 0.13
Nodes (9): Meta, ProductFactory, DjangoModelFactory, django_db, TestPublicAPI, django_db, TestSearchAPI, django_db (+1 more)

### Community 30 - "authentication/serializers.py"
Cohesion: 0.18
Nodes (10): ChangePasswordSerializer, PasswordResetConfirmSerializer, RegisterSerializer, TokenRefreshSerializer, PasswordValidator, ChangePasswordView, test_missing_digit(), test_missing_uppercase() (+2 more)

### Community 31 - "CartViewSet"
Cohesion: 0.22
Nodes (8): ApplyCouponSerializer, CartAddItemSerializer, CartMergeSerializer, CartUpdateQuantitySerializer, CartViewSet, action, Merge guest cart into user cart (called after login). Must be authenticated., Ensure a session key exists for guest users.

### Community 32 - "notifications/models.py"
Cohesion: 0.18
Nodes (7): Meta, NotificationTemplate, UserNotificationPreference, TemplateRepository, PreferenceSelector, shared_task, send_notification_email()

### Community 33 - "ProductOptionFactory"
Cohesion: 0.19
Nodes (9): Meta, OptionValueFactory, ProductOptionFactory, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, TestOptionValueService (+1 more)

### Community 34 - "api.ts"
Cohesion: 0.15
Nodes (4): CollectionsSection(), api, WishlistItem, WishlistStore

### Community 35 - "BusinessException"
Cohesion: 0.19
Nodes (6): APIException, InvalidTokenException, TokenExpiredException, BusinessException, UserValidator, User

### Community 36 - "devDependencies"
Cohesion: 0.11
Nodes (19): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 37 - "OrderService"
Cohesion: 0.15
Nodes (9): OrderService, Meta, OrderFactory, OrderItemFactory, DjangoModelFactory, django_db, TestAdminEndpoints, TestUserEndpoints (+1 more)

### Community 38 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, class-variance-authority, dependencies, axios, class-variance-authority, lucide-react, next, next-themes (+9 more)

### Community 39 - "CategorySelector"
Cohesion: 0.20
Nodes (4): CategoryRepository, CategorySelector, Return active root nodes with their active descendants as a tree., Category

### Community 40 - "categories/views.py"
Cohesion: 0.23
Nodes (7): CategoryCreateSerializer, CategoryTreeSerializer, CategoryUpdateSerializer, Output for nested tree representation., AdminCategoryViewSet, PublicCategoryViewSet, Return active categories as a nested tree.

### Community 41 - "Page"
Cohesion: 0.25
Nodes (5): Page, Status, PageRepository, PageSelector, SiteContentSelector

### Community 42 - "orders/views.py"
Cohesion: 0.21
Nodes (7): CreateOrderSerializer, Meta, OrderListSerializer, StatusTransitionSerializer, AdminOrderViewSet, action, UserOrderViewSet

### Community 43 - "SearchService"
Cohesion: 0.21
Nodes (5): Build available filters based on the current product queryset. Returns a dict…, SearchSelector, SearchService, django_db, TestSearchService

### Community 44 - "media_libm/tests/test_services.py"
Cohesion: 0.19
Nodes (8): MediaFactory, Meta, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db, TestMediaService

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
Cohesion: 0.23
Nodes (6): MarkReadSerializer, NotificationListSerializer, PreferenceSerializer, AdminNotificationViewSet, action, UserNotificationViewSet

### Community 51 - "Category"
Cohesion: 0.17
Nodes (7): CategoryAdmin, register, Category, Meta, MPTTMeta, MPTTModel, MPTTModelAdmin

### Community 52 - "NotificationService"
Cohesion: 0.31
Nodes (3): PreferenceRepository, NotificationService, Create an in-app notification and conditionally send an email.

### Community 53 - ".create_order_from_cart"
Cohesion: 0.22
Nodes (3): atomic, atomic, Return stock for all items if order is cancelled before shipping.

### Community 55 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 56 - "app/layout.tsx"
Cohesion: 0.28
Nodes (5): metadata, vazirmatn, LayoutShell(), Navbar(), Toaster()

### Community 58 - "search/views.py"
Cohesion: 0.43
Nodes (3): SearchSerializer, action, SearchViewSet

### Community 59 - "order_status_changed_handler"
Cohesion: 0.40
Nodes (3): NotificationsConfig, AppConfig, order_status_changed_handler()

### Community 61 - "notifications/admin.py"
Cohesion: 0.60
Nodes (4): NotificationAdmin, NotificationTemplateAdmin, register, UserNotificationPreferenceAdmin

## Knowledge Gaps
- **175 isolated node(s):** `Meta`, `Migration`, `Migration`, `Migration`, `Migration` (+170 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **83 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BusinessException` connect `BusinessException` to `InventoryService`, `Product`, `Collection`, `VariantFactory`, `UserFactory`, `Variant`, `AnalyticsService`, `UserService`, `Wishlist`, `Media`, `ProductOption`, `AuthService`, `PageFactory`, `Order`, `Payment`, `notifications/tests/test_services.py`, `OptionValueService`, `PaymentService`, `CategoryFactory`, `authentication/serializers.py`, `notifications/models.py`, `ProductOptionFactory`, `OrderService`, `CategorySelector`, `Page`, `media_libm/tests/test_services.py`, `backend/tests/test_services.py`, `CMSService`, `Category`, `.create_order_from_cart`, `Notification`, `.create_verification_token`, `.update_category`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Why does `BaseModel` connect `BaseModel` to `InventoryService`, `notifications/models.py`, `Collection`, `VariantFactory`, `UserFactory`, `AnalyticsService`, `CategorySelector`, `Page`, `Wishlist`, `Media`, `ProductOption`, `SiteContent`, `Category`, `Order`, `Payment`, `Notification`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `UserFactory` connect `UserFactory` to `InventoryService`, `notifications/models.py`, `VariantFactory`, `OrderService`, `AnalyticsService`, `Wishlist`, `Payment`, `notifications/tests/test_services.py`, `PaymentService`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `BusinessException` (e.g. with `.change_password()` and `.login_user()`) actually correct?**
  _`BusinessException` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ProductFactory` (e.g. with `TestPublicAPI` and `TestProductService`) actually correct?**
  _`ProductFactory` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `VariantFactory` (e.g. with `TestAdminAPI` and `TestPublicAPI`) actually correct?**
  _`VariantFactory` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Meta`, `Migration`, `Migration` to the rest of the system?**
  _175 weakly-connected nodes found - possible documentation gaps or missing edges._