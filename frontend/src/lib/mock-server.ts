// ============================================================================
// LUXE MOCK API SERVER (STANDALONE FRONTEND SIMULATOR)
//
// This file intercepts Axios requests when the backend is offline or when
// `NEXT_PUBLIC_ENABLE_MOCKS=true` is set.
//
// TO DELETE/DISABLE LATER WHEN BACKEND IS READY:
// 1. Delete `frontend/src/lib/mock-data.ts` and `frontend/src/lib/mock-server.ts`.
// 2. Remove `setupMockServer(api)` from `frontend/src/lib/api.ts`.
// ============================================================================

import { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import {
  MOCK_PRODUCTS,
  MOCK_CATEGORIES,
  MOCK_COLLECTIONS,
  MOCK_REVIEWS,
  MOCK_USER,
  MOCK_ORDERS,
  MOCK_NOTIFICATIONS,
  MOCK_COUPONS,
  MOCK_CMS_PAGES,
  MOCK_SITE_CONTENT,
  MOCK_ADMIN_DASHBOARD,
  MockProduct,
} from "./mock-data";

const CART_STORAGE_KEY = "mock_luxe_cart";
const ORDERS_STORAGE_KEY = "mock_luxe_orders";

// Helper: Simulated delay
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: LocalStorage Cart State Manager
function getStoredCart(): { items: any[]; coupon: any; coupon_code?: string | null; discount_amount?: string | null } {
  if (typeof window === "undefined") return { items: [], coupon: null };
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { items: [], coupon: null };
  } catch {
    return { items: [], coupon: null };
  }
}

function saveStoredCart(cart: any) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {}
  }
}

// Helper: Stored Orders Manager
function getStoredOrders(): any[] {
  if (typeof window === "undefined") return MOCK_ORDERS;
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : MOCK_ORDERS;
  } catch {
    return MOCK_ORDERS;
  }
}

function saveStoredOrders(orders: any[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch {}
  }
}

// Helper to construct a mock AxiosResponse
function createMockResponse(data: any, status = 200, config: InternalAxiosRequestConfig): AxiosResponse {
  return {
    data,
    status,
    statusText: status === 200 || status === 201 ? "OK" : "Error",
    headers: {},
    config,
  };
}

export function setupMockServer(axiosInstance: AxiosInstance) {
  // Check if mock is enabled
  const isMockExplicitlyDisabled = process.env.NEXT_PUBLIC_ENABLE_MOCKS === "false";
  if (isMockExplicitlyDisabled) return;

  axiosInstance.interceptors.request.use(async (config) => {
    const url = config.url || "";
    const method = (config.method || "get").toLowerCase();
    const data = typeof config.data === "string" ? JSON.parse(config.data || "{}") : config.data || {};
    const params = config.params || {};

    // Simulated Latency
    await delay(100);

    // ------------------------------------------------------------------------
    // 1. AUTHENTICATION ENDPOINTS
    // ------------------------------------------------------------------------
    if (url.includes("/api/auth/login/") && method === "post") {
      const { email, password } = data;
      if (!email || !password) {
        throw { response: { status: 400, data: { code: "invalid_credentials", detail: "ایمیل و رمز عبور را وارد کنید" } } };
      }
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse({
          access: "mock_jwt_access_token_luxe_" + Date.now(),
          refresh: "mock_jwt_refresh_token_luxe_" + Date.now(),
          user: {
            id: MOCK_USER.id,
            email: email || MOCK_USER.email,
            first_name: MOCK_USER.first_name,
            last_name: MOCK_USER.last_name,
            is_staff: true,
            is_superuser: true,
          },
        }, 200, config),
      });
    }

    if (url.includes("/api/auth/register/") && method === "post") {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse({
          id: "usr-" + Math.random().toString(36).substring(2, 8),
          email: data.email || "user@example.com",
          message: "کاربر با موفقیت ثبت نام شد. لینک فعال‌سازی ارسال گردید.",
        }, 201, config),
      });
    }

    if (url.includes("/api/auth/verify-email/") && method === "post") {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse({ message: "ایمیل شما با موفقیت تایید شد." }, 200, config),
      });
    }

    if (url.includes("/api/auth/resend-verification/") && method === "post") {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse({ message: "ایمیل فعال‌سازی مجدداً ارسال گردید." }, 200, config),
      });
    }

    if (url.includes("/api/auth/password-reset/") && method === "post") {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse({ message: "لینک بازیابی رمز عبور به ایمیل شما ارسال شد." }, 200, config),
      });
    }

    if (url.includes("/api/auth/token/refresh/") && method === "post") {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse({ access: "mock_jwt_access_token_refreshed_" + Date.now() }, 200, config),
      });
    }

    if (url.includes("/api/auth/logout/") && method === "post") {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse({ message: "با موفقیت خارج شدید." }, 200, config),
      });
    }

    // ------------------------------------------------------------------------
    // 2. SITE CONTENT & BANNER ENDPOINTS
    // ------------------------------------------------------------------------
    if (url.includes("/api/site-content/hero/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(MOCK_SITE_CONTENT.hero, 200, config),
      });
    }

    if (url.includes("/api/site-content/announcement/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(MOCK_SITE_CONTENT.announcement, 200, config),
      });
    }

    // ------------------------------------------------------------------------
    // 3. CATEGORIES & COLLECTIONS
    // ------------------------------------------------------------------------
    if (url.includes("/api/categories/flat/")) {
      const flatList: any[] = [];
      MOCK_CATEGORIES.forEach((c: any) => {
        flatList.push({ id: c.id, name: c.name, slug: c.slug, level: c.level });
        c.children?.forEach((sub: any) => flatList.push({ id: sub.id, name: sub.name, slug: sub.slug, level: sub.level }));
      });
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(flatList, 200, config),
      });
    }

    if (url.includes("/api/categories/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(MOCK_CATEGORIES, 200, config),
      });
    }

    if (url.match(/\/api\/collections\/([^\/]+)\/?$/) && method === "get") {
      const slug = url.split("/collections/")[1]?.replace(/\/$/, "");
      const collection = MOCK_COLLECTIONS.find((c: any) => c.slug === slug || c.id === slug) || MOCK_COLLECTIONS[0];
      const matchingProducts = MOCK_PRODUCTS.filter((p: MockProduct) => p.collection_slug === collection.slug || !p.collection_slug);
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse({
          ...collection,
          products: matchingProducts,
        }, 200, config),
      });
    }

    if (url.includes("/api/collections/") || url.includes("/api/store-collections/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(MOCK_COLLECTIONS, 200, config),
      });
    }

    // ------------------------------------------------------------------------
    // 4. PRODUCTS & REVIEWS
    // ------------------------------------------------------------------------
    // Product Options: /api/products/:id/options/
    if (url.match(/\/api\/products\/([^\/]+)\/options\/?$/)) {
      const prodId = url.split("/products/")[1].split("/options")[0];
      const product = MOCK_PRODUCTS.find((p: MockProduct) => p.id === prodId || p.slug === prodId) || MOCK_PRODUCTS[0];
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(product.options || [], 200, config),
      });
    }

    // Product Variants: /api/products/:id/variants/
    if (url.match(/\/api\/products\/([^\/]+)\/variants\/?$/)) {
      const prodId = url.split("/products/")[1].split("/variants")[0];
      const product = MOCK_PRODUCTS.find((p: MockProduct) => p.id === prodId || p.slug === prodId) || MOCK_PRODUCTS[0];
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(product.variants || [], 200, config),
      });
    }

    // Product Reviews: /api/products/:id/reviews/
    if (url.match(/\/api\/products\/([^\/]+)\/reviews\/?$/)) {
      const prodId = url.split("/products/")[1].split("/reviews")[0];
      if (method === "post") {
        const newRev = {
          id: "rev-" + Date.now(),
          user_name: data.name || "کاربر مهمان",
          rating: Number(data.rating) || 5,
          comment: data.comment || data.content || "",
          created_at: new Date().toISOString(),
          is_verified_purchase: true,
        };
        return Promise.reject({
          __mock_handled: true,
          response: createMockResponse(newRev, 201, config),
        });
      }
      const reviews = MOCK_REVIEWS[prodId] || [];
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(reviews, 200, config),
      });
    }

    // Single Product Detail: /api/products/:id/
    if (url.match(/\/api\/products\/([^\/]+)\/?$/) && !url.includes("search")) {
      const prodId = url.split("/products/")[1].replace(/\/$/, "");
      const product = MOCK_PRODUCTS.find((p: MockProduct) => p.id === prodId || p.slug === prodId);
      if (product) {
        return Promise.reject({
          __mock_handled: true,
          response: createMockResponse(product, 200, config),
        });
      }
      // Return first product as fallback
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(MOCK_PRODUCTS[0], 200, config),
      });
    }

    // Products List & Search: /api/products/ or /api/search/products/
    if (url.includes("/api/products/") || url.includes("/api/search/products/")) {
      let results = [...MOCK_PRODUCTS];

      const searchParam = params.search || (url.includes("search=") ? url.split("search=")[1].split("&")[0] : "");
      if (searchParam) {
        const q = decodeURIComponent(searchParam).toLowerCase();
        results = results.filter(
          (p: MockProduct) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
        );
      }

      const categoryParam = params.category || params.category_id;
      if (categoryParam) {
        results = results.filter((p: MockProduct) => p.category_id === categoryParam || p.category === categoryParam);
      }

      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse({
          count: results.length,
          results: results,
        }, 200, config),
      });
    }

    // ------------------------------------------------------------------------
    // 5. CART ENDPOINTS (Fully Interactive with LocalStorage)
    // ------------------------------------------------------------------------
    if (url.includes("/api/cart/add_item/") && method === "post") {
      const cart = getStoredCart();
      const variantId = data.variant_id;
      const quantity = Number(data.quantity) || 1;

      // Find matching product
      let matchedProd = MOCK_PRODUCTS.find((p: MockProduct) => p.id === variantId || p.variants.some((v: any) => v.id === variantId));
      if (!matchedProd) matchedProd = MOCK_PRODUCTS[0];

      const existingIndex = cart.items.findIndex((i: any) => i.variant_id === variantId || i.id === matchedProd?.id);
      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += quantity;
      } else {
        cart.items.push({
          id: matchedProd.id,
          variant_id: variantId,
          name: matchedProd.name,
          product_title: matchedProd.name,
          price: String(matchedProd.price),
          image: matchedProd.imageUrl,
          size: "M",
          quantity: quantity,
        });
      }
      saveStoredCart(cart);
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(cart, 200, config),
      });
    }

    if (url.includes("/api/cart/update-quantity/") && method === "post") {
      const cart = getStoredCart();
      const variantId = data.variant_id;
      const quantity = Number(data.quantity);
      cart.items = cart.items.map((i: any) => (i.variant_id === variantId || i.id === variantId ? { ...i, quantity } : i));
      saveStoredCart(cart);
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(cart, 200, config),
      });
    }

    if (url.includes("/api/cart/remove-item/") && method === "post") {
      const cart = getStoredCart();
      const variantId = data.variant_id;
      cart.items = cart.items.filter((i: any) => i.variant_id !== variantId && i.id !== variantId);
      saveStoredCart(cart);
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(cart, 200, config),
      });
    }

    if (url.includes("/api/cart/apply-coupon/") && method === "post") {
      const cart = getStoredCart();
      const code = String(data.code || "").toUpperCase();
      const matchedCoupon = MOCK_COUPONS.find((c: any) => c.code === code);
      if (!matchedCoupon) {
        throw { response: { status: 400, data: { code: "invalid_coupon", detail: "کد تخفیف وارد شده نامعتبر است." } } };
      }
      cart.coupon = matchedCoupon;
      cart.coupon_code = matchedCoupon.code;
      cart.discount_amount = matchedCoupon.discount_type === "percentage" ? "1000000.00" : matchedCoupon.discount_value;
      saveStoredCart(cart);
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(cart, 200, config),
      });
    }

    if (url.includes("/api/cart/remove-coupon/") && method === "post") {
      const cart = getStoredCart();
      cart.coupon = null;
      cart.coupon_code = null;
      cart.discount_amount = "0.00";
      saveStoredCart(cart);
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(cart, 200, config),
      });
    }

    if (url.includes("/api/cart/clear/") && method === "post") {
      saveStoredCart({ items: [], coupon: null });
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse({ message: "سبد خرید خالی شد." }, 200, config),
      });
    }

    if (url.includes("/api/cart/merge/") && method === "post") {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(getStoredCart(), 200, config),
      });
    }

    if (url.match(/\/api\/cart\/?/)) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(getStoredCart(), 200, config),
      });
    }

    // ------------------------------------------------------------------------
    // 6. ORDERS & PAYMENTS
    // ------------------------------------------------------------------------
    if (url.includes("/api/orders/checkout/") && method === "post") {
      const orders = getStoredOrders();
      const newOrderNumber = "LUXE-" + Math.floor(10000 + Math.random() * 90000);
      const newOrder = {
        id: "ord-" + Date.now(),
        order_number: newOrderNumber,
        status: "pending",
        status_display: "در انتظار پرداخت",
        total: "8450000.00",
        subtotal: "8450000.00",
        discount_amount: "0.00",
        shipping_cost: "0.00",
        placed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        shipping_address: data.shipping_address || {},
        billing_address: data.billing_address || {},
        items: getStoredCart().items,
      };
      orders.unshift(newOrder);
      saveStoredOrders(orders);
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(newOrder, 201, config),
      });
    }

    if (url.includes("/api/payments/initiate/") && method === "post") {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse({
          status: "succeeded",
          gateway_reference: "REF-" + Math.floor(100000 + Math.random() * 900000),
          authority: "PAY-LUXE-" + Date.now(),
          amount: "8450000.00",
        }, 200, config),
      });
    }

    if (url.match(/\/api\/orders\/([^\/]+)\/?$/)) {
      const orderId = url.split("/orders/")[1]?.replace(/\/$/, "");
      const orders = getStoredOrders();
      const order = orders.find((o: any) => o.id === orderId || o.order_number === orderId) || orders[0];
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(order, 200, config),
      });
    }

    if (url.includes("/api/orders/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(getStoredOrders(), 200, config),
      });
    }

    // ------------------------------------------------------------------------
    // 7. USER PROFILE & NOTIFICATIONS
    // ------------------------------------------------------------------------
    if (url.includes("/api/users/me/")) {
      if (method === "patch") {
        Object.assign(MOCK_USER, data);
      }
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(MOCK_USER, 200, config),
      });
    }

    if (url.includes("/api/notifications/preferences/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse({
          email_order_updates: true,
          email_promotions: false,
          sms_order_updates: true,
        }, 200, config),
      });
    }

    if (url.includes("/api/notifications/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(MOCK_NOTIFICATIONS, 200, config),
      });
    }

    // ------------------------------------------------------------------------
    // 8. CMS DYNAMIC PAGES
    // ------------------------------------------------------------------------
    if (url.match(/\/api\/pages\/([^\/]+)\/?$/) || url.match(/\/api\/admin\/cms\/pages\/([^\/]+)\/?$/)) {
      const slug = url.split("/pages/")[1]?.replace(/\/$/, "");
      const page = MOCK_CMS_PAGES.find((p: any) => p.slug === slug) || MOCK_CMS_PAGES[0];
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(page, 200, config),
      });
    }

    // ------------------------------------------------------------------------
    // 9. ADMIN BACKOFFICE APIS
    // ------------------------------------------------------------------------
    if (url.includes("/api/analytics/dashboard/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(MOCK_ADMIN_DASHBOARD, 200, config),
      });
    }

    if (url.includes("/api/admin/orders/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(getStoredOrders(), 200, config),
      });
    }

    if (url.includes("/api/admin/products/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(MOCK_PRODUCTS, 200, config),
      });
    }

    if (url.includes("/api/admin/inventory/")) {
      const invList = MOCK_PRODUCTS.flatMap((p: MockProduct) =>
        p.variants.map((v: any) => ({
          id: "inv-" + v.id,
          product_name: p.name,
          sku: v.sku,
          available_quantity: v.inventory.available_quantity,
          reserved_quantity: v.inventory.reserved_quantity,
          safety_stock: v.inventory.safety_stock,
          status: v.inventory.status,
        }))
      );
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(invList, 200, config),
      });
    }

    if (url.includes("/api/admin/coupons/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(MOCK_COUPONS, 200, config),
      });
    }

    if (url.includes("/api/admin/users/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse([MOCK_USER], 200, config),
      });
    }

    if (url.includes("/api/admin/cms/site-content/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(MOCK_SITE_CONTENT, 200, config),
      });
    }

    if (url.includes("/api/admin/cms/pages/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(MOCK_CMS_PAGES, 200, config),
      });
    }

    if (url.includes("/api/admin/reviews/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(Object.values(MOCK_REVIEWS).flat(), 200, config),
      });
    }

    if (url.includes("/api/admin/notifications/")) {
      return Promise.reject({
        __mock_handled: true,
        response: createMockResponse(MOCK_NOTIFICATIONS, 200, config),
      });
    }

    // Default passthrough for any other unhandled endpoint
    return config;
  });

  // Response interceptor to catch the mock-handled responses and return them as resolved promises
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.__mock_handled && error.response) {
        return Promise.resolve(error.response);
      }
      return Promise.reject(error);
    }
  );
}
