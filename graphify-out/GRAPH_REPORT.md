# Graph Report - fashion-store  (2026-08-28)

## Corpus Check
- 22 files · ~63,547 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1887 nodes · 4011 edges · 206 communities (137 shown, 69 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 304 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Inventory & Stock Reservation
- Products & Reviews Domain
- Products & Catalog Domain
- Categories & Hierarchy
- Coupons & Discounts
- Shopping Cart & Items
- Admin Portal & Dashboard
- Admin Portal & Dashboard
- Product Variants & Options
- Products & Catalog Domain
- test_e2e_journeys.py / admin()
- UI Components & Layout
- Inventory & Stock Reservation
- Storefront App & Routing
- User Accounts & Authentication
- tsconfig.json / compilerOptions
- User Accounts & Authentication
- Wishlist Management
- User Accounts & Authentication
- Content Management System (CMS)
- Notifications & Email
- User Accounts & Authentication
- User Accounts & Authentication
- Orders & Checkout Processing
- Content Management System (CMS)
- Products & Catalog Domain
- SearchSelector / .get_dynamic_filters()
- User Accounts & Authentication
- components.json / aliases
- Notifications & Email
- Shopping Cart & Items
- Shopping Cart & Items
- Products & Catalog Domain
- babel-plugin-react-compiler / eslint
- Payments & Gateways
- axios / clsx
- Content Management System (CMS)
- User Accounts & Authentication
- Orders & Checkout Processing
- Orders & Checkout Processing
- User Accounts & Authentication
- Notifications & Email
- Payments & Gateways
- User Accounts & Authentication
- Payments & Gateways
- User Accounts & Authentication
- Content Management System (CMS)
- Notifications & Email
- Orders & Checkout Processing
- Content Management System (CMS)
- Wishlist Management
- User Accounts & Authentication
- Orders & Checkout Processing
- Wishlist Management
- User Accounts & Authentication
- package.json / name
- Payments & Gateways
- Storefront App & Routing
- User Accounts & Authentication
- User Accounts & Authentication
- middleware.py / AuditLogMiddleware
- Notifications & Email
- User Accounts & Authentication
- Shopping Cart & Items
- Categories & Hierarchy
- Content Management System (CMS)
- common/apps.py / CommonConfig
- core/apps.py / CoreConfig
- Storefront App & Routing
- API Client & Network Utilities
- Coupons & Discounts
- Inventory & Stock Reservation
- manage.py / main()
- media_libm/apps.py / MediaConfig
- Orders & Checkout Processing
- Payments & Gateways
- Products & Catalog Domain
- Products & Catalog Domain
- search/apps.py / AppConfig
- Client State Management
- User Accounts & Authentication
- Product Variants & Options
- Wishlist Management
- Products & Catalog Domain
- Migration
- Migration
- User Accounts & Authentication
- User Accounts & Authentication
- Shopping Cart & Items
- Shopping Cart & Items
- Categories & Hierarchy
- Content Management System (CMS)
- Migration
- asgi.py
- wsgi.py
- Coupons & Discounts
- Coupons & Discounts
- Inventory & Stock Reservation
- Migration
- Notifications & Email
- Orders & Checkout Processing
- Orders & Checkout Processing
- Payments & Gateways
- Migration
- Products & Catalog Domain
- Products & Catalog Domain
- Client State Management
- User Accounts & Authentication
- Product Variants & Options
- Wishlist Management
- class-variance-authority / class-variance-authority
- framer-motion / framer-motion
- eslint.config.mjs / eslintConfig
- next.config.ts / nextConfig
- next-env.d.ts
- @hookform/resolvers / @hookform/resolvers
- react / react
- react-dom / react-dom
- react-hook-form / react-hook-form
- shadcn / shadcn
- sonner / sonner
- tw-animate-css / tw-animate-css
- zod / zod
- postcss.config.mjs / config
- BaseCommand
- action
- How to Run Instructions

## God Nodes (most connected - your core abstractions)
1. `BusinessException` - 106 edges
2. `ProductFactory` - 47 edges
3. `UserFactory` - 45 edges
4. `BaseModel` - 42 edges
5. `VariantFactory` - 38 edges
6. `AuthService` - 36 edges
7. `cn()` - 36 edges
8. `InventoryService` - 34 edges
9. `Product` - 32 edges
10. `Variant` - 32 edges

## Surprising Connections (you probably didn't know these)
- `RegisterView` --uses--> `RegisterSerializer`  [INFERRED]
  backend/authentication/views.py → backend/authentication/serializers.py
- `AuthService` --uses--> `EmailVerificationToken`  [INFERRED]
  backend/authentication/services.py → backend/authentication/models.py
- `AuthService` --uses--> `TokenRepository`  [INFERRED]
  backend/authentication/services.py → backend/authentication/repositories.py
- `AuthService` --uses--> `UserRepository`  [INFERRED]
  backend/authentication/services.py → backend/authentication/repositories.py
- `AuthService` --uses--> `TokenSelector`  [INFERRED]
  backend/authentication/services.py → backend/authentication/selectors.py

## Import Cycles
- None detected.

## Communities (206 total, 69 thin omitted)

### Community 0 - "Inventory & Stock Reservation"
Cohesion: 0.05
Nodes (36): InventoryAdmin, register, ReservationAdmin, Inventory, Meta, Reservation, Status, InventoryRepository (+28 more)

### Community 1 - "Products & Reviews Domain"
Cohesion: 0.05
Nodes (25): action, ProductAdmin, register, Meta, Product, BaseModel, Review, Status (+17 more)

### Community 2 - "Products & Catalog Domain"
Cohesion: 0.06
Nodes (29): CollectionAdmin, CollectionProductInline, register, Collection, CollectionProduct, Meta, CollectionRepository, atomic (+21 more)

### Community 3 - "Categories & Hierarchy"
Cohesion: 0.05
Nodes (30): CategoryAdmin, register, Category, Meta, MPTTMeta, CategoryRepository, CategorySelector, Return active root nodes with their active descendants as a tree. (+22 more)

### Community 4 - "Coupons & Discounts"
Cohesion: 0.07
Nodes (27): django_db, patch, TestSignals, Meta, UserFactory, CouponAdmin, CouponUsageAdmin, register (+19 more)

### Community 5 - "Shopping Cart & Items"
Cohesion: 0.07
Nodes (24): Cart, CartItem, Meta, CartItemRepository, CartRepository, CartSelector, CartService, atomic (+16 more)

### Community 6 - "Admin Portal & Dashboard"
Cohesion: 0.07
Nodes (25): MediaAdmin, register, Media, MediaType, Meta, MediaRepository, MediaSelector, MediaUpdateSerializer (+17 more)

### Community 7 - "Admin Portal & Dashboard"
Cohesion: 0.07
Nodes (24): register, TrackedEventAdmin, AnalyticsConfig, AppConfig, cart_changed_handler(), order_placed_handler(), Meta, TrackedEvent (+16 more)

### Community 8 - "Product Variants & Options"
Cohesion: 0.08
Nodes (24): Command, register, VariantAdmin, VariantOptionInline, Availability, Meta, BaseModel, Status (+16 more)

### Community 9 - "Products & Catalog Domain"
Cohesion: 0.09
Nodes (18): OptionValueInline, ProductOptionAdmin, register, Meta, OptionValue, ProductOption, OptionValueRepository, ProductOptionRepository (+10 more)

### Community 10 - "test_e2e_journeys.py / admin()"
Cohesion: 0.08
Nodes (19): admin(), authenticate(), catalog(), client(), create_order(), customer(), customer_b(), End-to-end API journeys for the Luxe shop. Run with:: pytest -q… (+11 more)

### Community 11 - "UI Components & Layout"
Cohesion: 0.12
Nodes (22): DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut() (+14 more)

### Community 12 - "Inventory & Stock Reservation"
Cohesion: 0.13
Nodes (7): NAV_ITEMS, Button(), buttonVariants, Input(), adminApi, ProductReview, SiteContentData

### Community 13 - "Storefront App & Routing"
Cohesion: 0.10
Nodes (12): CheckoutForm, CheckoutPage(), checkoutSchema, CollectionsSection(), MobileNav(), api, CartItem, CartStore (+4 more)

### Community 14 - "User Accounts & Authentication"
Cohesion: 0.14
Nodes (13): IsSelf, Object-level permission to only allow users to edit their own profile., AdminUserSerializer, AdminUserUpdateSerializer, AssignGroupsSerializer, ChangeEmailSerializer, ConfirmEmailSerializer, UpdateProfileSerializer (+5 more)

### Community 15 - "tsconfig.json / compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 16 - "User Accounts & Authentication"
Cohesion: 0.12
Nodes (16): APIView, IsTokenValid, LoginSerializer, PasswordResetConfirmSerializer, PasswordResetRequestSerializer, TokenRefreshSerializer, VerifyEmailSerializer, CustomTokenRefreshView (+8 more)

### Community 17 - "Wishlist Management"
Cohesion: 0.17
Nodes (10): register, WishlistAdmin, WishlistItemInline, Meta, Wishlist, WishlistItem, WishlistRepository, WishlistSelector (+2 more)

### Community 18 - "User Accounts & Authentication"
Cohesion: 0.16
Nodes (12): EmailVerificationTokenAdmin, register, EmailVerificationToken, Meta, TokenRepository, TokenSelector, UserSelector, ResendVerificationSerializer (+4 more)

### Community 19 - "Content Management System (CMS)"
Cohesion: 0.15
Nodes (10): Meta, PageFactory, DjangoModelFactory, SiteContentFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 20 - "Notifications & Email"
Cohesion: 0.15
Nodes (13): Meta, NotificationFactory, NotificationTemplateFactory, PreferenceFactory, DjangoModelFactory, django_db, TestUserEndpoints, django_db (+5 more)

### Community 21 - "User Accounts & Authentication"
Cohesion: 0.13
Nodes (9): EmailChangeRequestAdmin, register, EmailChangeRequest, Meta, UserRepository, UserSelector, shared_task, send_email_change_verification() (+1 more)

### Community 22 - "User Accounts & Authentication"
Cohesion: 0.14
Nodes (20): AuthPage(), ForgotPasswordForm, forgotPasswordSchema, getApiErrorMessage(), identifierValidator, LoginForm, loginSchema, passwordRegisterSchema (+12 more)

### Community 23 - "Orders & Checkout Processing"
Cohesion: 0.17
Nodes (7): Order, Status, atomic, OrderSelector, OrderService, atomic, Return stock for all items if order is cancelled before shipping.

### Community 24 - "Content Management System (CMS)"
Cohesion: 0.15
Nodes (8): PageSerializer, PageUpdateSerializer, SiteContentSerializer, AdminPageViewSet, AdminSiteContentViewSet, PublicPageViewSet, PublicSiteContentViewSet, action

### Community 25 - "Products & Catalog Domain"
Cohesion: 0.17
Nodes (10): Meta, OptionValueFactory, ProductOptionFactory, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 26 - "SearchSelector / .get_dynamic_filters()"
Cohesion: 0.15
Nodes (8): Build available filters based on the current product queryset. Returns a dict…, SearchSelector, SearchSerializer, SearchService, django_db, TestSearchService, action, SearchViewSet

### Community 27 - "User Accounts & Authentication"
Cohesion: 0.15
Nodes (8): AbstractBaseUser, APIException, InvalidTokenException, TokenExpiredException, BusinessException, User, UserValidator, PermissionsMixin

### Community 28 - "components.json / aliases"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 29 - "Notifications & Email"
Cohesion: 0.18
Nodes (9): Command, BaseCommand, Meta, Notification, NotificationTemplate, NotificationRepository, TemplateRepository, shared_task (+1 more)

### Community 30 - "Shopping Cart & Items"
Cohesion: 0.22
Nodes (8): ApplyCouponSerializer, CartAddItemSerializer, CartMergeSerializer, CartUpdateQuantitySerializer, CartViewSet, action, Merge guest cart into user cart (called after login). Must be authenticated., Ensure a session key exists for guest users.

### Community 31 - "Shopping Cart & Items"
Cohesion: 0.14
Nodes (11): django_db, TestGuestCartAPI, Meta, DjangoModelFactory, post_generation, VariantFactory, django_db, TestAdminAPI (+3 more)

### Community 32 - "Products & Catalog Domain"
Cohesion: 0.14
Nodes (9): Meta, ProductFactory, DjangoModelFactory, django_db, TestPublicAPI, django_db, TestSearchAPI, django_db (+1 more)

### Community 33 - "babel-plugin-react-compiler / eslint"
Cohesion: 0.11
Nodes (19): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 34 - "Payments & Gateways"
Cohesion: 0.20
Nodes (7): PaymentAdmin, register, Meta, Payment, Status, PaymentRepository, PaymentSelector

### Community 35 - "axios / clsx"
Cohesion: 0.12
Nodes (17): axios, clsx, dependencies, axios, clsx, lucide-react, next, next-themes (+9 more)

### Community 36 - "Content Management System (CMS)"
Cohesion: 0.25
Nodes (5): Page, Status, PageRepository, PageSelector, SiteContentSelector

### Community 37 - "User Accounts & Authentication"
Cohesion: 0.20
Nodes (9): UserManager, BaseModel, Meta, Ultimate base for all domain entities., SoftDeleteManager, SoftDeleteModel, TimestampedModel, UUIDPrimaryKeyMixin (+1 more)

### Community 38 - "Orders & Checkout Processing"
Cohesion: 0.23
Nodes (10): OrderAdmin, OrderItemInline, register, StatusHistoryInline, Meta, OrderItem, OrderSequence, OrderStatusHistory (+2 more)

### Community 39 - "Orders & Checkout Processing"
Cohesion: 0.21
Nodes (7): CreateOrderSerializer, Meta, OrderListSerializer, StatusTransitionSerializer, AdminOrderViewSet, action, UserOrderViewSet

### Community 40 - "User Accounts & Authentication"
Cohesion: 0.23
Nodes (7): GroupFactory, Meta, UserFactory, django_db, TestUserEndpoints, django_db, TestUserService

### Community 41 - "Notifications & Email"
Cohesion: 0.18
Nodes (5): NotificationsConfig, AppConfig, order_status_changed_handler(), NotificationService, Create an in-app notification and conditionally send an email.

### Community 42 - "Payments & Gateways"
Cohesion: 0.23
Nodes (6): CallbackSerializer, InitiatePaymentSerializer, PaymentService, CallbackViewSet, PaymentViewSet, action

### Community 43 - "User Accounts & Authentication"
Cohesion: 0.20
Nodes (6): Meta, UserFactory, django_db, TestAuthEndpoints, django_db, TestAuthService

### Community 44 - "Payments & Gateways"
Cohesion: 0.16
Nodes (6): ABC, BasePaymentGateway, Validate callback payload and return: - 'gateway_reference': str - 'status':…, Return a dict with at least: - 'gateway_reference': str - 'status': str…, DummyGateway, BasePaymentGateway

### Community 45 - "User Accounts & Authentication"
Cohesion: 0.18
Nodes (4): ChangePasswordSerializer, AuthService, ChangePasswordView, LogoutView

### Community 46 - "Content Management System (CMS)"
Cohesion: 0.19
Nodes (7): PageAdmin, register, SiteContentAdmin, Meta, Key-value store for global site sections. Expected keys: 'homepage', 'header',…, SiteContent, SiteContentRepository

### Community 47 - "Notifications & Email"
Cohesion: 0.23
Nodes (6): MarkReadSerializer, NotificationListSerializer, PreferenceSerializer, AdminNotificationViewSet, action, UserNotificationViewSet

### Community 48 - "Orders & Checkout Processing"
Cohesion: 0.22
Nodes (8): Meta, OrderFactory, OrderItemFactory, DjangoModelFactory, TestStatusTransitions, django_db, patch, TestPaymentService

### Community 50 - "Wishlist Management"
Cohesion: 0.22
Nodes (6): Meta, DjangoModelFactory, WishlistFactory, WishlistItemFactory, django_db, TestWishlistService

### Community 51 - "User Accounts & Authentication"
Cohesion: 0.32
Nodes (6): RegisterSerializer, PasswordValidator, test_missing_digit(), test_missing_uppercase(), test_short_password(), test_valid_password()

### Community 52 - "Orders & Checkout Processing"
Cohesion: 0.20
Nodes (7): STATUS_TABS, DialogContent(), DialogDescription(), DialogFooter(), DialogOverlay(), DialogTitle(), DialogTrigger()

### Community 53 - "Wishlist Management"
Cohesion: 0.31
Nodes (4): WishlistAddItemSerializer, WishlistRemoveItemSerializer, action, WishlistViewSet

### Community 54 - "User Accounts & Authentication"
Cohesion: 0.33
Nodes (3): UserNotificationPreference, PreferenceRepository, PreferenceSelector

### Community 55 - "package.json / name"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 56 - "Payments & Gateways"
Cohesion: 0.25
Nodes (5): Meta, PaymentFactory, DjangoModelFactory, django_db, TestPaymentAPI

### Community 57 - "Storefront App & Routing"
Cohesion: 0.29
Nodes (5): metadata, vazirmatn, Footer(), Navbar(), Toaster()

### Community 58 - "User Accounts & Authentication"
Cohesion: 0.60
Nodes (4): NotificationAdmin, NotificationTemplateAdmin, register, UserNotificationPreferenceAdmin

## Knowledge Gaps
- **154 isolated node(s):** `Meta`, `Meta`, `Migration`, `Migration`, `Migration` (+149 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BusinessException` connect `User Accounts & Authentication` to `Inventory & Stock Reservation`, `Products & Reviews Domain`, `Products & Catalog Domain`, `Categories & Hierarchy`, `Coupons & Discounts`, `Shopping Cart & Items`, `Admin Portal & Dashboard`, `Admin Portal & Dashboard`, `Product Variants & Options`, `Products & Catalog Domain`, `Wishlist Management`, `User Accounts & Authentication`, `Content Management System (CMS)`, `Notifications & Email`, `User Accounts & Authentication`, `Orders & Checkout Processing`, `Products & Catalog Domain`, `Notifications & Email`, `Payments & Gateways`, `Content Management System (CMS)`, `Orders & Checkout Processing`, `User Accounts & Authentication`, `Notifications & Email`, `Payments & Gateways`, `User Accounts & Authentication`, `User Accounts & Authentication`, `Orders & Checkout Processing`, `Content Management System (CMS)`, `Wishlist Management`, `User Accounts & Authentication`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Why does `BaseModel` connect `User Accounts & Authentication` to `Inventory & Stock Reservation`, `Payments & Gateways`, `Categories & Hierarchy`, `Content Management System (CMS)`, `Shopping Cart & Items`, `Coupons & Discounts`, `Admin Portal & Dashboard`, `Admin Portal & Dashboard`, `Orders & Checkout Processing`, `Products & Catalog Domain`, `Products & Catalog Domain`, `Content Management System (CMS)`, `Wishlist Management`, `Orders & Checkout Processing`, `User Accounts & Authentication`, `Notifications & Email`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `InventoryService` connect `Inventory & Stock Reservation` to `Products & Reviews Domain`, `test_e2e_journeys.py / admin()`, `Shopping Cart & Items`, `Orders & Checkout Processing`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `ProductFactory` (e.g. with `TestPublicAPI` and `TestProductService`) actually correct?**
  _`ProductFactory` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `VariantFactory` (e.g. with `TestAdminAPI` and `TestPublicAPI`) actually correct?**
  _`VariantFactory` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Meta`, `Meta`, `Migration` to the rest of the system?**
  _154 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Inventory & Stock Reservation` be split into smaller, more focused modules?**
  _Cohesion score 0.05434173669467787 - nodes in this community are weakly interconnected._