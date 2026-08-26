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
    const res = await api.get('/api/categories/');
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },
  async createCategory(data: { name: string; slug: string }): Promise<any> {
    const res = await api.post('/api/admin/categories/', data);
    return res.data;
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
