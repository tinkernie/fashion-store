# Graph Report - fashion-store  (2026-08-24)

## Corpus Check
- Corpus is ~45,557 words - fits in a single context window. You may not need a graph.

## Summary
- 1824 nodes · 3926 edges · 208 communities (137 shown, 71 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 313 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Authentication and User Management
- Inventory and Stock Reservation
- Authentication and User Management
- Authentication and User Management
- Analytics and Event Tracking
- Category Hierarchy & Taxonomy
- Authentication and User Management
- Product Variants & Options
- Customer Wishlist Management
- Product Collections & Grouping
- End-to-End Journey Tests
- Frontend UI Components
- Product Variants & Options
- Notifications & Communication Templates
- Product Variants & Options
- CMS and Page Content
- Authentication and User Management
- Product Variants & Options
- Inventory and Stock Reservation
- CMS and Page Content
- CMS and Page Content
- Product Variants & Options
- Inventory and Stock Reservation
- Testing & Mock Factories 23
- Frontend UI Components
- Authentication and User Management
- Notifications & Communication Templates
- Cart Management and Checkout
- Product Variants & Options
- Product Variants & Options
- Authentication and User Management
- Frontend Build & Config
- CMS and Page Content
- Notifications & Communication Templates
- Authentication and User Management
- Users Subsystem 35
- Media Assets & Uploads
- Authentication and User Management
- Authentication and User Management
- Product Variants & Options
- Authentication and User Management
- Orders and Payment Processing
- Users Subsystem 42
- Authentication and User Management
- Product Variants & Options
- Orders and Payment Processing
- Testing & Mock Factories 46
- Product Variants & Options
- Product Variants & Options
- Notifications & Communication Templates
- Orders and Payment Processing
- Notifications & Communication Templates
- Notifications & Communication Templates
- Authentication and User Management
- Frontend Build & Config
- Category Hierarchy & Taxonomy
- Authentication and User Management
- Frontend UI Components
- Authentication and User Management
- Notifications & Communication Templates
- Media Assets & Uploads
- Notifications & Communication Templates
- Search and Dynamic Filtering
- CMS and Page Content
- Core Subsystem 64
- Authentication and User Management
- Cart Subsystem 66
- Category Hierarchy & Taxonomy
- CMS and Page Content
- Common Subsystem 69
- Core Subsystem 70
- CMS and Page Content
- Core Subsystem 72
- Coupons and Discounts
- Inventory and Stock Reservation
- Manage Subsystem 75
- Media Assets & Uploads
- Orders and Payment Processing
- Orders and Payment Processing
- Product Variants & Options
- Product Core Models & Services
- Search and Dynamic Filtering
- Product Collections & Grouping
- Users Subsystem 83
- Product Variants & Options
- Customer Wishlist Management
- Product Core Models & Services
- Analytics and Event Tracking
- Analytics and Event Tracking
- Authentication and User Management
- Authentication and User Management
- Cart Subsystem 91
- Cart Subsystem 92
- Category Hierarchy & Taxonomy
- CMS and Page Content
- Common Subsystem 95
- Config Subsystem 96
- Config Subsystem 97
- Coupons and Discounts
- Coupons and Discounts
- Inventory and Stock Reservation
- Media Assets & Uploads
- Notifications & Communication Templates
- Orders and Payment Processing
- Orders and Payment Processing
- Orders and Payment Processing
- Product Variants & Options
- Product Core Models & Services
- Product Collections & Grouping
- Users Subsystem 110
- Product Variants & Options
- Customer Wishlist Management
- Frontend Build & Config
- Frontend Build & Config
- Frontend Build & Config
- Next.config Subsystem 116
- Next-env.d Subsystem 117
- Frontend Build & Config
- Frontend Build & Config
- Frontend Build & Config
- Frontend Build & Config
- Frontend Build & Config
- Frontend Build & Config
- Frontend Build & Config
- Frontend Build & Config
- Postcss.config.mjs Subsystem 126
- Product Core Models & Services
- Public Subsystem 204
- Public Subsystem 205
- Public Subsystem 206
- Public Subsystem 207

## God Nodes (most connected - your core abstractions)
1. `BusinessException` - 123 edges
2. `ProductFactory` - 47 edges
3. `BaseModel` - 46 edges
4. `UserFactory` - 45 edges
5. `VariantFactory` - 38 edges
6. `AuthService` - 36 edges
7. `InventoryService` - 36 edges
8. `cn()` - 36 edges
9. `Order` - 31 edges
10. `User` - 30 edges

## Surprising Connections (you probably didn't know these)
- `Fashion Store Website` --references--> `Django Backend Dependencies`  [INFERRED]
  README.md → backend/requirements.txt
- `Fashion Store Website` --references--> `Next.js Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `Next.js Frontend Application` --references--> `Next.js Logo Asset`  [INFERRED]
  frontend/README.md → frontend/public/next.svg
- `TestCustomerCommerceJourney` --uses--> `TrackedEvent`  [INFERRED]
  backend/tests/test_e2e_journeys.py → backend/analytics/models.py
- `RegisterView` --uses--> `RegisterSerializer`  [INFERRED]
  backend/authentication/views.py → backend/authentication/serializers.py

## Import Cycles
- None detected.

## Communities (208 total, 71 thin omitted)

### Community 0 - "Authentication and User Management"
Cohesion: 0.05
Nodes (45): APIView, EmailVerificationTokenAdmin, register, EmailVerificationToken, Meta, IsTokenValid, TokenRepository, UserRepository (+37 more)

### Community 1 - "Inventory and Stock Reservation"
Cohesion: 0.07
Nodes (30): InventoryAdmin, register, ReservationAdmin, Inventory, Meta, Reservation, Status, InventoryRepository (+22 more)

### Community 2 - "Authentication and User Management"
Cohesion: 0.06
Nodes (29): CollectionAdmin, CollectionProductInline, register, Collection, CollectionProduct, Meta, CollectionRepository, atomic (+21 more)

### Community 3 - "Authentication and User Management"
Cohesion: 0.06
Nodes (31): APIException, django_db, patch, TestSignals, InvalidTokenException, TokenExpiredException, BusinessException, Meta (+23 more)

### Community 4 - "Analytics and Event Tracking"
Cohesion: 0.06
Nodes (24): register, TrackedEventAdmin, AnalyticsConfig, AppConfig, cart_changed_handler(), order_placed_handler(), Meta, TrackedEvent (+16 more)

### Community 5 - "Category Hierarchy & Taxonomy"
Cohesion: 0.07
Nodes (22): CategoryAdmin, register, Category, Meta, MPTTMeta, CategoryRepository, CategorySelector, Return active root nodes with their active descendants as a tree. (+14 more)

### Community 6 - "Authentication and User Management"
Cohesion: 0.10
Nodes (20): Cart, CartItem, Meta, CartItemRepository, CartRepository, CartSelector, CartService, atomic (+12 more)

### Community 7 - "Product Variants & Options"
Cohesion: 0.08
Nodes (23): register, VariantAdmin, VariantOptionInline, Availability, Meta, Status, Variant, VariantOption (+15 more)

### Community 8 - "Customer Wishlist Management"
Cohesion: 0.08
Nodes (20): register, WishlistAdmin, WishlistItemInline, Meta, Wishlist, WishlistItem, WishlistRepository, WishlistSelector (+12 more)

### Community 9 - "Product Collections & Grouping"
Cohesion: 0.10
Nodes (16): ProductAdmin, register, Meta, Product, Status, ProductRepository, ProductSelector, Return published, non‑deleted products with active category. (+8 more)

### Community 10 - "End-to-End Journey Tests"
Cohesion: 0.08
Nodes (19): admin(), authenticate(), catalog(), client(), create_order(), customer(), customer_b(), End-to-end API journeys for the Luxe shop. Run with:: pytest -q… (+11 more)

### Community 11 - "Frontend UI Components"
Cohesion: 0.10
Nodes (29): Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle(), DialogTrigger() (+21 more)

### Community 12 - "Product Variants & Options"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 13 - "Notifications & Communication Templates"
Cohesion: 0.15
Nodes (13): Meta, NotificationFactory, NotificationTemplateFactory, PreferenceFactory, DjangoModelFactory, django_db, TestUserEndpoints, django_db (+5 more)

### Community 14 - "Product Variants & Options"
Cohesion: 0.15
Nodes (9): MediaAdmin, register, Media, MediaType, Meta, MediaRepository, MediaSelector, MediaService (+1 more)

### Community 15 - "CMS and Page Content"
Cohesion: 0.13
Nodes (3): CMSService, django_db, TestPageService

### Community 16 - "Authentication and User Management"
Cohesion: 0.15
Nodes (11): CategoryFactory, Meta, DjangoModelFactory, Meta, ProductFactory, DjangoModelFactory, django_db, TestAdminAPI (+3 more)

### Community 17 - "Product Variants & Options"
Cohesion: 0.15
Nodes (8): Build available filters based on the current product queryset. Returns a dict…, SearchSelector, SearchSerializer, SearchService, django_db, TestSearchService, action, SearchViewSet

### Community 18 - "Inventory and Stock Reservation"
Cohesion: 0.13
Nodes (11): django_db, TestGuestCartAPI, django_db, TestAdminAPI, Meta, DjangoModelFactory, post_generation, VariantFactory (+3 more)

### Community 19 - "CMS and Page Content"
Cohesion: 0.18
Nodes (9): Meta, Page, Key-value store for global site sections. Expected keys: 'homepage', 'header',…, SiteContent, Status, PageRepository, SiteContentRepository, PageSelector (+1 more)

### Community 20 - "CMS and Page Content"
Cohesion: 0.16
Nodes (8): PageSerializer, PageUpdateSerializer, SiteContentSerializer, AdminPageViewSet, AdminSiteContentViewSet, PublicPageViewSet, PublicSiteContentViewSet, action

### Community 21 - "Product Variants & Options"
Cohesion: 0.17
Nodes (8): OptionValueInline, ProductOptionAdmin, register, Meta, OptionValue, ProductOption, OptionValueSelector, ProductOptionSelector

### Community 22 - "Inventory and Stock Reservation"
Cohesion: 0.17
Nodes (7): Order, Status, atomic, OrderSelector, OrderService, atomic, Return stock for all items if order is cancelled before shipping.

### Community 23 - "Testing & Mock Factories 23"
Cohesion: 0.16
Nodes (9): EmailChangeRequestAdmin, register, EmailChangeRequest, Meta, UserRepository, UserSelector, shared_task, send_email_change_verification() (+1 more)

### Community 24 - "Frontend UI Components"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 25 - "Authentication and User Management"
Cohesion: 0.22
Nodes (8): ApplyCouponSerializer, CartAddItemSerializer, CartMergeSerializer, CartUpdateQuantitySerializer, CartViewSet, action, Merge guest cart into user cart (called after login). Must be authenticated., Ensure a session key exists for guest users.

### Community 26 - "Notifications & Communication Templates"
Cohesion: 0.19
Nodes (8): Command, Meta, NotificationTemplate, UserNotificationPreference, PreferenceRepository, TemplateRepository, PreferenceSelector, BaseCommand

### Community 27 - "Cart Management and Checkout"
Cohesion: 0.14
Nodes (11): Meta, OrderFactory, OrderItemFactory, DjangoModelFactory, django_db, TestAdminEndpoints, TestUserEndpoints, TestStatusTransitions (+3 more)

### Community 28 - "Product Variants & Options"
Cohesion: 0.16
Nodes (3): OptionValueRepository, ProductOptionRepository, ProductOptionService

### Community 29 - "Product Variants & Options"
Cohesion: 0.20
Nodes (10): Meta, OptionValueFactory, ProductOptionFactory, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 30 - "Authentication and User Management"
Cohesion: 0.12
Nodes (4): AbstractBaseUser, User, PermissionsMixin, QuerySet

### Community 31 - "Frontend Build & Config"
Cohesion: 0.11
Nodes (19): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 32 - "CMS and Page Content"
Cohesion: 0.20
Nodes (8): Meta, PageFactory, DjangoModelFactory, SiteContentFactory, django_db, TestAdminAPI, TestPublicAPI, TestSiteContent

### Community 33 - "Notifications & Communication Templates"
Cohesion: 0.20
Nodes (10): OrderAdmin, OrderItemInline, register, StatusHistoryInline, Meta, OrderItem, OrderSequence, OrderStatusHistory (+2 more)

### Community 34 - "Authentication and User Management"
Cohesion: 0.20
Nodes (7): PaymentAdmin, register, Meta, Payment, Status, PaymentRepository, PaymentSelector

### Community 35 - "Users Subsystem 35"
Cohesion: 0.21
Nodes (10): IsSelf, Object-level permission to only allow users to edit their own profile., AdminUserSerializer, AdminUserUpdateSerializer, AssignGroupsSerializer, ChangeEmailSerializer, ConfirmEmailSerializer, UpdateProfileSerializer (+2 more)

### Community 36 - "Media Assets & Uploads"
Cohesion: 0.19
Nodes (9): UserManager, BaseModel, Meta, Ultimate base for all domain entities., SoftDeleteManager, SoftDeleteModel, TimestampedModel, UUIDPrimaryKeyMixin (+1 more)

### Community 37 - "Authentication and User Management"
Cohesion: 0.18
Nodes (15): ForgotPasswordForm, forgotPasswordSchema, identifierValidator, LoginForm, loginSchema, RegisterForm, registerSchema, getUserIdFromToken() (+7 more)

### Community 38 - "Authentication and User Management"
Cohesion: 0.12
Nodes (17): axios, class-variance-authority, dependencies, axios, class-variance-authority, lucide-react, next, next-themes (+9 more)

### Community 39 - "Product Variants & Options"
Cohesion: 0.26
Nodes (7): OptionValueSerializer, ProductOptionDetailSerializer, ProductOptionSerializer, OptionValueService, AdminProductOptionViewSet, PublicProductOptionViewSet, action

### Community 40 - "Authentication and User Management"
Cohesion: 0.18
Nodes (4): CollectionsSection(), api, WishlistItem, WishlistStore

### Community 41 - "Orders and Payment Processing"
Cohesion: 0.23
Nodes (7): CreateOrderSerializer, Meta, OrderListSerializer, StatusTransitionSerializer, AdminOrderViewSet, action, UserOrderViewSet

### Community 42 - "Users Subsystem 42"
Cohesion: 0.19
Nodes (3): UserService, AdminUserViewSet, action

### Community 43 - "Authentication and User Management"
Cohesion: 0.19
Nodes (12): AuthPage(), CheckoutForm, CheckoutPage(), checkoutSchema, MOCK_REVIEWS, ProductDetailPage(), MobileNav(), Navbar() (+4 more)

### Community 44 - "Product Variants & Options"
Cohesion: 0.17
Nodes (8): MediaFactory, Meta, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db, TestMediaService

### Community 45 - "Orders and Payment Processing"
Cohesion: 0.23
Nodes (6): CallbackSerializer, InitiatePaymentSerializer, PaymentService, CallbackViewSet, PaymentViewSet, action

### Community 46 - "Testing & Mock Factories 46"
Cohesion: 0.22
Nodes (7): GroupFactory, Meta, UserFactory, django_db, TestUserEndpoints, django_db, TestUserService

### Community 47 - "Product Variants & Options"
Cohesion: 0.19
Nodes (6): metadata, vazirmatn, Footer(), Button(), buttonVariants, Toaster()

### Community 48 - "Product Variants & Options"
Cohesion: 0.30
Nodes (6): MediaUpdateSerializer, MediaUploadSerializer, ReorderSerializer, AdminMediaViewSet, PublicMediaViewSet, action

### Community 49 - "Notifications & Communication Templates"
Cohesion: 0.23
Nodes (6): MarkReadSerializer, NotificationListSerializer, PreferenceSerializer, AdminNotificationViewSet, action, UserNotificationViewSet

### Community 50 - "Orders and Payment Processing"
Cohesion: 0.21
Nodes (5): ABC, BasePaymentGateway, Validate callback payload and return: - 'gateway_reference': str - 'status':…, Return a dict with at least: - 'gateway_reference': str - 'status': str…, DummyGateway

### Community 51 - "Notifications & Communication Templates"
Cohesion: 0.26
Nodes (3): NotificationSelector, NotificationService, Create an in-app notification and conditionally send an email.

### Community 52 - "Notifications & Communication Templates"
Cohesion: 0.24
Nodes (4): Notification, NotificationRepository, shared_task, send_notification_email()

### Community 54 - "Frontend Build & Config"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 55 - "Category Hierarchy & Taxonomy"
Cohesion: 0.25
Nodes (3): django_db, TestAdminAPI, TestPublicAPI

### Community 56 - "Authentication and User Management"
Cohesion: 0.25
Nodes (5): Meta, PaymentFactory, DjangoModelFactory, django_db, TestPaymentAPI

### Community 57 - "Frontend UI Components"
Cohesion: 0.29
Nodes (7): Celery Worker & Beat, Django Backend Dependencies, Django REST Framework & SimpleJWT, Next.js Logo Asset, Geist Font Optimization, Next.js Frontend Application, Fashion Store Website

### Community 59 - "Notifications & Communication Templates"
Cohesion: 0.40
Nodes (3): NotificationsConfig, AppConfig, order_status_changed_handler()

### Community 61 - "Notifications & Communication Templates"
Cohesion: 0.60
Nodes (4): NotificationAdmin, NotificationTemplateAdmin, register, UserNotificationPreferenceAdmin

### Community 63 - "CMS and Page Content"
Cohesion: 0.67
Nodes (3): PageAdmin, register, SiteContentAdmin

## Knowledge Gaps
- **162 isolated node(s):** `Migration`, `Migration`, `Meta`, `Meta`, `Migration` (+157 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **71 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BusinessException` connect `Authentication and User Management` to `Authentication and User Management`, `Inventory and Stock Reservation`, `Authentication and User Management`, `Analytics and Event Tracking`, `Category Hierarchy & Taxonomy`, `Authentication and User Management`, `Product Variants & Options`, `Customer Wishlist Management`, `Product Collections & Grouping`, `End-to-End Journey Tests`, `Notifications & Communication Templates`, `Product Variants & Options`, `CMS and Page Content`, `Authentication and User Management`, `CMS and Page Content`, `Product Variants & Options`, `Inventory and Stock Reservation`, `Testing & Mock Factories 23`, `Notifications & Communication Templates`, `Cart Management and Checkout`, `Product Variants & Options`, `Product Variants & Options`, `Authentication and User Management`, `CMS and Page Content`, `Notifications & Communication Templates`, `Authentication and User Management`, `Users Subsystem 42`, `Orders and Payment Processing`, `Notifications & Communication Templates`?**
  _High betweenness centrality (0.234) - this node is a cross-community bridge._
- **Why does `BaseModel` connect `Media Assets & Uploads` to `Inventory and Stock Reservation`, `Notifications & Communication Templates`, `Authentication and User Management`, `Analytics and Event Tracking`, `Category Hierarchy & Taxonomy`, `Authentication and User Management`, `Authentication and User Management`, `Authentication and User Management`, `Product Collections & Grouping`, `Product Variants & Options`, `Customer Wishlist Management`, `Product Variants & Options`, `CMS and Page Content`, `Notifications & Communication Templates`, `Product Variants & Options`, `Inventory and Stock Reservation`, `Notifications & Communication Templates`, `Authentication and User Management`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `AuthService` connect `Authentication and User Management` to `End-to-End Journey Tests`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `ProductFactory` (e.g. with `TestPublicAPI` and `TestProductService`) actually correct?**
  _`ProductFactory` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `VariantFactory` (e.g. with `TestAdminAPI` and `TestPublicAPI`) actually correct?**
  _`VariantFactory` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Migration`, `Migration`, `Meta` to the rest of the system?**
  _162 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authentication and User Management` be split into smaller, more focused modules?**
  _Cohesion score 0.050883898709985664 - nodes in this community are weakly interconnected._