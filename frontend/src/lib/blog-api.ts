import { api } from './api';

export type BlogLanguage = 'fa' | 'en' | 'ar';

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
  name_en?: string;
  name_ar?: string;
}

export interface BlogPostCard {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image?: string;
  published_at?: string;
  reading_minutes: number;
  status: 'draft' | 'published';
  tags: BlogTag[];
  author_name?: string;
}

export interface BlogPostDetail extends BlogPostCard {
  body_html: string;
  meta_title?: string;
  meta_description?: string;
  has_language: boolean;
  slugs: {
    fa?: string;
    en?: string;
    ar?: string;
  };
  canonical_url?: string;
}

export interface BlogPostTranslationPayload {
  id?: number;
  language: 'en' | 'ar';
  title: string;
  slug?: string;
  body_html: string;
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
  reading_minutes?: number;
}

export interface BlogPostAdminDetail extends BlogPostDetail {
  translations: BlogPostTranslationPayload[];
  created_at?: string;
  updated_at?: string;
  tag_ids?: number[];
}

export interface HomepageBlogSectionData {
  enabled: boolean;
  titles: {
    fa: string;
    en: string;
    ar: string;
  };
  max_items: number;
  posts: BlogPostCard[];
}

export interface BlogListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BlogPostCard[];
}

// Storefront Public Blog APIs
export async function getBlogPosts(params?: {
  lang?: BlogLanguage;
  tag?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<BlogListResponse> {
  const query = new URLSearchParams();
  if (params?.lang) query.set('lang', params.lang);
  if (params?.tag) query.set('tag', params.tag);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.page_size) query.set('page_size', String(params.page_size));

  const qs = query.toString();
  const url = `/api/blog/posts/${qs ? `?${qs}` : ''}`;
  const res = await api.get(url);
  return res.data;
}

export async function getBlogPostDetail(
  slug: string,
  lang: BlogLanguage = 'fa'
): Promise<BlogPostDetail> {
  const res = await api.get(`/api/blog/posts/${encodeURIComponent(slug)}/?lang=${lang}`);
  return res.data;
}

export async function getBlogPostSlugLookup(
  slug: string,
  lang: BlogLanguage = 'fa'
): Promise<{ redirect_to: string } | null> {
  try {
    const res = await api.get(
      `/api/blog/posts/slug-lookup/?slug=${encodeURIComponent(slug)}&lang=${lang}`
    );
    return res.data;
  } catch {
    return null;
  }
}

export async function getHomepageBlogSection(): Promise<HomepageBlogSectionData> {
  const res = await api.get('/api/blog/posts/homepage-section/');
  return res.data;
}

export async function getBlogTags(): Promise<BlogTag[]> {
  const res = await api.get('/api/blog/tags/');
  return Array.isArray(res.data) ? res.data : res.data.results || [];
}

// Admin CMS Blog APIs
export const adminBlogApi = {
  async getPosts(params?: {
    status?: 'draft' | 'published';
    search?: string;
    tag?: string;
    page?: number;
  }): Promise<{ count: number; results: BlogPostAdminDetail[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.page) query.set('page', String(params.page));

    const qs = query.toString();
    const url = `/api/admin/blog/posts/${qs ? `?${qs}` : ''}`;
    const res = await api.get(url);
    return res.data;
  },

  async getPost(slug: string): Promise<BlogPostAdminDetail> {
    const res = await api.get(`/api/admin/blog/posts/${encodeURIComponent(slug)}/`);
    return res.data;
  },

  async createPost(data: Partial<BlogPostAdminDetail>): Promise<BlogPostAdminDetail> {
    const res = await api.post('/api/admin/blog/posts/', data);
    return res.data;
  },

  async updatePost(slug: string, data: Partial<BlogPostAdminDetail>): Promise<BlogPostAdminDetail> {
    const res = await api.patch(`/api/admin/blog/posts/${encodeURIComponent(slug)}/`, data);
    return res.data;
  },

  async deletePost(slug: string): Promise<void> {
    await api.delete(`/api/admin/blog/posts/${encodeURIComponent(slug)}/`);
  },

  async publishPost(slug: string): Promise<{ status: string; published_at: string }> {
    const res = await api.post(`/api/admin/blog/posts/${encodeURIComponent(slug)}/publish/`);
    return res.data;
  },

  async unpublishPost(slug: string): Promise<{ status: string }> {
    const res = await api.post(`/api/admin/blog/posts/${encodeURIComponent(slug)}/unpublish/`);
    return res.data;
  },

  async getTags(): Promise<BlogTag[]> {
    const res = await api.get('/api/admin/blog/tags/');
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  async createTag(data: Partial<BlogTag>): Promise<BlogTag> {
    const res = await api.post('/api/admin/blog/tags/', data);
    return res.data;
  },

  async updateTag(id: number, data: Partial<BlogTag>): Promise<BlogTag> {
    const res = await api.patch(`/api/admin/blog/tags/${id}/`, data);
    return res.data;
  },

  async deleteTag(id: number): Promise<void> {
    await api.delete(`/api/admin/blog/tags/${id}/`);
  },
};
