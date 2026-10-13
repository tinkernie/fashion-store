import { create } from "zustand";
import { api } from "@/lib/api";
import { hasValidAuthSession } from "@/lib/auth";
import { parsePrice } from "@/lib/price-utils";
import { useAuthModal } from "@/store/auth-modal";

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
}

interface WishlistStore {
  items: WishlistItem[];
  fetchWishlist: () => Promise<void>;
  addItem: (item: WishlistItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  isInWishlist: (id: string) => boolean;
  resetWishlist: () => void;
}

const WISHLIST_STORAGE_KEY = "luxury_wishlist_items";

const getSavedWishlist = (): WishlistItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveWishlist = (items: WishlistItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
};

export const useWishlist = create<WishlistStore>((set, get) => ({
  items: typeof window !== "undefined" && hasValidAuthSession() ? getSavedWishlist() : [],

  fetchWishlist: async () => {
    if (typeof window === "undefined") return;
    if (!hasValidAuthSession()) {
      set({ items: [] });
      saveWishlist([]);
      return;
    }

    try {
      const response = await api.get('/api/wishlist/');
      if (response.data && Array.isArray(response.data.items)) {
        const mappedItems: WishlistItem[] = response.data.items.map((item: any) => ({
          id: item.product_id || item.id,
          name: item.product_name || item.name || item.title || "محصول",
          price: parsePrice(item.product_price || item.price),
          imageUrl: item.product_image || item.imageUrl || item.image || "/placeholder-product.svg",
          category: item.category || "پوشاک",
        }));
        set({ items: mappedItems });
        saveWishlist(mappedItems);
      }
    } catch {
      // If unauthorized or backend offline, reset if unauthenticated
      if (!hasValidAuthSession()) {
        set({ items: [] });
        saveWishlist([]);
      }
    }
  },

  addItem: async (item) => {
    if (!hasValidAuthSession()) {
      useAuthModal.getState().openAuthModal("برای افزودن به علاقه مندی ها باید ابتدا وارد حساب کاربری خود شوید.");
      return;
    }

    const sanitizedItem = { ...item, price: parsePrice(item.price) };
    if (!get().items.find((i) => i.id === sanitizedItem.id)) {
      const updated = [...get().items, sanitizedItem];
      set({ items: updated });
      saveWishlist(updated);

      try {
        await api.post('/api/wishlist/add_item/', {
          product_id: item.id,
        });
      } catch {
        // Silent local fallback
      }
    }
  },

  removeItem: async (id) => {
    if (!hasValidAuthSession()) {
      set({ items: [] });
      saveWishlist([]);
      return;
    }

    const updated = get().items.filter((i) => i.id !== id);
    set({ items: updated });
    saveWishlist(updated);

    try {
      await api.post('/api/wishlist/remove-item/', {
        product_id: id,
      });
    } catch {
      // Silent local fallback
    }
  },

  isInWishlist: (id) => !!get().items.find((i) => i.id === id),

  resetWishlist: () => {
    set({ items: [] });
    if (typeof window !== "undefined") {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    }
  },
}));

// Automatically synchronize wishlist state on login or logout across window and storage events
if (typeof window !== "undefined") {
  const syncWishlistWithAuth = () => {
    if (!hasValidAuthSession()) {
      useWishlist.getState().resetWishlist();
    } else {
      useWishlist.getState().fetchWishlist();
    }
  };

  window.addEventListener("auth-change", syncWishlistWithAuth);
  window.addEventListener("storage", syncWishlistWithAuth);
}