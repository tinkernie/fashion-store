# Graph Report - fashion-store  (2026-08-28)

## Corpus Check
- 14 files · ~69,803 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1913 nodes · 4066 edges · 208 communities (137 shown, 71 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 304 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Admin Portal & Management
- Admin Portal & Management
- Admin Portal & Management
- Admin Portal & Management
- Admin Portal & Management
- django_db / patch
- Admin Portal & Management
- Admin Portal & Management
- Shopping Cart & Items
- Admin Portal & Management
- loading.tsx / Loading()
- Admin Portal & Management
- test_e2e_journeys.py / admin()
- Admin Portal & Management
- Admin Portal & Management
- tsconfig.json / compilerOptions
- Admin Portal & Management
- notifications/signals.py / Meta
- cms/tests/factories.py / Meta
- Admin Portal & Management
- auth/page.tsx / AuthPage()
- cms/serializers.py / PageSerializer
- Meta / OptionValueFactory
- Orders & Checkout Processing
- components.json / aliases
- Admin Portal & Management
- .get_options_for_product() / OptionValueSerializer
- User Accounts & Authentication
- Shopping Cart & Items
- django_db / TestGuestCartAPI
- managers.py / UserManager
- Products & Catalog Domain
- User Accounts & Authentication
- babel-plugin-react-compiler / eslint
- User Accounts & Authentication
- Admin Portal & Management
- Payments & Gateways
- axios / class-variance-authority
- Admin Portal & Management
- collections/[slug]/page.tsx / CollectionPage()
- Orders & Checkout Processing
- Orders & Checkout Processing
- Search & Catalog Discovery
- User Accounts & Authentication
- Admin Portal & Management
- Payments & Gateways
- notifications/serializers.py / MarkReadSerializer
- User Accounts & Authentication
- .mark_all_as_read() / NotificationSelector
- Admin Portal & Management
- .update_page() / .get_page_by_slug()
- Meta / UserNotificationPreference
- atomic / VariantRepository
- Notification / .__str__()
- package.json / name
- Payments & Gateways
- app/layout.tsx / metadata
- .get_option_by_id() / ProductOptionService
- Search & Catalog Discovery
- SiteContentRepository / .delete_by_key()
- notifications/apps.py / NotificationsConfig
- seed_data.py / Command
- middleware.py / AuditLogMiddleware
- User Accounts & Authentication
- Shopping Cart & Items
- categories/apps.py / CategoriesConfig
- cms/apps.py / CmsConfig
- common/apps.py / CommonConfig
- core/apps.py / CoreConfig
- pagination.py / StandardPagination
- core/views.py / BaseAPIView
- coupons/apps.py / CouponsConfig
- Inventory & Stock Reservation
- manage.py / main()
- media_libm/apps.py / MediaConfig
- Orders & Checkout Processing
- Payments & Gateways
- product_options/apps.py / ProductOptionsConfig
- Products & Catalog Domain
- Search & Catalog Discovery
- store_collections/apps.py / AppConfig
- User Accounts & Authentication
- variants/apps.py / AppConfig
- Admin Portal & Management
- wishlist/apps.py / AppConfig
- product-card.tsx / ProductCard()
- Migration
- Migration
- User Accounts & Authentication
- User Accounts & Authentication
- Shopping Cart & Items
- Shopping Cart & Items
- Migration
- Migration
- Migration
- asgi.py
- wsgi.py
- Migration
- Migration
- Inventory & Stock Reservation
- Migration
- Migration
- Orders & Checkout Processing
- Orders & Checkout Processing
- Payments & Gateways
- Migration
- Products & Catalog Domain
- Products & Catalog Domain
- Migration
- User Accounts & Authentication
- Migration
- Migration
- clsx / clsx
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
- `InventoryService` --uses--> `Product`  [INFERRED]
  backend/inventory/services.py → backend/products/models.py
- `CartService` --uses--> `Product`  [INFERRED]
  backend/cart/services.py → backend/products/models.py
- `Command` --uses--> `Product`  [INFERRED]
  backend/common/management/commands/seed_data.py → backend/products/models.py
- `ProductService` --uses--> `CategorySelector`  [INFERRED]
  backend/products/services.py → backend/categories/selectors.py
- `TestProductService` --uses--> `ProductFactory`  [INFERRED]
  backend/products/tests/test_services.py → backend/products/tests/factories.py

## Import Cycles
- None detected.

## Communities (208 total, 71 thin omitted)

### Community 0 - "Admin Portal & Management"
Cohesion: 0.05
Nodes (45): APIView, EmailVerificationTokenAdmin, register, EmailVerificationToken, Meta, IsTokenValid, TokenRepository, UserRepository (+37 more)

### Community 1 - "Admin Portal & Management"
Cohesion: 0.05
Nodes (36): InventoryAdmin, register, ReservationAdmin, Inventory, Meta, Reservation, Status, InventoryRepository (+28 more)

### Community 2 - "Admin Portal & Management"
Cohesion: 0.05
Nodes (25): action, ProductAdmin, register, Meta, Product, BaseModel, Review, Status (+17 more)

### Community 3 - "Admin Portal & Management"
Cohesion: 0.06
Nodes (29): CollectionAdmin, CollectionProductInline, register, Collection, CollectionProduct, Meta, CollectionRepository, atomic (+21 more)

### Community 4 - "Admin Portal & Management"
Cohesion: 0.05
Nodes (30): CategoryAdmin, register, Category, Meta, MPTTMeta, CategoryRepository, CategorySelector, Return active root nodes with their active descendants as a tree. (+22 more)

### Community 5 - "django_db / patch"
Cohesion: 0.07
Nodes (27): django_db, patch, TestSignals, Meta, UserFactory, CouponAdmin, CouponUsageAdmin, register (+19 more)

### Community 6 - "Admin Portal & Management"
Cohesion: 0.07
Nodes (25): MediaAdmin, register, Media, MediaType, Meta, MediaRepository, MediaSelector, MediaUpdateSerializer (+17 more)

### Community 7 - "Admin Portal & Management"
Cohesion: 0.07
Nodes (24): register, TrackedEventAdmin, AnalyticsConfig, AppConfig, cart_changed_handler(), order_placed_handler(), Meta, TrackedEvent (+16 more)

### Community 8 - "Shopping Cart & Items"
Cohesion: 0.08
Nodes (21): Cart, CartItem, Meta, CartItemRepository, CartRepository, CartSelector, CartService, atomic (+13 more)

### Community 9 - "Admin Portal & Management"
Cohesion: 0.08
Nodes (20): register, WishlistAdmin, WishlistItemInline, Meta, Wishlist, WishlistItem, WishlistRepository, WishlistSelector (+12 more)

### Community 10 - "loading.tsx / Loading()"
Cohesion: 0.09
Nodes (29): metadata, FilterFacet, POPULAR_KEYWORDS, PRESET_COLORS, ProductItem, SearchPage(), SORT_OPTIONS, DropdownMenu() (+21 more)

### Community 11 - "Admin Portal & Management"
Cohesion: 0.11
Nodes (18): register, VariantAdmin, VariantOptionInline, Availability, Meta, BaseModel, Status, Variant (+10 more)

### Community 12 - "test_e2e_journeys.py / admin()"
Cohesion: 0.08
Nodes (19): admin(), authenticate(), catalog(), client(), create_order(), customer(), customer_b(), End-to-end API journeys for the Luxe shop. Run with:: pytest -q… (+11 more)

### Community 13 - "Admin Portal & Management"
Cohesion: 0.14
Nodes (19): STATUS_TABS, getStepIndex(), getUserIdFromToken(), ORDER_STEPS, ProfilePage(), Dialog(), DialogContent(), DialogDescription() (+11 more)

### Community 14 - "Admin Portal & Management"
Cohesion: 0.10
Nodes (5): Button(), buttonVariants, CMSPage, ProductReview, SiteContentData

### Community 15 - "tsconfig.json / compilerOptions"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 16 - "Admin Portal & Management"
Cohesion: 0.16
Nodes (10): OptionValueInline, ProductOptionAdmin, register, Meta, OptionValue, ProductOption, OptionValueRepository, ProductOptionRepository (+2 more)

### Community 17 - "notifications/signals.py / Meta"
Cohesion: 0.15
Nodes (13): Meta, NotificationFactory, NotificationTemplateFactory, PreferenceFactory, DjangoModelFactory, django_db, TestUserEndpoints, django_db (+5 more)

### Community 18 - "cms/tests/factories.py / Meta"
Cohesion: 0.15
Nodes (10): Meta, PageFactory, DjangoModelFactory, SiteContentFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 19 - "Admin Portal & Management"
Cohesion: 0.16
Nodes (11): PageAdmin, register, SiteContentAdmin, Meta, Page, Key-value store for global site sections. Expected keys: 'homepage', 'header',…, SiteContent, Status (+3 more)

### Community 20 - "auth/page.tsx / AuthPage()"
Cohesion: 0.11
Nodes (20): AuthPage(), ForgotPasswordForm, forgotPasswordSchema, getApiErrorMessage(), identifierValidator, LoginForm, loginSchema, passwordRegisterSchema (+12 more)

### Community 21 - "cms/serializers.py / PageSerializer"
Cohesion: 0.15
Nodes (8): PageSerializer, PageUpdateSerializer, SiteContentSerializer, AdminPageViewSet, AdminSiteContentViewSet, PublicPageViewSet, PublicSiteContentViewSet, action

### Community 22 - "Meta / OptionValueFactory"
Cohesion: 0.18
Nodes (10): Meta, OptionValueFactory, ProductOptionFactory, DjangoModelFactory, django_db, TestAdminAPI, TestPublicAPI, django_db (+2 more)

### Community 23 - "Orders & Checkout Processing"
Cohesion: 0.17
Nodes (7): Order, Status, atomic, OrderSelector, OrderService, atomic, Return stock for all items if order is cancelled before shipping.

### Community 24 - "components.json / aliases"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 25 - "Admin Portal & Management"
Cohesion: 0.19
Nodes (7): PaymentAdmin, register, Meta, Payment, Status, PaymentRepository, PaymentSelector

### Community 26 - ".get_options_for_product() / OptionValueSerializer"
Cohesion: 0.20
Nodes (7): OptionValueSerializer, ProductOptionDetailSerializer, ProductOptionSerializer, OptionValueService, AdminProductOptionViewSet, PublicProductOptionViewSet, action

### Community 27 - "User Accounts & Authentication"
Cohesion: 0.11
Nodes (4): AbstractBaseUser, User, PermissionsMixin, QuerySet

### Community 28 - "Shopping Cart & Items"
Cohesion: 0.22
Nodes (8): ApplyCouponSerializer, CartAddItemSerializer, CartMergeSerializer, CartUpdateQuantitySerializer, CartViewSet, action, Merge guest cart into user cart (called after login). Must be authenticated., Ensure a session key exists for guest users.

### Community 29 - "django_db / TestGuestCartAPI"
Cohesion: 0.13
Nodes (10): django_db, TestGuestCartAPI, Meta, DjangoModelFactory, post_generation, VariantFactory, django_db, TestPublicAPI (+2 more)

### Community 30 - "managers.py / UserManager"
Cohesion: 0.16
Nodes (11): UserManager, BaseModel, Meta, Ultimate base for all domain entities., SoftDeleteManager, SoftDeleteModel, TimestampedModel, UUIDPrimaryKeyMixin (+3 more)

### Community 31 - "Products & Catalog Domain"
Cohesion: 0.14
Nodes (9): Meta, ProductFactory, DjangoModelFactory, django_db, TestPublicAPI, django_db, TestSearchAPI, django_db (+1 more)

### Community 32 - "User Accounts & Authentication"
Cohesion: 0.19
Nodes (10): IsSelf, Object-level permission to only allow users to edit their own profile., AdminUserSerializer, AdminUserUpdateSerializer, AssignGroupsSerializer, ChangeEmailSerializer, ConfirmEmailSerializer, UpdateProfileSerializer (+2 more)

### Community 33 - "babel-plugin-react-compiler / eslint"
Cohesion: 0.11
Nodes (19): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, tailwindcss (+11 more)

### Community 34 - "User Accounts & Authentication"
Cohesion: 0.18
Nodes (7): EmailChangeRequest, Meta, UserRepository, UserSelector, shared_task, send_email_change_verification(), UserValidator

### Community 35 - "Admin Portal & Management"
Cohesion: 0.22
Nodes (10): OrderAdmin, OrderItemInline, register, StatusHistoryInline, Meta, OrderItem, OrderSequence, OrderStatusHistory (+2 more)

### Community 36 - "Payments & Gateways"
Cohesion: 0.18
Nodes (9): CallbackSerializer, InitiatePaymentSerializer, PaymentService, django_db, patch, TestPaymentService, CallbackViewSet, PaymentViewSet (+1 more)

### Community 37 - "axios / class-variance-authority"
Cohesion: 0.12
Nodes (17): axios, class-variance-authority, dependencies, axios, class-variance-authority, lucide-react, next, next-themes (+9 more)

### Community 38 - "Admin Portal & Management"
Cohesion: 0.17
Nodes (6): NAV_ITEMS, OptionDef, VariantItem, MediaUploader(), MediaUploaderProps, Input()

### Community 39 - "collections/[slug]/page.tsx / CollectionPage()"
Cohesion: 0.18
Nodes (5): CollectionsSection(), api, useWishlist, WishlistItem, WishlistStore

### Community 40 - "Orders & Checkout Processing"
Cohesion: 0.21
Nodes (7): CreateOrderSerializer, Meta, OrderListSerializer, StatusTransitionSerializer, AdminOrderViewSet, action, UserOrderViewSet

### Community 41 - "Orders & Checkout Processing"
Cohesion: 0.19
Nodes (8): Meta, OrderFactory, OrderItemFactory, DjangoModelFactory, django_db, TestAdminEndpoints, TestUserEndpoints, TestStatusTransitions

### Community 42 - "Search & Catalog Discovery"
Cohesion: 0.21
Nodes (5): Build available filters based on the current product queryset. Returns a dict…, SearchSelector, SearchService, django_db, TestSearchService

### Community 43 - "User Accounts & Authentication"
Cohesion: 0.23
Nodes (7): GroupFactory, Meta, UserFactory, django_db, TestUserEndpoints, django_db, TestUserService

### Community 44 - "Admin Portal & Management"
Cohesion: 0.20
Nodes (8): NotificationAdmin, NotificationTemplateAdmin, register, UserNotificationPreferenceAdmin, Command, BaseCommand, NotificationTemplate, TemplateRepository

### Community 45 - "Payments & Gateways"
Cohesion: 0.16
Nodes (6): ABC, BasePaymentGateway, Validate callback payload and return: - 'gateway_reference': str - 'status':…, Return a dict with at least: - 'gateway_reference': str - 'status': str…, DummyGateway, BasePaymentGateway

### Community 46 - "notifications/serializers.py / MarkReadSerializer"
Cohesion: 0.23
Nodes (6): MarkReadSerializer, NotificationListSerializer, PreferenceSerializer, AdminNotificationViewSet, action, UserNotificationViewSet

### Community 47 - "User Accounts & Authentication"
Cohesion: 0.23
Nodes (4): APIException, InvalidTokenException, TokenExpiredException, BusinessException

### Community 48 - ".mark_all_as_read() / NotificationSelector"
Cohesion: 0.24
Nodes (3): NotificationSelector, NotificationService, Create an in-app notification and conditionally send an email.

### Community 49 - "Admin Portal & Management"
Cohesion: 0.29
Nodes (3): UserService, AdminUserViewSet, action

### Community 51 - "Meta / UserNotificationPreference"
Cohesion: 0.29
Nodes (4): Meta, UserNotificationPreference, PreferenceRepository, PreferenceSelector

### Community 52 - "atomic / VariantRepository"
Cohesion: 0.24
Nodes (4): atomic, option_assignments: [{'option_id': ..., 'value_id': ...}, ...], VariantRepository, Ensure each assignment has a valid option_id and value_id, and the value…

### Community 53 - "Notification / .__str__()"
Cohesion: 0.33
Nodes (4): Notification, NotificationRepository, shared_task, send_notification_email()

### Community 54 - "package.json / name"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 55 - "Payments & Gateways"
Cohesion: 0.25
Nodes (5): Meta, PaymentFactory, DjangoModelFactory, django_db, TestPaymentAPI

### Community 56 - "app/layout.tsx / metadata"
Cohesion: 0.32
Nodes (4): metadata, vazirmatn, Footer(), Toaster()

### Community 58 - "Search & Catalog Discovery"
Cohesion: 0.43
Nodes (3): SearchSerializer, action, SearchViewSet

### Community 60 - "notifications/apps.py / NotificationsConfig"
Cohesion: 0.40
Nodes (3): NotificationsConfig, AppConfig, order_status_changed_handler()

## Knowledge Gaps
- **165 isolated node(s):** `Migration`, `Migration`, `Migration`, `Migration`, `Migration` (+160 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **71 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BusinessException` connect `User Accounts & Authentication` to `Admin Portal & Management`, `Admin Portal & Management`, `Admin Portal & Management`, `Admin Portal & Management`, `Admin Portal & Management`, `django_db / patch`, `Admin Portal & Management`, `Admin Portal & Management`, `Shopping Cart & Items`, `Admin Portal & Management`, `Admin Portal & Management`, `Admin Portal & Management`, `notifications/signals.py / Meta`, `cms/tests/factories.py / Meta`, `Admin Portal & Management`, `Meta / OptionValueFactory`, `Orders & Checkout Processing`, `Admin Portal & Management`, `.get_options_for_product() / OptionValueSerializer`, `User Accounts & Authentication`, `User Accounts & Authentication`, `Admin Portal & Management`, `Payments & Gateways`, `Orders & Checkout Processing`, `User Accounts & Authentication`, `Admin Portal & Management`, `Admin Portal & Management`, `.update_page() / .get_page_by_slug()`, `atomic / VariantRepository`, `Notification / .__str__()`, `.get_option_by_id() / ProductOptionService`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Why does `BaseModel` connect `managers.py / UserManager` to `Admin Portal & Management`, `Admin Portal & Management`, `Admin Portal & Management`, `django_db / patch`, `Admin Portal & Management`, `Admin Portal & Management`, `Shopping Cart & Items`, `Admin Portal & Management`, `Admin Portal & Management`, `Admin Portal & Management`, `Admin Portal & Management`, `Admin Portal & Management`, `Notification / .__str__()`, `Orders & Checkout Processing`, `Admin Portal & Management`, `User Accounts & Authentication`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `ProductFactory` connect `Products & Catalog Domain` to `Admin Portal & Management`, `Admin Portal & Management`, `Admin Portal & Management`, `Admin Portal & Management`, `Search & Catalog Discovery`, `Admin Portal & Management`, `Meta / OptionValueFactory`, `django_db / TestGuestCartAPI`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `ProductFactory` (e.g. with `TestPublicAPI` and `TestProductService`) actually correct?**
  _`ProductFactory` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `VariantFactory` (e.g. with `TestAdminAPI` and `TestPublicAPI`) actually correct?**
  _`VariantFactory` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Migration`, `Migration`, `Migration` to the rest of the system?**
  _165 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Portal & Management` be split into smaller, more focused modules?**
  _Cohesion score 0.050883898709985664 - nodes in this community are weakly interconnected._