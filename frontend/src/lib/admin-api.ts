import { api } from './api';

// --- CMS APIs ---
export interface CMSPage {
  slug: string;
  title: string;
  status: 'draft' | 'published';
  content?: Array<{
    type?: string;
    heading?: string;
    body?: string;
    [key: string]: any;
  }>;
  seo_metadata?: {
    meta_title?: string;
    meta_description?: string;
    [key: string]: any;
  };
  updated_at?: string;
}

export interface SiteContentData {
  announcement?: {
    enabled?: boolean;
    text?: string;
    link?: string;
    badge?: string;
  };
  hero?: {
    badge?: string;
    headline?: string;
    subtitle?: string;
    cta_label?: string;
    cta_link?: string;
    image_url?: string;
  };
  footer?: {
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
    working_hours?: string;
  };
  [key: string]: any;
}

export const adminApi = {
  // CMS Pages
  async getPages(): Promise<CMSPage[]> {
    const res = await api.get('/api/admin/cms/pages/');
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  async getPage(slug: string): Promise<CMSPage> {
    const res = await api.get(`/api/admin/cms/pages/${slug}/`);
    return res.data;
  },
  async createPage(data: Partial<CMSPage>): Promise<CMSPage> {
    const res = await api.post('/api/admin/cms/pages/', data);
    return res.data;
  },
  async updatePage(slug: string, data: Partial<CMSPage>): Promise<CMSPage> {
    const res = await api.patch(`/api/admin/cms/pages/${slug}/`, data);
    return res.data;
  },
  async deletePage(slug: string) {
    const res = await api.delete(`/api/admin/cms/pages/${slug}/`);
    return res.data;
  },
  async publishPage(slug: string) {
    const res = await api.post(`/api/admin/cms/pages/${slug}/publish/`);
    return res.data;
  },

  // Site Content
  async getSiteContent(key: string): Promise<any> {
    try {
      const res = await api.get(`/api/site-content/${key}/`);
      return res.data[key] || res.data;
    } catch {
      return null;
    }
  },
  async updateSiteContent(key: string, content: any) {
    const res = await api.post('/api/admin/cms/site-content/', {
      key,
      content,
    });
    return res.data;
  },

  // Products
  async getProducts(params?: { search?: string; status?: string; category?: string }): Promise<any[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await api.get(`/api/admin/products/${query ? `?${query}` : ''}`);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  async getProduct(id: string): Promise<any> {
    const res = await api.get(`/api/admin/products/${id}/`);
    return res.data;
  },
  async createProduct(data: any): Promise<any> {
    const res = await api.post('/api/admin/products/', data);
    return res.data;
  },
  async updateProduct(id: string, data: any): Promise<any> {
    const res = await api.patch(`/api/admin/products/${id}/`, data);
    return res.data;
  },
  async archiveProduct(id: string): Promise<any> {
    const res = await api.post(`/api/admin/products/${id}/archive/`);
    return res.data;
  },
  async deleteProduct(id: string): Promise<any> {
    const res = await api.delete(`/api/admin/products/${id}/`);
    return res.data;
  },

  // Media Upload
  async uploadImage(file: File): Promise<{ url: string; image_url: string; relative_url?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/admin/media_libm/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // Categories & Collections
  async getCategories(): Promise<any[]> {
    const { getCategories } = await import('./categories');
    return getCategories();
  },
  async createCategory(data: { name: string; slug?: string; description?: string }): Promise<any> {
    const { createCategory } = await import('./categories');
    return createCategory(data);
  },
  async updateCategory(id: string, data: { name?: string; slug?: string; description?: string }): Promise<any> {
    const { updateCategory } = await import('./categories');
    return updateCategory(id, data);
  },
  async deleteCategory(id: string): Promise<any> {
    const { deleteCategory } = await import('./categories');
    return deleteCategory(id);
  },
  async getCollections(): Promise<any[]> {
    const res = await api.get('/api/collections/');
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  async createCollection(data: { name: string; slug: string; description?: string }): Promise<any> {
    const res = await api.post('/api/admin/collections/', data);
    return res.data;
  },

  // Orders
  async getOrders(): Promise<any[]> {
    const res = await api.get('/api/admin/orders/');
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  async getOrder(orderId: string): Promise<any> {
    const res = await api.get(`/api/admin/orders/${orderId}/`);
    return res.data;
  },
  async transitionOrderStatus(orderId: string, status: string, note?: string): Promise<any> {
    const res = await api.post(`/api/admin/orders/${orderId}/transition/`, {
      status,
      note: note || `وضعیت به ${status} تغییر یافت`,
    });
    return res.data;
  },

  // Inventory
  async getInventory(variantId: string): Promise<any> {
    const res = await api.get(`/api/admin/inventory/${variantId}/`);
    return res.data;
  },
  async adjustStock(variantId: string, delta: number): Promise<any> {
    const res = await api.post(`/api/admin/inventory/${variantId}/adjust-stock/`, { delta });
    return res.data;
  },
  async setSafetyStock(variantId: string, safetyStock: number): Promise<any> {
    const res = await api.post(`/api/admin/inventory/${variantId}/safety-stock/`, { safety_stock: safetyStock });
    return res.data;
  },

  // Coupons
  async getCoupons(): Promise<any[]> {
    const res = await api.get('/api/admin/coupons/');
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  async createCoupon(data: any): Promise<any> {
    const res = await api.post('/api/admin/coupons/', data);
    return res.data;
  },
  async deleteCoupon(id: string): Promise<any> {
    const res = await api.delete(`/api/admin/coupons/${id}/`);
    return res.data;
  },

  // Analytics
  async getSalesSummary(startDate?: string, endDate?: string): Promise<any> {
    try {
      const now = new Date();
      const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = endDate || now.toISOString().split('T')[0];
      const res = await api.get(`/api/admin/analytics/sales/?start_date=${start}&end_date=${end}`);
      return res.data;
    } catch {
      return { total_revenue: 0, order_count: 0, average_order_value: 0 };
    }
  },
  async getPopularProducts(limit = 5): Promise<any[]> {
    try {
      const res = await api.get(`/api/admin/analytics/popular_products/?limit=${limit}`);
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },
  async getCartAbandonment(): Promise<any> {
    try {
      const res = await api.get('/api/admin/analytics/cart_abandonment/');
      return res.data;
    } catch {
      return { abandoned_count: 0, abandonment_rate: 0 };
    }
  },

  // Users
  async getUsers(params?: { search?: string; is_active?: boolean }): Promise<any[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await api.get(`/api/admin/users/${query ? `?${query}` : ''}`);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  async toggleUserActive(userId: string, activate: boolean): Promise<any> {
    const action = activate ? 'activate' : 'deactivate';
    const res = await api.post(`/api/admin/users/${userId}/${action}/`);
    return res.data;
  },
  async getUserOrders(userId: string, userEmail?: string): Promise<any[]> {
    try {
      const res = await api.get(`/api/admin/users/${userId}/orders/`);
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    } catch {
      try {
        const res = await api.get(`/api/admin/orders/?user_id=${userId}`);
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        if (list.length > 0) return list;
      } catch {}

      try {
        const all = await this.getOrders();
        return all.filter((o: any) => {
          if (o.user_id === userId || o.user === userId || o.user?.id === userId) return true;
          if (userEmail && o.shipping_address?.email && o.shipping_address.email.toLowerCase() === userEmail.toLowerCase()) return true;
          if (userEmail && o.user?.email && o.user.email.toLowerCase() === userEmail.toLowerCase()) return true;
          return false;
        });
      } catch {
        return [];
      }
    }
  },

  // Reviews
  async getReviews(params?: { status?: string; product_id?: string; search?: string }): Promise<ProductReview[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await api.get(`/api/admin/reviews/${query ? `?${query}` : ''}`);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  async approveReview(id: string): Promise<ProductReview> {
    const res = await api.post(`/api/admin/reviews/${id}/approve/`);
    return res.data;
  },
  async rejectReview(id: string): Promise<ProductReview> {
    const res = await api.post(`/api/admin/reviews/${id}/reject/`);
    return res.data;
  },
  async deleteReview(id: string) {
    const res = await api.delete(`/api/admin/reviews/${id}/`);
    return res.data;
  },

  // Product Options & Values
  async getProductOptions(productId: string): Promise<any[]> {
    const res = await api.get(`/api/admin/products/${productId}/options/`);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  async createProductOption(productId: string, data: { name: string; position?: number }): Promise<any> {
    const res = await api.post(`/api/admin/products/${productId}/options/`, data);
    return res.data;
  },
  async updateProductOption(productId: string, optionId: string, data: { name: string }): Promise<any> {
    const res = await api.patch(`/api/admin/products/${productId}/options/${optionId}/`, data);
    return res.data;
  },
  async deleteProductOption(productId: string, optionId: string): Promise<any> {
    const res = await api.delete(`/api/admin/products/${productId}/options/${optionId}/`);
    return res.data;
  },
  async createOptionValue(productId: string, optionId: string, data: { value: string; extra_data?: any }): Promise<any> {
    const res = await api.post(`/api/admin/products/${productId}/options/${optionId}/values/`, data);
    return res.data;
  },
  async updateOptionValue(productId: string, optionId: string, valueId: string, data: { value?: string; extra_data?: any }): Promise<any> {
    const res = await api.patch(`/api/admin/products/${productId}/options/${optionId}/values/${valueId}/`, data);
    return res.data;
  },
  async deleteOptionValue(productId: string, optionId: string, valueId: string): Promise<any> {
    const res = await api.delete(`/api/admin/products/${productId}/options/${optionId}/values/${valueId}/`);
    return res.data;
  },

  // Product Variants
  async getVariants(productId?: string, status?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (productId) params.set('product_id', productId);
    if (status) params.set('status', status);
    const query = params.toString();
    const res = await api.get(`/api/admin/variants/${query ? `?${query}` : ''}`);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  async getVariant(id: string): Promise<any> {
    const res = await api.get(`/api/admin/variants/${id}/`);
    return res.data;
  },
  async createVariant(data: {
    product_id: string;
    sku: string;
    price: number | string;
    weight: number;
    availability?: 'in_stock' | 'out_of_stock' | 'pre_order';
    status?: 'draft' | 'published' | 'discontinued';
    option_values: Array<{ option_id: string; value_id: string }>;
    metadata?: any;
  }): Promise<any> {
    const res = await api.post('/api/admin/variants/', data);
    return res.data;
  },
  async updateVariant(id: string, data: Partial<{
    sku: string;
    price: number | string;
    weight: number;
    availability: string;
    status: string;
    option_values: Array<{ option_id: string; value_id: string }>;
    metadata: any;
  }>): Promise<any> {
    const res = await api.patch(`/api/admin/variants/${id}/`, data);
    return res.data;
  },
  async deleteVariant(id: string): Promise<any> {
    const res = await api.delete(`/api/admin/variants/${id}/`);
    return res.data;
  },

  // Admin Notifications
  async getAdminNotifications(): Promise<any[]> {
    const res = await api.get('/api/admin/notifications/');
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  // Collections Management
  async getCollections(): Promise<any[]> {
    try {
      const res = await api.get('/api/admin/collections/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    } catch {
      // Graceful fallback to public endpoint if admin list action isn't available yet
      const res = await api.get('/api/collections/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  },

  async getCollection(idOrSlug: string): Promise<any> {
    const res = await api.get(`/api/collections/${idOrSlug}/`);
    return res.data;
  },

  async createCollection(data: {
    name: string;
    slug: string;
    description?: string;
    hero_banner?: any;
    priority?: number;
    is_active?: boolean;
    published_from?: string | null;
    published_until?: string | null;
  }): Promise<any> {
    const res = await api.post('/api/admin/collections/', data);
    return res.data;
  },

  async updateCollection(id: string, data: any): Promise<any> {
    const res = await api.patch(`/api/admin/collections/${id}/`, data);
    return res.data;
  },

  async deleteCollection(id: string): Promise<any> {
    const res = await api.delete(`/api/admin/collections/${id}/`);
    return res.data;
  },

  async addProductToCollection(collectionId: string, productId: string, position: number = 0): Promise<any> {
    const res = await api.post(`/api/admin/collections/${collectionId}/add-product/`, {
      product_id: productId,
      position,
    });
    return res.data;
  },

  async removeProductFromCollection(collectionId: string, productId: string): Promise<any> {
    const res = await api.post(`/api/admin/collections/${collectionId}/remove-product/`, {
      product_id: productId,
    });
    return res.data;
  },

  async setCollectionProducts(collectionId: string, items: Array<{ product_id: string; position: number }>): Promise<any> {
    const res = await api.post(`/api/admin/collections/${collectionId}/set_products/`, {
      items,
    });
    return res.data;
  },
};

export interface ProductReview {
  id: string;
  product_id: string;
  product_title: string;
  product_slug: string;
  product_image?: string;
  user_name: string;
  rating: number;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at?: string;
}

