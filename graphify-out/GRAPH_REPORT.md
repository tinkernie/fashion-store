# Graph Report - fashion-store  (2026-08-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1943 nodes · 4050 edges · 218 communities (140 shown, 78 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 296 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d77c7a39`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Product
- Collection
- CategoryFactory
- BusinessException
- UserFactory
- Payment
- Media
- AnalyticsService
- Wishlist
- BaseModel
- cn
- test_e2e_journeys.py
- AuthService
- Variant
- api.ts
- button.tsx
- orders/services.py
- ProductOption
- compilerOptions
- EmailVerificationToken
- Cart
- ProductOptionService
- VariantService
- PageFactory
- notifications/tests/test_services.py
- auth/page.tsx
- cms/views.py
- InventoryService
- components.json
- dialog.tsx
- CartViewSet
- common/exceptions.py
- notifications/models.py
- ProductOptionFactory
- ProductFactory
- [id]/page.tsx
- devDependencies
- VariantFactory
- CartFactory
- .lock_inventory
- dependencies
- authentication/serializers.py
- CartService
- Page
- orders/views.py
- SearchService
- OrderFactory
- backend/tests/test_services.py
- SiteContent
- AdminInventoryViewSet
- notifications/views.py
- CMSService
- NotificationService
- Inventory
- Order
- package.json
- app/layout.tsx
- .create_verification_token
- celery.py
- Notification
- search/views.py
- order_status_changed_handler
- TestGuestCartAPI
- notifications/admin.py
- IsTokenValid
- AuditLogMiddleware
- NotificationSelector
- AuthenticationConfig
- CartConfig
- CategoriesConfig
- CmsConfig
- CommonConfig
- Command
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
9. `Variant` - 31 edges
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

## Communities (218 total, 78 thin omitted)

### Community 0 - "Product"
Cohesion: 0.05
Nodes (25): action, ProductAdmin, register, Meta, Product, BaseModel, Review, Status (+17 more)

### Community 1 - "Collection"
Cohesion: 0.06
Nodes (29): CollectionAdmin, CollectionProductInline, register, Collection, CollectionProduct, Meta, CollectionRepository, atomic (+21 more)

### Community 2 - "CategoryFactory"
Cohesion: 0.05
Nodes (30): CategoryAdmin, register, Category, Meta, MPTTMeta, CategoryRepository, CategorySelector, Return active root nodes with their active descendants as a tree. (+22 more)

### Community 3 - "BusinessException"
Cohesion: 0.06
Nodes (29): APIException, InvalidTokenException, TokenExpiredException, BusinessException, IsSelf, Object-level permission to only allow users to edit their own profile., AdminUserSerializer, AdminUserUpdateSerializer (+21 more)

### Community 4 - "UserFactory"
Cohesion: 0.07
Nodes (27): django_db, patch, TestSignals, Meta, UserFactory, CouponAdmin, CouponUsageAdmin, register (+19 more)

### Community 5 - "Payment"
Cohesion: 0.06
Nodes (27): ABC, PaymentAdmin, register, BasePaymentGateway, Validate callback payload and return: - 'gateway_reference': str - 'status':…, Return a dict with at least: - 'gateway_reference': str - 'status': str…, DummyGateway, Meta (+19 more)

### Community 6 - "Media"
Cohesion: 0.07
Nodes (25): MediaAdmin, register, Media, MediaType, Meta, MediaRepository, MediaSelector, MediaUpdateSerializer (+17 more)

### Community 7 - "AnalyticsService"
Cohesion: 0.07
Nodes (24): register, TrackedEventAdmin, AnalyticsConfig, AppConfig, cart_changed_handler(), order_placed_handler(), Meta, TrackedEvent (+16 more)

### Community 8 - "Wishlist"
Cohesion: 0.08
Nodes (20): register, WishlistAdmin, WishlistItemInline, Meta, Wishlist, WishlistItem, WishlistRepository, WishlistSelector (+12 more)

### Community 9 - "BaseModel"
Cohesion: 0.08
Nodes (20): AbstractBaseUser, UserRepository, UserManager, BaseModel, Meta, Ultimate base for all domain entities., SoftDeleteManager, SoftDeleteModel (+12 more)

### Community 10 - "cn"
Cohesion: 0.09
Nodes (29): metadata, FilterFacet, POPULAR_KEYWORDS, PRESET_COLORS, ProductItem, SearchPage(), SORT_OPTIONS, DropdownMenu() (+21 more)

### Community 11 - "test_e2e_journeys.py"
Cohesion: 0.08
Nodes (19): admin(), authenticate(), catalog(), client(), create_order(), customer(), customer_b(), End-to-end API journeys for the Luxe shop. Run with:: pytest -q… (+11 more)

### Community 12 - "AuthService"
Cohesion: 0.10
Nodes (15): APIView, LoginSerializer, PasswordResetRequestSerializer, VerifyEmailSerializer, AuthService, ChangePasswordView, CustomTokenRefreshView, LoginView (+7 more)

### Community 13 - "Variant"
Cohesion: 0.11
Nodes (13): register, VariantAdmin, VariantOptionInline, Availability, Meta, BaseModel, Status, Variant (+5 more)

### Community 14 - "api.ts"
Cohesion: 0.11
Nodes (6): NAV_ITEMS, CheckoutForm, checkoutSchema, CollectionsSection(), Input(), api

### Community 15 - "button.tsx"
Cohesion: 0.11
Nodes (7): MediaUploaderProps, Button(), buttonVariants, adminApi, CMSPage, ProductReview, SiteContentData

### Community 16 - "orders/services.py"
Cohesion: 0.20
Nodes (10): OrderAdmin, OrderItemInline, register, StatusHistoryInline, Meta, OrderItem, OrderSequence, OrderStatusHistory (+2 more)

### Community 17 - "ProductOption"
Cohesion: 0.14
Nodes (11): OptionValueInline, ProductOptionAdmin, register, Meta, OptionValue, ProductOption, OptionValueRepository, ProductOptionRepository (+3 more)

### Community 18 - "compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 19 - "EmailVerificationToken"
Cohesion: 0.13
Nodes (18): EmailVerificationTokenAdmin, PasswordResetTokenAdmin, EmailVerificationToken, Meta, PasswordResetToken, Optional DB-backed password-reset token (complement to Django's…, TokenRepository, TokenSelector (+10 more)

### Community 20 - "Cart"
Cohesion: 0.16
Nodes (7): Cart, CartItem, Meta, CartItemRepository, CartRepository, CartSelector, CartItem

### Community 21 - "ProductOptionService"
Cohesion: 0.20
Nodes (7): OptionValueSerializer, ProductOptionDetailSerializer, ProductOptionSerializer, ProductOptionService, AdminProductOptionViewSet, PublicProductOptionViewSet, action

### Community 22 - "VariantService"
Cohesion: 0.18
Nodes (9): VariantSelector, Meta, OptionAssignmentSerializer, VariantCreateSerializer, VariantDetailSerializer, VariantUpdateSerializer, VariantService, AdminVariantViewSet (+1 more)

### Community 23 - "PageFactory"
Cohesion: 0.15
Nodes (10): Meta, PageFactory, DjangoModelFactory, SiteContentFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 24 - "notifications/tests/test_services.py"
Cohesion: 0.15
Nodes (13): Meta, NotificationFactory, NotificationTemplateFactory, PreferenceFactory, DjangoModelFactory, django_db, TestUserEndpoints, django_db (+5 more)

### Community 25 - "auth/page.tsx"
Cohesion: 0.14
Nodes (19): AuthPage(), ForgotPasswordForm, forgotPasswordSchema, getApiErrorMessage(), identifierValidator, LoginForm, loginSchema, passwordRegisterSchema (+11 more)

### Community 26 - "cms/views.py"
Cohesion: 0.15
Nodes (8): PageSerializer, PageUpdateSerializer, SiteContentSerializer, AdminPageViewSet, AdminSiteContentViewSet, PublicPageViewSet, PublicSiteContentViewSet, action

### Community 27 - "InventoryService"
Cohesion: 0.16
Nodes (10): InventoryService, InventoryFactory, Meta, DjangoModelFactory, post_generation, VariantFactory, django_db, TestAdminAPI (+2 more)

### Community 28 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 29 - "dialog.tsx"
Cohesion: 0.16
Nodes (11): STATUS_TABS, OptionDef, VariantItem, Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader() (+3 more)

### Community 30 - "CartViewSet"
Cohesion: 0.22
Nodes (8): ApplyCouponSerializer, CartAddItemSerializer, CartMergeSerializer, CartUpdateQuantitySerializer, CartViewSet, action, Merge guest cart into user cart (called after login). Must be authenticated., Ensure a session key exists for guest users.

### Community 31 - "common/exceptions.py"
Cohesion: 0.22
Nodes (8): InventoryAdmin, register, ReservationAdmin, Inventory, Meta, Reservation, Status, InventorySelector

### Community 32 - "notifications/models.py"
Cohesion: 0.18
Nodes (7): Meta, NotificationTemplate, UserNotificationPreference, TemplateRepository, PreferenceSelector, shared_task, send_notification_email()

### Community 33 - "ProductOptionFactory"
Cohesion: 0.19
Nodes (10): Meta, OptionValueFactory, ProductOptionFactory, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 34 - "ProductFactory"
Cohesion: 0.14
Nodes (9): Meta, ProductFactory, DjangoModelFactory, django_db, TestPublicAPI, django_db, TestSearchAPI, django_db (+1 more)

### Community 35 - "[id]/page.tsx"
Cohesion: 0.14
Nodes (16): CheckoutPage(), PRESET_COLORS, ProductDetailPage(), ProductOption, ProductOptionValue, ProductVariant, SearchContent(), MobileNav() (+8 more)

### Community 36 - "devDependencies"
Cohesion: 0.11
Nodes (19): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 37 - "VariantFactory"
Cohesion: 0.15
Nodes (9): Meta, DjangoModelFactory, post_generation, VariantFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+1 more)

### Community 38 - "CartFactory"
Cohesion: 0.22
Nodes (10): CartFactory, CartItemFactory, Meta, DjangoModelFactory, django_db, patch, TestCartService, django_db (+2 more)

### Community 39 - ".lock_inventory"
Cohesion: 0.24
Nodes (6): atomic, Row lock using select_for_update. Must be called inside a transaction., Called by Celery Beat every 5 minutes (crontab minute=*/5). Finds all ACTIVE…, Add or remove available quantity (admin action). Supports variant_id or…, Inventory, Reservation

### Community 40 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, clsx, dependencies, axios, clsx, lucide-react, next, next-themes (+9 more)

### Community 41 - "authentication/serializers.py"
Cohesion: 0.24
Nodes (9): ChangePasswordSerializer, PasswordResetConfirmSerializer, RegisterSerializer, TokenRefreshSerializer, PasswordValidator, test_missing_digit(), test_missing_uppercase(), test_short_password() (+1 more)

### Community 42 - "CartService"
Cohesion: 0.29
Nodes (4): CartService, atomic, Merge guest cart into authenticated user's cart., Cart

### Community 43 - "Page"
Cohesion: 0.25
Nodes (5): Page, Status, PageRepository, PageSelector, SiteContentSelector

### Community 44 - "orders/views.py"
Cohesion: 0.21
Nodes (7): CreateOrderSerializer, Meta, OrderListSerializer, StatusTransitionSerializer, AdminOrderViewSet, action, UserOrderViewSet

### Community 45 - "SearchService"
Cohesion: 0.21
Nodes (5): Build available filters based on the current product queryset. Returns a dict…, SearchSelector, SearchService, django_db, TestSearchService

### Community 46 - "OrderFactory"
Cohesion: 0.19
Nodes (8): Meta, OrderFactory, OrderItemFactory, DjangoModelFactory, django_db, TestAdminEndpoints, TestUserEndpoints, TestStatusTransitions

### Community 47 - "backend/tests/test_services.py"
Cohesion: 0.20
Nodes (6): Meta, UserFactory, django_db, TestAuthEndpoints, django_db, TestAuthService

### Community 48 - "SiteContent"
Cohesion: 0.19
Nodes (7): PageAdmin, register, SiteContentAdmin, Meta, Key-value store for global site sections. Expected keys: 'homepage', 'header',…, SiteContent, SiteContentRepository

### Community 49 - "AdminInventoryViewSet"
Cohesion: 0.27
Nodes (6): AdjustStockSerializer, InventorySerializer, ReservationExpirationSerializer, SafetyStockSerializer, AdminInventoryViewSet, action

### Community 50 - "notifications/views.py"
Cohesion: 0.23
Nodes (6): MarkReadSerializer, NotificationListSerializer, PreferenceSerializer, AdminNotificationViewSet, action, UserNotificationViewSet

### Community 52 - "NotificationService"
Cohesion: 0.31
Nodes (3): PreferenceRepository, NotificationService, Create an in-app notification and conditionally send an email.

### Community 53 - "Inventory"
Cohesion: 0.29
Nodes (4): InventoryRepository, Inventory, Reservation, ReservationRepository

### Community 54 - "Order"
Cohesion: 0.20
Nodes (7): Order, Status, atomic, OrderSelector, OrderService, atomic, Return stock for all items if order is cancelled before shipping.

### Community 55 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 56 - "app/layout.tsx"
Cohesion: 0.28
Nodes (5): metadata, vazirmatn, LayoutShell(), Navbar(), Toaster()

### Community 57 - ".create_verification_token"
Cohesion: 0.25
Nodes (3): UserSelector, ResendVerificationSerializer, ResendVerificationView

### Community 58 - "celery.py"
Cohesion: 0.29
Nodes (5): expire_reservations_task(), shared_task, Celery Beat periodic task — runs every 5 minutes via crontab(minute="*/5").…, Alias for expire_reservations_task — kept for spec compatibility. Directly…, release_expired_reservations()

### Community 60 - "search/views.py"
Cohesion: 0.43
Nodes (3): SearchSerializer, action, SearchViewSet

### Community 61 - "order_status_changed_handler"
Cohesion: 0.40
Nodes (3): NotificationsConfig, AppConfig, order_status_changed_handler()

### Community 63 - "notifications/admin.py"
Cohesion: 0.60
Nodes (4): NotificationAdmin, NotificationTemplateAdmin, register, UserNotificationPreferenceAdmin

## Knowledge Gaps
- **171 isolated node(s):** `ProductPositionSerializer`, `Meta`, `FilterFacet`, `ProductItem`, `Migration` (+166 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **78 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BusinessException` connect `BusinessException` to `Product`, `Collection`, `CategoryFactory`, `UserFactory`, `Payment`, `Media`, `AnalyticsService`, `Wishlist`, `AuthService`, `Variant`, `orders/services.py`, `ProductOption`, `Cart`, `ProductOptionService`, `VariantService`, `PageFactory`, `notifications/tests/test_services.py`, `common/exceptions.py`, `notifications/models.py`, `ProductOptionFactory`, `.lock_inventory`, `Page`, `OrderFactory`, `backend/tests/test_services.py`, `CMSService`, `Order`, `.create_verification_token`, `Notification`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `BaseModel` connect `BaseModel` to `notifications/models.py`, `Collection`, `CategoryFactory`, `UserFactory`, `Payment`, `Media`, `AnalyticsService`, `Wishlist`, `Page`, `SiteContent`, `orders/services.py`, `ProductOption`, `Cart`, `Order`, `Notification`, `common/exceptions.py`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `Product` connect `Product` to `Command`, `CartService`, `test_e2e_journeys.py`, `Variant`, `Cart`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `BusinessException` (e.g. with `.change_password()` and `.login_user()`) actually correct?**
  _`BusinessException` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ProductFactory` (e.g. with `TestPublicAPI` and `TestProductService`) actually correct?**
  _`ProductFactory` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `VariantFactory` (e.g. with `TestAdminAPI` and `TestPublicAPI`) actually correct?**
  _`VariantFactory` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ProductPositionSerializer`, `Meta`, `FilterFacet` to the rest of the system?**
  _171 weakly-connected nodes found - possible documentation gaps or missing edges._