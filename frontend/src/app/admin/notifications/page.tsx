"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Search,
  RefreshCw,
  CheckCircle2,
  Mail,
  User,
  Clock,
  Send,
  AlertTriangle,
  Info,
  Tag,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/admin-api";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-utils";
import { formatShamsiDate } from "@/lib/jalali";
import { localizeNotification } from "@/lib/notification-utils";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getAdminNotifications();
      setNotifications(data);
    } catch (e) {
      console.error("Error loading admin notifications:", e);
      toast.error(getApiErrorMessage(e, "خطا در بارگذاری لیست اعلان‌ها"));
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationIcon = (type?: string) => {
    const t = type?.toLowerCase() || "";
    if (t.includes("order") || t.includes("سفارش")) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
    if (t.includes("security") || t.includes("auth") || t.includes("امنیت")) {
      return <ShieldAlert className="w-4 h-4 text-rose-400" />;
    }
    if (t.includes("coupon") || t.includes("discount") || t.includes("تخفیف")) {
      return <Tag className="w-4 h-4 text-amber-400" />;
    }
    return <Bell className="w-4 h-4 text-blue-400" />;
  };

  const filteredNotifications = notifications.map(localizeNotification).filter((n) => {
    const subject = (n.title || n.subject || "").toLowerCase();
    const body = (n.body || "").toLowerCase();
    const email = (n.user_email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      subject.includes(query) ||
      body.includes(query) ||
      email.includes(query);
    const matchesFilter =
      filterType === "all" ||
      (n.type && n.type.toLowerCase() === filterType.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-400" />
            مرکز اعلان‌ها و پیام‌های ارسالی سیستم
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            مشاهده سابقه اعلان‌های سیستمی ارسال شده به کاربران، رویدادهای ورود، وضعیت سفارش‌ها و هشدارها
          </p>
        </div>

        <Button
          onClick={loadNotifications}
          variant="outline"
          className="h-11 px-4 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-xs flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          بروزرسانی
        </Button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-3 bg-[#111111] border border-white/10 rounded-2xl px-4 py-2 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در موضوع اعلان یا ایمیل کاربر..."
            className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder:text-gray-600"
          />
        </div>

        {/* Stats */}
        <div className="text-xs text-gray-400">
          مجموع پیام‌های ثبت شده:{" "}
          <span className="font-bold text-white">{notifications.length.toLocaleString("fa-IR")}</span>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#161616] text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-4 md:p-5 font-bold">نوع و موضوع پیام</th>
                <th className="p-4 md:p-5 font-bold">گیرنده (ایمیل کاربر)</th>
                <th className="p-4 md:p-5 font-bold">وضعیت مشاهده</th>
                <th className="p-4 md:p-5 font-bold text-left">زمان ارسال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-gray-500">
                    هیچ اعلانی ثبت نشده است.
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 md:p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-xs block">
                            {notif.title || notif.subject || "پیام سیستمی"}
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            نوع: {notif.typeLabel || "عمومی"}
                            {notif.statusLabel && ` • وضعیت: ${notif.statusLabel}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 md:p-5 font-mono text-gray-300" dir="ltr">
                      {notif.user_email || "کاربر عمومی"}
                    </td>

                    <td className="p-4 md:p-5">
                      {notif.is_read ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          خوانده شده
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          خوانده نشده
                        </span>
                      )}
                    </td>

                    <td className="p-4 md:p-5 text-left text-gray-400 font-sans">
                      {notif.created_at
                        ? formatShamsiDate(notif.created_at, { mode: "full", withTime: true })
                        : "اخیراً"}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
