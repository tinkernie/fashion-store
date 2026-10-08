import axios, { InternalAxiosRequestConfig } from 'axios';
import {
  getValidAccessToken,
  refreshTokensSynchronized,
  clearAuthSession,
} from './auth';
import { setupMockServer } from './mock-server';

// Connects directly to backend at http://127.0.0.1:8000 or via Next.js proxy
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

if (process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true') {
  setupMockServer(api);
}

// Determines if an endpoint can be safely retried as anonymous guest on 401 failure
function isPublicReadEndpoint(url?: string, method?: string): boolean {
  if (!url) return false;
  const m = (method || 'get').toLowerCase();
  if (m !== 'get') return false;
  return (
    url.includes('/api/products/') ||
    url.includes('/api/categories/') ||
    url.includes('/api/collections/') ||
    url.includes('/api/store-collections/') ||
    url.includes('/api/search/') ||
    url.includes('/api/site-content/') ||
    url.includes('/api/cms/')
  );
}

// Interceptor: Attach valid JWT Access Token to every request, or strip expired headers
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    // Avoid attaching authorization to the token refresh endpoint itself
    if (config.url?.includes('/api/auth/token/refresh/')) {
      return config;
    }

    const token = await getValidAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
  }
  return config;
});

// Interceptor: Automatically catch 401s, refresh token safely, or fallback cleanly
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip retry loops or requests without configs
    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      originalRequest._retry = true;

      // Never attempt refresh if the failed request was the refresh endpoint itself
      if (originalRequest.url?.includes('/api/auth/token/refresh/')) {
        clearAuthSession({ notify: true, redirect: true });
        return Promise.reject(error);
      }

      try {
        const newAccessToken = await refreshTokensSynchronized();
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch {
        // Refresh token failed or is blacklisted
      }

      // Session expired or unrefreshable: wipe stale state & alert UI
      clearAuthSession({ notify: true, redirect: true });

      // If this was a public read-only catalog request (e.g. products listing),
      // retry anonymously without the bad Authorization header so the page doesn't crash!
      if (isPublicReadEndpoint(originalRequest.url, originalRequest.method)) {
        delete originalRequest.headers.Authorization;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export async function trackAnalyticsEvent(type: string, payload?: any) {
  try {
    let sessionKey = typeof window !== 'undefined' ? localStorage.getItem('tracking_session_key') : null;
    if (!sessionKey && typeof window !== 'undefined') {
      sessionKey = 'sess-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('tracking_session_key', sessionKey);
    }
    await api.post('/api/analytics/track/', {
      type,
      payload: payload || {},
      session_key: sessionKey || undefined,
    });
  } catch {
    // Non-blocking analytics
  }
}