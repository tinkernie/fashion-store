"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Check, Package, ExternalLink, Sparkles, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/store/notifications";
import { formatShamsiDate } from "@/lib/jalali";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Initial fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Click outside and escape key handling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllAsRead();
    toast.success("تمام اعلان‌ها به عنوان خوانده شده علامت‌گذاری شدند");
  };

  const handleMarkSingleRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await markAsRead(id);
  };

  const hasUnread = unreadCount > 0;

  return (
    <div className="relative" ref={dropdownRef} dir="rtl">
      {/* Trigger Button with Glowing Aura when unread */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "p-2 rounded-full transition-all outline-none cursor-pointer flex items-center justify-center relative",
          hasUnread
            ? "text-amber-400 bg-amber-400/10 border border-amber-400/40 shadow-[0_0_18px_rgba(245,158,11,0.55)] hover:bg-amber-400/20"
            : "text-zinc-300 hover:text-white hover:bg-white/10"
        )}
        aria-label="اعلان‌ها و پیام‌ها"
        aria-expanded={isOpen}
      >
        <Bell
          className={cn(
            "w-5 h-5 transition-transform",
            hasUnread ? "animate-[bell-wiggle_2s_ease-in-out_infinite]" : ""
          )}
        />

        {/* Pulsing Glowing Badge when unread notifications exist */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-gradient-to-tr from-amber-500 to-yellow-300 text-[9px] font-black text-black items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.9)]">
              {unreadCount > 9 ? "+۹" : unreadCount.toLocaleString("fa-IR")}
            </span>
          </span>
        )}
      </motion.button>

      {/* Popover Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 sm:left-auto sm:right-0 mt-3 w-80 sm:w-96 bg-[#111111]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 overflow-hidden text-right font-sans"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">اعلان‌ها و پیام‌ها</h4>
                  {hasUnread ? (
                    <span className="text-[10px] text-amber-400 font-medium">
                      {unreadCount.toLocaleString("fa-IR")} پیام خوانده‌نشده
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-500">همه خوانده شده‌اند</span>
                  )}
                </div>
              </div>

              {hasUnread && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] font-bold text-gray-300 hover:text-white px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-amber-400" />
                  خواندن همه
                </button>
              )}
            </div>

            {/* Notifications Scrollable List */}
            <div className="max-h-88 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
              {isLoading && notifications.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500 space-y-2">
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>در حال دریافت اعلان‌ها...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 px-6 text-center space-y-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mx-auto">
                    <Sparkles className="w-5 h-5 text-gray-600" />
                  </div>
                  <p className="text-xs font-bold text-gray-300">هیچ اعلان جدیدی وجود ندارد</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    پیام‌های تغییر وضعیت سفارش و هشدارهای مهم حساب کاربری در اینجا نمایش داده می‌شوند.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (notif.productId) {
                        setIsOpen(false);
                        if (!notif.is_read) markAsRead(notif.id);
                        router.push(`/products/${notif.productId}`);
                      }
                    }}
                    className={cn(
                      "p-4 transition-all hover:bg-white/[0.05] flex items-start gap-3 relative transition-colors",
                      notif.productId ? "cursor-pointer group" : "",
                      notif.is_read ? "opacity-75" : "bg-amber-400/[0.03]"
                    )}
                  >
                    {/* Unread indicator dot */}
                    <div className="pt-1 shrink-0">
                      {!notif.is_read ? (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] block" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-white/10 block" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {notif.productId ? (
                          <Link
                            href={`/products/${notif.productId}`}
                            onClick={() => {
                              setIsOpen(false);
                              if (!notif.is_read) markAsRead(notif.id);
                            }}
                            className="text-xs font-bold text-white hover:text-emerald-400 transition-colors leading-tight"
                          >
                            {notif.title}
                          </Link>
                        ) : (
                          <span className="text-xs font-bold text-white leading-tight">
                            {notif.title}
                          </span>
                        )}
                        {notif.statusLabel && (
                          <span
                            className={cn(
                              "text-[9px] px-2 py-0.5 rounded-full font-medium border",
                              notif.type === "wishlist_discount" || notif.statusLabel.includes("تخفیف")
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-400/10 text-amber-400 border-amber-400/20"
                            )}
                          >
                            {notif.statusLabel}
                          </span>
                        )}
                        {notif.typeLabel && !notif.statusLabel && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-medium">
                            {notif.typeLabel}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-3">
                        {notif.body}
                      </p>

                      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                        <span className="text-[10px] text-gray-500 font-sans">
                          {formatShamsiDate(notif.created_at, { mode: "full", withTime: true })}
                        </span>

                        <div className="flex items-center gap-2">
                          {notif.productId && (
                            <Link
                              href={`/products/${notif.productId}`}
                              onClick={() => {
                                setIsOpen(false);
                                if (!notif.is_read) markAsRead(notif.id);
                              }}
                              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              مشاهده و خرید محصول
                            </Link>
                          )}

                          {notif.orderNumber && (
                            <Link
                              href="/profile?tab=orders"
                              onClick={() => setIsOpen(false)}
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
                            >
                              <Package className="w-3 h-3" />
                              سفارش {notif.orderNumber}
                            </Link>
                          )}

                          {!notif.is_read && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkSingleRead(e, notif.id)}
                              title="خوانده شد"
                              className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 bg-white/[0.02] text-center">
              <Link
                href="/profile?tab=orders"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                مشاهده پیگیری و تاریخچه سفارشات
                <ExternalLink className="w-3 h-3 text-gray-500" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
