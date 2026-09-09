import { create } from "zustand";
import { api } from "@/lib/api";
import { getStoredAuth, isTokenExpired } from "@/lib/auth";
import { LocalizedNotification, localizeNotification } from "@/lib/notification-utils";

interface NotificationStore {
  notifications: LocalizedNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: any) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  resetNotifications: () => void;
}

const EXTRA_NOTIFS_KEY = "luxury_extra_notifications";

function getStoredExtraNotifications(): LocalizedNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EXTRA_NOTIFS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredExtraNotifications(list: LocalizedNotification[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EXTRA_NOTIFS_KEY, JSON.stringify(list));
  } catch {}
}

const checkHasAuth = (): boolean => {
  if (typeof window === "undefined") return false;
  const { accessToken, refreshToken } = getStoredAuth();
  return Boolean(
    (accessToken && !isTokenExpired(accessToken, 0)) ||
    (refreshToken && !isTokenExpired(refreshToken, 0))
  );
};

export const useNotifications = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    if (!checkHasAuth()) {
      set({ notifications: [], unreadCount: 0, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await api.get("/api/notifications/");
      const data = res.data;
      const rawList: any[] = Array.isArray(data)
        ? data
        : data.notifications || data.results || [];
      
      const localized = rawList.map(localizeNotification);
      const extra = getStoredExtraNotifications();

      // Merge and deduplicate by ID
      const existingIds = new Set(localized.map((n) => n.id));
      const merged = [
        ...extra.filter((n) => !existingIds.has(n.id)),
        ...localized,
      ];

      const unread = merged.filter((n) => !n.is_read).length;

      set({
        notifications: merged,
        unreadCount: unread,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      const extra = getStoredExtraNotifications();
      const unread = extra.filter((n) => !n.is_read).length;
      set({ notifications: extra, unreadCount: unread, isLoading: false });
    }
  },

  addNotification: (notification: any) => {
    const localized = localizeNotification(notification);
    const current = get().notifications;
    const existing = current.filter((n) => n.id !== localized.id);
    const updated = [localized, ...existing];
    
    // Save to extra notifications storage
    const extra = getStoredExtraNotifications();
    const updatedExtra = [localized, ...extra.filter((n) => n.id !== localized.id)];
    saveStoredExtraNotifications(updatedExtra);

    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.is_read).length,
    });
  },

  markAsRead: async (id: string) => {
    try {
      await api.post("/api/notifications/mark-read/", { notification_id: id });
    } catch {
      // Graceful silent fallback
    }

    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, is_read: true } : n
    );
    
    const extra = getStoredExtraNotifications().map((n) =>
      n.id === id ? { ...n, is_read: true } : n
    );
    saveStoredExtraNotifications(extra);

    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.is_read).length,
    });
  },

  markAllAsRead: async () => {
    try {
      await api.post("/api/notifications/mark-all-read/");
    } catch {
      // Graceful silent fallback
    }

    const updated = get().notifications.map((n) => ({ ...n, is_read: true }));
    const extra = getStoredExtraNotifications().map((n) => ({ ...n, is_read: true }));
    saveStoredExtraNotifications(extra);

    set({
      notifications: updated,
      unreadCount: 0,
    });
  },

  resetNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
    });
  },
}));
