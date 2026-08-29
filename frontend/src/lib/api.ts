import axios from 'axios';

// Ensure you add NEXT_PUBLIC_API_URL=http://localhost:8000 to your .env.local file
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Attach JWT Access Token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor: Automatically catch 401s and attempt to refresh the token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          localStorage.setItem('access_token', res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') window.location.href = '/auth';
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