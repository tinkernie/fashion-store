import { create } from "zustand";
import { api } from "@/lib/api";

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
  items: getSavedWishlist(),
  
  fetchWishlist: async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ items: getSavedWishlist() });
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
      // Unauthenticated or backend offline: use local state
      set({ items: getSavedWishlist() });
    }
  },

  addItem: async (item) => {
    if (!get().items.find((i) => i.id === item.id)) {
      const updated = [...get().items, item];
      set({ items: updated });
      saveWishlist(updated);
      
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (token) {
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
    
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
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
}));