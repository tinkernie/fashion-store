import { create } from "zustand";
import { api } from "@/lib/api";
import { getStoredAuth, isTokenExpired } from "@/lib/auth";

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

const checkHasAuth = (): boolean => {
  const { accessToken, refreshToken } = getStoredAuth();
  return Boolean(
    (accessToken && !isTokenExpired(accessToken, 0)) ||
    (refreshToken && !isTokenExpired(refreshToken, 0))
  );
};

export const useWishlist = create<WishlistStore>((set, get) => ({
  items: getSavedWishlist(),

  fetchWishlist: async () => {
    if (typeof window === "undefined") return;
    if (!checkHasAuth()) {
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
          price: Number(item.product_price || item.price) || 0,
          imageUrl: item.product_image || item.imageUrl || item.image || "/globe.svg",
          category: item.category || "پوشاک",
        }));
        set({ items: mappedItems });
        saveWishlist(mappedItems);
      }
    } catch {
      // If unauthorized or backend offline, reset if unauthenticated
      if (!checkHasAuth()) {
        set({ items: [] });
        saveWishlist([]);
      }
    }
  },

  addItem: async (item) => {
    if (!get().items.find((i) => i.id === item.id)) {
      const updated = [...get().items, item];
      set({ items: updated });
      saveWishlist(updated);

      if (checkHasAuth()) {
        try {
          await api.post('/api/wishlist/add_item/', {
            product_id: item.id,
          });
        } catch {
          // Silent local fallback
        }
      }
    }
  },

  removeItem: async (id) => {
    const updated = get().items.filter((i) => i.id !== id);
    set({ items: updated });
    saveWishlist(updated);

    if (checkHasAuth()) {
      try {
        await api.post('/api/wishlist/remove-item/', {
          product_id: id,
        });
      } catch {
        // Silent local fallback
      }
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
    if (!checkHasAuth()) {
      useWishlist.getState().resetWishlist();
    } else {
      useWishlist.getState().fetchWishlist();
    }
  };

  window.addEventListener("auth-change", syncWishlistWithAuth);
  window.addEventListener("storage", syncWishlistWithAuth);
}