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

interface CartStore {
  items: CartItem[];
  fetchCart: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string, size: string, variant_id?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],

  fetchCart: async () => {
    try {
      const response = await api.get('/api/cart/');
      if (response.data && response.data.items) {
        set({ items: response.data.items });
      }
    } catch (error) {
      console.error("Failed to fetch backend cart:", error);
    }
  },
  
  addItem: async (item) => {
    // Optimistic UI Update
    set((state) => {
      const existingItem = state.items.find(
        (i) => i.id === item.id && i.size === item.size
      );
      
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.id === item.id && i.size === item.size
              ? { ...i, quantity: i.quantity + (item.quantity || 1) }
              : i
          ),
        };
      }
      
      return { items: [...state.items, { ...item, quantity: item.quantity || 1 }] };
    });

    // Backend Sync
    try {
      await api.post('/api/cart/add_item/', {
        variant_id: item.variant_id || item.id,
        quantity: item.quantity || 1
      });
    } catch (error) {
      console.error("Failed to sync cart add:", error);
    }
  },
  
  removeItem: async (id, size, variant_id) => {
    // Optimistic UI Update
    set((state) => ({
      items: state.items.filter((i) => !(i.id === id && i.size === size)),
    }));

    // Backend Sync
    try {
      await api.post('/api/cart/remove-item/', {
        variant_id: variant_id || id
      });
    } catch (error) {
      console.error("Failed to sync cart remove:", error);
    }
  },
  
  clearCart: async () => {
    set({ items: [] });
    try {
      await api.post('/api/cart/clear/');
    } catch (error) {
      console.error("Failed to clear backend cart:", error);
    }
  },
  
  getTotal: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
}));