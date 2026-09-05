import { create } from 'zustand';
import { api } from '@/lib/api';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  size: string;
  quantity: number;
  variant_id?: string;
}

export interface AppliedCoupon {
  code: string;
  discount_type?: 'fixed' | 'percentage';
  discount_value?: number;
  discount_amount: number;
}

interface CartStore {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  isLoading: boolean;
  getGuestSessionKey: () => string;
  fetchCart: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string, size: string, variant_id?: string) => Promise<void>;
  updateQuantity: (id: string, size: string, quantity: number, variant_id?: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<void>;
  mergeCart: (session_key?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getDiscountAmount: () => number;
  getFinalTotal: () => number;
}

const GUEST_KEY_STORAGE = 'guest_cart_session_key';

const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  coupon: null,
  isLoading: false,

  getGuestSessionKey: () => {
    if (typeof window === 'undefined') return '';
    let key = localStorage.getItem(GUEST_KEY_STORAGE);
    if (!key) {
      key = generateUUID();
      localStorage.setItem(GUEST_KEY_STORAGE, key);
    }
    return key;
  },

  fetchCart: async () => {
    try {
      set({ isLoading: true });
      const guestKey = get().getGuestSessionKey();
      const response = await api.get(`/api/cart/${guestKey ? `?session_key=${guestKey}` : ''}`, {
        headers: guestKey ? { 'X-Cart-Session-Key': guestKey } : {},
      });

      if (response.data && response.data.items) {
        const mapped = response.data.items.map((it: any) => ({
          id: String(it.id),
          variant_id: it.variant_id ? String(it.variant_id) : undefined,
          name: it.product_title || it.name || "محصول",
          price: parseFloat(it.price) || 0,
          imageUrl: it.image?.url || it.image || it.imageUrl || "",
          size: it.option_details || it.size || "",
          quantity: it.quantity || 1,
        }));

        let couponData: AppliedCoupon | null = null;
        if (response.data.coupon || response.data.coupon_code) {
          const discAmt = parseFloat(response.data.discount_amount) || 0;
          const discType = response.data.coupon?.discount_type || response.data.discount_type;
          const discVal = parseFloat(response.data.coupon?.discount_value ?? response.data.discount_value) || 0;
          couponData = {
            code: response.data.coupon?.code || response.data.coupon_code || (typeof response.data.coupon === "string" ? response.data.coupon : ""),
            discount_amount: discAmt,
            discount_type: discType,
            discount_value: discVal,
          };
        }

        set({ items: mapped, coupon: couponData });
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (item) => {
    const previousItems = get().items;

    // Optimistic UI Update
    set((state) => {
      const existingItem = state.items.find(
        (i) => (i.variant_id && item.variant_id ? i.variant_id === item.variant_id : i.id === item.id && i.size === item.size)
      );
      
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            (i.variant_id && item.variant_id ? i.variant_id === item.variant_id : i.id === item.id && i.size === item.size)
              ? { ...i, quantity: i.quantity + (item.quantity || 1) }
              : i
          ),
        };
      }
      
      return { items: [...state.items, { ...item, quantity: item.quantity || 1 }] };
    });

    // Backend Sync
    try {
      const guestKey = get().getGuestSessionKey();
      await api.post(
        '/api/cart/add_item/',
        {
          variant_id: item.variant_id || item.id,
          quantity: item.quantity || 1,
          session_key: guestKey,
        },
        {
          headers: guestKey ? { 'X-Cart-Session-Key': guestKey } : {},
        }
      );
    } catch (error) {
      // Revert optimistic update on backend error (e.g. out of stock / reservation failure)
      set({ items: previousItems });
      await get().fetchCart();
      throw error;
    }
  },
  
  removeItem: async (id, size, variant_id) => {
    const previousItems = get().items;

    // Optimistic UI Update
    set((state) => ({
      items: state.items.filter((i) => !(i.id === id && i.size === size)),
    }));

    // Backend Sync
    try {
      const guestKey = get().getGuestSessionKey();
      await api.post(
        '/api/cart/remove-item/',
        {
          variant_id: variant_id || id,
          session_key: guestKey,
        },
        {
          headers: guestKey ? { 'X-Cart-Session-Key': guestKey } : {},
        }
      );
    } catch (error) {
      set({ items: previousItems });
      await get().fetchCart();
      throw error;
    }
  },

  updateQuantity: async (id, size, quantity, variant_id) => {
    const previousItems = get().items;

    set((state) => ({
      items: state.items.map((i) =>
        i.id === id && i.size === size ? { ...i, quantity } : i
      ),
    }));

    try {
      const guestKey = get().getGuestSessionKey();
      await api.post(
        '/api/cart/update-quantity/',
        {
          variant_id: variant_id || id,
          quantity: quantity,
          session_key: guestKey,
        },
        {
          headers: guestKey ? { 'X-Cart-Session-Key': guestKey } : {},
        }
      );
    } catch (error) {
      set({ items: previousItems });
      await get().fetchCart();
      throw error;
    }
  },

  applyCoupon: async (code: string) => {
    try {
      const guestKey = get().getGuestSessionKey();
      const res = await api.post(
        '/api/cart/apply-coupon/',
        { code, session_key: guestKey },
        { headers: guestKey ? { 'X-Cart-Session-Key': guestKey } : {} }
      );
      if (res.data) {
        const discAmt = parseFloat(res.data.discount_amount) || 0;
        const discType = res.data.coupon?.discount_type || res.data.discount_type;
        const discVal = parseFloat(res.data.coupon?.discount_value ?? res.data.discount_value) || 0;

        set({
          coupon: {
            code: res.data.coupon?.code || res.data.coupon_code || code,
            discount_amount: discAmt,
            discount_type: discType,
            discount_value: discVal,
          },
        });
        await get().fetchCart();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to apply coupon:", e);
      throw e;
    }
  },

  removeCoupon: async () => {
    try {
      const guestKey = get().getGuestSessionKey();
      await api.post(
        '/api/cart/remove-coupon/',
        { session_key: guestKey },
        { headers: guestKey ? { 'X-Cart-Session-Key': guestKey } : {} }
      );
      set({ coupon: null });
      await get().fetchCart();
    } catch (e) {
      console.error("Failed to remove coupon:", e);
    }
  },

  mergeCart: async (session_key?: string) => {
    try {
      const keyToMerge = session_key || (typeof window !== 'undefined' ? localStorage.getItem(GUEST_KEY_STORAGE) : null);
      if (!keyToMerge) {
        await get().fetchCart();
        return;
      }

      await api.post('/api/cart/merge/', { session_key: keyToMerge });
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_KEY_STORAGE);
      }
      await get().fetchCart();
    } catch (error) {
      console.error("Failed to merge backend cart:", error);
      await get().fetchCart();
    }
  },
  
  clearCart: async () => {
    set({ items: [], coupon: null });
    try {
      const guestKey = get().getGuestSessionKey();
      await api.post(
        '/api/cart/clear/',
        { session_key: guestKey },
        { headers: guestKey ? { 'X-Cart-Session-Key': guestKey } : {} }
      );
    } catch (error) {
      console.error("Failed to clear backend cart:", error);
    }
  },
  
  getTotal: () => {
    return get().items.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
  },

  getDiscountAmount: () => {
    const coupon = get().coupon;
    if (!coupon) return 0;
    
    const discAmount = Number(coupon.discount_amount) || 0;
    if (discAmount > 0) {
      return discAmount;
    }
    
    const total = get().getTotal();
    const discVal = Number(coupon.discount_value) || 0;
    
    if (coupon.discount_type === 'percentage' && discVal > 0) {
      return Math.round((total * discVal) / 100);
    }
    if (coupon.discount_type === 'fixed' && discVal > 0) {
      return Math.min(discVal, total);
    }
    return discAmount;
  },

  getFinalTotal: () => {
    const total = get().getTotal();
    const discount = get().getDiscountAmount();
    return Math.max(0, total - discount);
  },
}));

// Automatically synchronize cart on login or logout
if (typeof window !== 'undefined') {
  window.addEventListener('auth-change', () => {
    useCart.getState().fetchCart();
  });
}