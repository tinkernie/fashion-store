import axios from "axios";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface StoredUser {
  id?: string | number;
  user_id?: string | number;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  [key: string]: any;
}

export interface JWTPayload {
  exp?: number;
  user_id?: string | number;
  id?: string | number;
  email?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  [key: string]: any;
}

/**
 * Parses JWT payload safely without throwing.
 */
export function parseJwtPayload(token: string | null): JWTPayload | null {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  }
}

/**
 * Checks if a JWT token is expired, with an optional safety margin buffer (default: 10s).
 */
export function isTokenExpired(token: string | null, bufferSeconds = 10): boolean {
  if (!token) return true;
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= payload.exp - bufferSeconds;
}

/**
 * Retrieve all credentials from localStorage safely.
 */
export function getStoredAuth(): {
  accessToken: string | null;
  refreshToken: string | null;
  user: StoredUser | null;
} {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, user: null };
  }
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  let user: StoredUser | null = null;
  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      user = JSON.parse(rawUser);
    }
  } catch {
    user = null;
  }
  return { accessToken, refreshToken, user };
}

/**
 * Persist authenticated session and notify all components.
 */
export function setAuthSession(data: {
  access: string;
  refresh?: string;
  user?: StoredUser;
}) {
  if (typeof window === "undefined") return;

  if (data.access) {
    localStorage.setItem("access_token", data.access);
  }
  if (data.refresh) {
    localStorage.setItem("refresh_token", data.refresh);
  }
  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }
  window.dispatchEvent(new Event("auth-change"));
}

/**
 * Completely clears authentication state from browser storage and alerts the UI.
 */
export function clearAuthSession(options?: {
  notify?: boolean;
  message?: string;
  redirect?: boolean;
  redirectPath?: string;
}) {
  if (typeof window === "undefined") return;

  const hadAuth =
    !!localStorage.getItem("access_token") ||
    !!localStorage.getItem("refresh_token") ||
    !!localStorage.getItem("user");

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("luxury_wishlist_items");

  window.dispatchEvent(new Event("auth-change"));

  if (hadAuth && options?.notify) {
    toast.error(
      options.message || "نشست کاربری شما منقضی شده است. لطفاً مجدداً وارد شوید."
    );
  }

  if (options?.redirect) {
    const currentPath = window.location.pathname;
    const isProtected =
      currentPath.startsWith("/profile") ||
      currentPath.startsWith("/checkout") ||
      currentPath.startsWith("/admin");

    if (isProtected) {
      const target =
        options.redirectPath ||
        `/auth?redirect=${encodeURIComponent(currentPath + window.location.search)}`;
      window.location.href = target;
    }
  }
}

// In-flight refresh promise mutex to prevent concurrent refresh token calls
let refreshPromise: Promise<string | null> | null = null;

/**
 * Thread-safe synchronized token refresher.
 * Manages token rotation, saves rotated refresh tokens, and resolves pending requests.
 */
export async function refreshTokensSynchronized(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken || isTokenExpired(refreshToken, 0)) {
      clearAuthSession({ notify: true, redirect: true });
      return null;
    }

    try {
      const res = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
        refresh: refreshToken,
      });

      const newAccess = res.data?.access;
      const newRefresh = res.data?.refresh || refreshToken;

      if (newAccess) {
        localStorage.setItem("access_token", newAccess);
        localStorage.setItem("refresh_token", newRefresh);
        window.dispatchEvent(new Event("auth-change"));
        return newAccess;
      } else {
        clearAuthSession({ notify: true, redirect: true });
        return null;
      }
    } catch {
      clearAuthSession({ notify: true, redirect: true });
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Returns a guaranteed valid access token if available, refreshing automatically if expired.
 */
export async function getValidAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const accessToken = localStorage.getItem("access_token");
  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  const refreshToken = localStorage.getItem("refresh_token");
  if (refreshToken && !isTokenExpired(refreshToken, 0)) {
    return await refreshTokensSynchronized();
  }

  if (accessToken || refreshToken) {
    clearAuthSession({ notify: false });
  }
  return null;
}
