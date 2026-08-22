# Graph Report - fashion-store  (2026-08-22)

## Corpus Check
- Corpus is ~43,943 words - fits in a single context window. You may not need a graph.

## Summary
- 1796 nodes · 3920 edges · 217 communities (139 shown, 78 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 303 edges (avg confidence: 0.95)
- Token cost: 1,200 input · 800 output

## Community Hubs (Navigation)
- Inventory Stock Services
- Store Collections Product API
- Cart Item Services
- Analytics Cart API
- Wishlist Item Services
- Coupons Testcouponvalidation Services
- Products Productdetailserializer API
- Media Libm For Data Layer
- Ui Components Dropdown Menu
- Categories Category Data Layer
- Variants Variantservice API
- Frontend Tsconfig Compileroptions
- Notifications Signals Services
- Authentication Email Data Layer
- Product Options Value Data Layer
- Orders Number Data Layer
- Authentication Post API
- Variants Variantrepository Data Layer
- Cms Page Services
- Payments Factories Services
- Categories Products Services
- Cms Page Data Layer
- Cms Adminpageviewset API
- Frontend Components Aliases Tailwind
- Cart Cartviewset API
- Authentication Common Data Layer
- Product Options Factories Tests
- Product Options Value API
- Frontend React Types
- Cms Api API
- Search Testsearchservice Services
- Users Userprofileviewset API
- Users Email Services
- Authentication Validators API
- Payments Paymentselector Data Layer
- Notifications Init Data Layer
- Frontend Pages Tabs Auth
- Frontend Dependencies Package
- Categories Admincategoryviewset API
- Users Email Data Layer
- Frontend Pages Collections Api
- Media Libm Api API
- Orders Adminorderviewset API
- Frontend Pages Cart Store
- Orders Orderitem Data Layer
- Payments Paymentservice API
- Tests Api Services
- Users Api Services
- Frontend Pages Components Button
- Notifications Usernotificationviewset API
- Payments Gateways Base
- Users Adminuserviewset API
- Users Userselector Data Layer
- Notifications Mark Services
- Product Options Productoptionservice Data Layer
- Frontend Pages Loading Input
- Notifications Preferences Data Layer
- Frontend Svg Vercel
- Frontend Package Scripts
- Categories Api API
- Search Searchviewset API
- Variants Api API
- Wishlist Api API
- Common Managers Usermanager
- Notifications Apps Notificationsconfig
- Variants Testvariantservice Services
- Notifications Notificationadmin Admin
- Categories Flat API
- Cms Pageadmin Admin
- Core Middleware Auditlogmiddleware
- Notifications Notificationselector Data Layer
- Product Options Testproductoptionservice Services
- Search Api API
- Authentication Apps Authenticationconfig
- Cart Apps Cartconfig
- Categories Apps Categoriesconfig
- Cms Apps Cmsconfig
- Common Apps Commonconfig
- Core Apps Coreconfig
- Core Pagination Standardpagination
- Core Baseapiview API
- Coupons Apps Couponsconfig
- Inventory Apps Inventoryconfig
- Manage.Py Main Run
- Media Libm Apps Mediaconfig
- Orders Apps Ordersconfig
- Payments Apps Paymentsconfig
- Product Options Apps Productoptionsconfig
- Product Options Testadminapi API
- Products Apps Productsconfig
- Search Apps Appconfig
- Store Collections Apps Appconfig
- Users Emailchangerequestadmin Admin
- Users Apps Appconfig
- Variants Apps Appconfig
- Wishlist Apps Appconfig
- Frontend Components Product Card
- Analytics Initial Migrations
- Analytics Initial Migrations
- Authentication Initial Migrations
- Authentication Initial Migrations
- Cart Initial Migrations
- Cart Initial Migrations
- Categories Initial Migrations
- Cms Initial Migrations
- Common Initial Migrations
- Config Asgi For
- Config Wsgi For
- Coupons Initial Migrations
- Coupons Initial Migrations
- Inventory Initial Migrations
- Media Libm Initial Migrations
- Notifications Initial Migrations
- Orders Initial Migrations
- Orders Initial Migrations
- Payments Initial Migrations
- Product Options Initial Migrations
- Products Initial Migrations
- Requirements.Txt Celery Redis
- Store Collections Initial Migrations
- Users Initial Migrations
- Variants Initial Migrations
- Wishlist Initial Migrations
- Frontend Clsx Package
- Frontend Framer Motion
- Frontend Eslint Config
- Frontend Next Config
- Frontend Next Env
- Frontend Hookform Resolvers
- Frontend React Package
- Frontend React Dom
- Frontend React Hook
- Frontend Shadcn Package
- Frontend Sonner Package
- Frontend Animate Css
- Frontend Zod Package
- Frontend Config Postcss
- Frontend Lib Mock Data
- Frontend Svg Icon
- Frontend Globe Svg
- Frontend Window Svg

## God Nodes (most connected - your core abstractions)
1. `BusinessException` - 123 edges
2. `ProductFactory` - 47 edges
3. `BaseModel` - 46 edges
4. `UserFactory` - 45 edges
5. `VariantFactory` - 38 edges
6. `AuthService` - 36 edges
7. `cn()` - 36 edges
8. `InventoryService` - 34 edges
9. `ProductOptionFactory` - 30 edges
10. `CMSService` - 29 edges

## Surprising Connections (you probably didn't know these)
- `Django Backend` --conceptually_related_to--> `Fashion Store Project`  [INFERRED]
  backend/requirements.txt → README.md
- `Next.js Frontend App` --conceptually_related_to--> `Fashion Store Project`  [INFERRED]
  frontend/README.md → README.md
- `Next.js Logo SVG` --references--> `Next.js Frontend App`  [INFERRED]
  frontend/public/next.svg → frontend/README.md
- `Vercel Logo SVG` --references--> `Vercel Platform`  [INFERRED]
  frontend/public/vercel.svg → frontend/README.md
- `TokenRepository` --uses--> `EmailVerificationToken`  [INFERRED]
  backend/authentication/repositories.py → backend/authentication/models.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Fullstack Architecture** — readme_fashion_store, backend_requirements_django, frontend_readme_nextjs [INFERRED 0.85]

## Communities (217 total, 78 thin omitted)

### Community 0 - "Inventory Stock Services"
Cohesion: 0.06
Nodes (32): InventoryAdmin, register, ReservationAdmin, Inventory, Meta, Reservation, Status, InventoryRepository (+24 more)

### Community 1 - "Store Collections Product API"
Cohesion: 0.06
Nodes (28): CollectionAdmin, CollectionProductInline, register, Collection, CollectionProduct, Meta, CollectionRepository, atomic (+20 more)

### Community 2 - "Cart Item Services"
Cohesion: 0.07
Nodes (29): Cart, CartItem, Meta, CartItemRepository, CartRepository, CartSelector, CartService, atomic (+21 more)

### Community 3 - "Analytics Cart API"
Cohesion: 0.06
Nodes (24): register, TrackedEventAdmin, AnalyticsConfig, AppConfig, cart_changed_handler(), order_placed_handler(), Meta, TrackedEvent (+16 more)

### Community 4 - "Wishlist Item Services"
Cohesion: 0.07
Nodes (25): django_db, patch, TestSignals, Meta, UserFactory, register, WishlistAdmin, WishlistItemInline (+17 more)

### Community 5 - "Coupons Testcouponvalidation Services"
Cohesion: 0.08
Nodes (22): CouponAdmin, CouponUsageAdmin, register, Coupon, CouponUsage, DiscountType, Meta, CouponRepository (+14 more)

### Community 6 - "Products Productdetailserializer API"
Cohesion: 0.08
Nodes (17): ProductAdmin, register, Meta, Product, Status, ProductRepository, ProductSelector, Return published, non‑deleted products with active category. (+9 more)

### Community 7 - "Media Libm For Data Layer"
Cohesion: 0.09
Nodes (17): MediaAdmin, register, Media, MediaType, Meta, MediaRepository, MediaSelector, MediaUpdateSerializer (+9 more)

### Community 8 - "Ui Components Dropdown Menu"
Cohesion: 0.10
Nodes (29): Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle(), DialogTrigger() (+21 more)

### Community 9 - "Categories Category Data Layer"
Cohesion: 0.13
Nodes (10): CategoryAdmin, register, Category, Meta, MPTTMeta, CategoryRepository, CategorySelector, Return active root nodes with their active descendants as a tree. (+2 more)

### Community 10 - "Variants Variantservice API"
Cohesion: 0.15
Nodes (9): VariantSelector, OptionAssignmentSerializer, VariantCreateSerializer, VariantDetailSerializer, VariantUpdateSerializer, Ensure each assignment has a valid option_id and value_id, and the value…, VariantService, AdminVariantViewSet (+1 more)

### Community 11 - "Frontend Tsconfig Compileroptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 12 - "Notifications Signals Services"
Cohesion: 0.15
Nodes (13): Meta, NotificationFactory, NotificationTemplateFactory, PreferenceFactory, DjangoModelFactory, django_db, TestUserEndpoints, django_db (+5 more)

### Community 13 - "Authentication Email Data Layer"
Cohesion: 0.15
Nodes (12): IsTokenValid, TokenRepository, UserRepository, UserSelector, ResendVerificationSerializer, shared_task, send_password_reset_email(), send_verification_email() (+4 more)

### Community 14 - "Product Options Value Data Layer"
Cohesion: 0.17
Nodes (9): OptionValueInline, ProductOptionAdmin, register, Meta, OptionValue, ProductOption, OptionValueRepository, OptionValueSelector (+1 more)

### Community 15 - "Orders Number Data Layer"
Cohesion: 0.16
Nodes (8): Order, Status, OrderRepository, atomic, OrderSelector, OrderService, atomic, Return stock for all items if order is cancelled before shipping.

### Community 16 - "Authentication Post API"
Cohesion: 0.12
Nodes (12): APIView, ChangePasswordSerializer, LoginSerializer, PasswordResetRequestSerializer, VerifyEmailSerializer, AuthService, ChangePasswordView, LoginView (+4 more)

### Community 17 - "Variants Variantrepository Data Layer"
Cohesion: 0.15
Nodes (11): register, VariantAdmin, VariantOptionInline, Availability, Meta, Status, Variant, VariantOption (+3 more)

### Community 18 - "Cms Page Services"
Cohesion: 0.13
Nodes (3): CMSService, django_db, TestPageService

### Community 19 - "Payments Factories Services"
Cohesion: 0.13
Nodes (13): Meta, OrderFactory, OrderItemFactory, DjangoModelFactory, TestStatusTransitions, Meta, PaymentFactory, DjangoModelFactory (+5 more)

### Community 20 - "Categories Products Services"
Cohesion: 0.16
Nodes (9): CategoryService, CategoryFactory, Meta, DjangoModelFactory, django_db, TestCategoryService, django_db, TestAdminAPI (+1 more)

### Community 21 - "Cms Page Data Layer"
Cohesion: 0.18
Nodes (9): Meta, Page, Key-value store for global site sections. Expected keys: 'homepage', 'header',…, SiteContent, Status, PageRepository, SiteContentRepository, PageSelector (+1 more)

### Community 22 - "Cms Adminpageviewset API"
Cohesion: 0.16
Nodes (8): PageSerializer, PageUpdateSerializer, SiteContentSerializer, AdminPageViewSet, AdminSiteContentViewSet, PublicPageViewSet, PublicSiteContentViewSet, action

### Community 23 - "Frontend Components Aliases Tailwind"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 24 - "Cart Cartviewset API"
Cohesion: 0.21
Nodes (9): ApplyCouponSerializer, CartAddItemSerializer, CartMergeSerializer, CartRemoveItemSerializer, CartUpdateQuantitySerializer, CartViewSet, action, Merge guest cart into user cart (called after login). Must be authenticated. (+1 more)

### Community 25 - "Authentication Common Data Layer"
Cohesion: 0.16
Nodes (10): EmailVerificationTokenAdmin, register, EmailVerificationToken, Meta, TokenSelector, Meta, SoftDeleteManager, SoftDeleteModel (+2 more)

### Community 26 - "Product Options Factories Tests"
Cohesion: 0.27
Nodes (7): Meta, OptionValueFactory, ProductOptionFactory, DjangoModelFactory, django_db, TestPublicAPI, TestOptionValueService

### Community 27 - "Product Options Value API"
Cohesion: 0.21
Nodes (7): OptionValueSerializer, ProductOptionDetailSerializer, ProductOptionSerializer, OptionValueService, AdminProductOptionViewSet, PublicProductOptionViewSet, action

### Community 28 - "Frontend React Types"
Cohesion: 0.11
Nodes (19): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 29 - "Cms Api API"
Cohesion: 0.20
Nodes (8): Meta, PageFactory, DjangoModelFactory, SiteContentFactory, django_db, TestAdminAPI, TestPublicAPI, TestSiteContent

### Community 30 - "Search Testsearchservice Services"
Cohesion: 0.19
Nodes (8): Meta, ProductFactory, DjangoModelFactory, Build available filters based on the current product queryset. Returns a dict…, SearchSelector, SearchService, django_db, TestSearchService

### Community 31 - "Users Userprofileviewset API"
Cohesion: 0.21
Nodes (10): IsSelf, Object-level permission to only allow users to edit their own profile., AdminUserSerializer, AdminUserUpdateSerializer, AssignGroupsSerializer, ChangeEmailSerializer, ConfirmEmailSerializer, UpdateProfileSerializer (+2 more)

### Community 32 - "Users Email Services"
Cohesion: 0.15
Nodes (5): APIException, InvalidTokenException, TokenExpiredException, BusinessException, UserValidator

### Community 33 - "Authentication Validators API"
Cohesion: 0.21
Nodes (10): PasswordResetConfirmSerializer, RegisterSerializer, TokenRefreshSerializer, PasswordValidator, PasswordResetConfirmView, RegisterView, test_missing_digit(), test_missing_uppercase() (+2 more)

### Community 34 - "Payments Paymentselector Data Layer"
Cohesion: 0.22
Nodes (7): PaymentAdmin, register, Meta, Payment, Status, PaymentRepository, PaymentSelector

### Community 35 - "Notifications Init Data Layer"
Cohesion: 0.20
Nodes (8): Command, Meta, Notification, NotificationTemplate, TemplateRepository, shared_task, send_notification_email(), BaseCommand

### Community 36 - "Frontend Pages Tabs Auth"
Cohesion: 0.18
Nodes (15): ForgotPasswordForm, forgotPasswordSchema, identifierValidator, LoginForm, loginSchema, RegisterForm, registerSchema, getUserIdFromToken() (+7 more)

### Community 37 - "Frontend Dependencies Package"
Cohesion: 0.12
Nodes (17): axios, class-variance-authority, dependencies, axios, class-variance-authority, lucide-react, next, next-themes (+9 more)

### Community 38 - "Categories Admincategoryviewset API"
Cohesion: 0.21
Nodes (7): CategoryCreateSerializer, CategoryTreeSerializer, CategoryUpdateSerializer, Output for nested tree representation., AdminCategoryViewSet, PublicCategoryViewSet, Return active categories as a nested tree.

### Community 39 - "Users Email Data Layer"
Cohesion: 0.22
Nodes (6): EmailChangeRequest, Meta, UserRepository, UserSelector, shared_task, send_email_change_verification()

### Community 40 - "Frontend Pages Collections Api"
Cohesion: 0.18
Nodes (4): CollectionsSection(), api, WishlistItem, WishlistStore

### Community 41 - "Media Libm Api API"
Cohesion: 0.17
Nodes (8): MediaFactory, Meta, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db, TestMediaService

### Community 42 - "Orders Adminorderviewset API"
Cohesion: 0.23
Nodes (6): CreateOrderSerializer, OrderListSerializer, StatusTransitionSerializer, AdminOrderViewSet, action, UserOrderViewSet

### Community 43 - "Frontend Pages Cart Store"
Cohesion: 0.19
Nodes (12): AuthPage(), CheckoutForm, CheckoutPage(), checkoutSchema, MOCK_REVIEWS, ProductDetailPage(), MobileNav(), Navbar() (+4 more)

### Community 44 - "Orders Orderitem Data Layer"
Cohesion: 0.24
Nodes (11): BaseModel, Ultimate base for all domain entities., OrderAdmin, OrderItemInline, register, StatusHistoryInline, Meta, OrderItem (+3 more)

### Community 45 - "Payments Paymentservice API"
Cohesion: 0.23
Nodes (6): CallbackSerializer, InitiatePaymentSerializer, PaymentService, CallbackViewSet, PaymentViewSet, action

### Community 46 - "Tests Api Services"
Cohesion: 0.20
Nodes (6): Meta, UserFactory, django_db, TestAuthEndpoints, django_db, TestAuthService

### Community 47 - "Users Api Services"
Cohesion: 0.22
Nodes (7): GroupFactory, Meta, UserFactory, django_db, TestUserEndpoints, django_db, TestUserService

### Community 48 - "Frontend Pages Components Button"
Cohesion: 0.19
Nodes (6): metadata, vazirmatn, Footer(), Button(), buttonVariants, Toaster()

### Community 49 - "Notifications Usernotificationviewset API"
Cohesion: 0.23
Nodes (6): MarkReadSerializer, NotificationListSerializer, PreferenceSerializer, AdminNotificationViewSet, action, UserNotificationViewSet

### Community 50 - "Payments Gateways Base"
Cohesion: 0.21
Nodes (5): ABC, BasePaymentGateway, Validate callback payload and return: - 'gateway_reference': str - 'status':…, Return a dict with at least: - 'gateway_reference': str - 'status': str…, DummyGateway

### Community 51 - "Users Adminuserviewset API"
Cohesion: 0.26
Nodes (3): UserService, AdminUserViewSet, action

### Community 52 - "Users Userselector Data Layer"
Cohesion: 0.18
Nodes (4): AbstractBaseUser, User, PermissionsMixin, QuerySet

### Community 53 - "Notifications Mark Services"
Cohesion: 0.26
Nodes (3): NotificationRepository, NotificationService, Create an in-app notification and conditionally send an email.

### Community 56 - "Notifications Preferences Data Layer"
Cohesion: 0.36
Nodes (3): UserNotificationPreference, PreferenceRepository, PreferenceSelector

### Community 57 - "Frontend Svg Vercel"
Cohesion: 0.22
Nodes (9): Django Backend, Django REST Framework, SimpleJWT Auth, Next.js Logo SVG, Vercel Logo SVG, Geist Font Family, Next.js Frontend App, Vercel Platform (+1 more)

### Community 58 - "Frontend Package Scripts"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 59 - "Categories Api API"
Cohesion: 0.29
Nodes (3): django_db, TestAdminAPI, TestPublicAPI

### Community 60 - "Search Searchviewset API"
Cohesion: 0.43
Nodes (3): SearchSerializer, action, SearchViewSet

### Community 61 - "Variants Api API"
Cohesion: 0.29
Nodes (3): django_db, TestAdminAPI, TestPublicAPI

### Community 64 - "Notifications Apps Notificationsconfig"
Cohesion: 0.40
Nodes (3): NotificationsConfig, AppConfig, order_status_changed_handler()

### Community 66 - "Notifications Notificationadmin Admin"
Cohesion: 0.60
Nodes (4): NotificationAdmin, NotificationTemplateAdmin, register, UserNotificationPreferenceAdmin

### Community 68 - "Cms Pageadmin Admin"
Cohesion: 0.67
Nodes (3): PageAdmin, register, SiteContentAdmin

## Knowledge Gaps
- **159 isolated node(s):** `Migration`, `Migration`, `Meta`, `Meta`, `Migration` (+154 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **78 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BusinessException` connect `Users Email Services` to `Inventory Stock Services`, `Store Collections Product API`, `Cart Item Services`, `Analytics Cart API`, `Wishlist Item Services`, `Coupons Testcouponvalidation Services`, `Products Productdetailserializer API`, `Media Libm For Data Layer`, `Categories Category Data Layer`, `Variants Variantservice API`, `Notifications Signals Services`, `Authentication Email Data Layer`, `Product Options Value Data Layer`, `Orders Number Data Layer`, `Authentication Post API`, `Variants Variantrepository Data Layer`, `Cms Page Services`, `Payments Factories Services`, `Categories Products Services`, `Cms Page Data Layer`, `Product Options Factories Tests`, `Product Options Value API`, `Cms Api API`, `Payments Paymentselector Data Layer`, `Notifications Init Data Layer`, `Users Email Data Layer`, `Media Libm Api API`, `Orders Orderitem Data Layer`, `Payments Paymentservice API`, `Tests Api Services`, `Users Userselector Data Layer`, `Notifications Mark Services`, `Product Options Productoptionservice Data Layer`?**
  _High betweenness centrality (0.257) - this node is a cross-community bridge._
- **Why does `BaseModel` connect `Orders Orderitem Data Layer` to `Inventory Stock Services`, `Store Collections Product API`, `Cart Item Services`, `Analytics Cart API`, `Notifications Init Data Layer`, `Coupons Testcouponvalidation Services`, `Payments Paymentselector Data Layer`, `Media Libm For Data Layer`, `Products Productdetailserializer API`, `Categories Category Data Layer`, `Wishlist Item Services`, `Product Options Value Data Layer`, `Orders Number Data Layer`, `Variants Variantrepository Data Layer`, `Users Userselector Data Layer`, `Cms Page Data Layer`, `Authentication Common Data Layer`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `AuthService` connect `Authentication Post API` to `Users Email Services`, `Authentication Validators API`, `Authentication Email Data Layer`, `Tests Api Services`, `Authentication Common Data Layer`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `ProductFactory` (e.g. with `TestPublicAPI` and `TestProductService`) actually correct?**
  _`ProductFactory` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `VariantFactory` (e.g. with `TestAdminAPI` and `TestPublicAPI`) actually correct?**
  _`VariantFactory` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Migration`, `Migration`, `Meta` to the rest of the system?**
  _159 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Inventory Stock Services` be split into smaller, more focused modules?**
  _Cohesion score 0.06458941901979877 - nodes in this community are weakly interconnected._