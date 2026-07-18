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

export const useWishlist = create<WishlistStore>((set, get) => ({
  items: [],
  
  fetchWishlist: async () => {
    try {
      const response = await api.get('/api/wishlist/');
      if (response.data && response.data.items) {
        set({ items: response.data.items });
      }
    } catch (error) {
      console.error("Failed to fetch backend wishlist:", error);
    }
  },

  addItem: async (item) => {
    if (!get().items.find((i) => i.id === item.id)) {
      // Optimistic UI Update
      set({ items: [...get().items, item] });
      
      // Backend Sync
      try {
        await api.post('/api/wishlist/add_item/', {
          product_id: item.id
        });
      } catch (error) {
        console.error("Failed to sync wishlist add:", error);
      }
    }
  },

  removeItem: async (id) => {
    // Optimistic UI Update
    set({ items: get().items.filter((i) => i.id !== id) });
    
    // Backend Sync
    try {
      await api.post('/api/wishlist/remove-item/', {
        product_id: id
      });
    } catch (error) {
      console.error("Failed to sync wishlist remove:", error);
    }
  },

  isInWishlist: (id) => !!get().items.find((i) => i.id === id),
}));