"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  Shield,
  Eye,
  Package,
  ShoppingBag,
  CreditCard,
  Check,
  Copy,
  XCircle,
  Clock,
  Truck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import { adminApi } from "@/lib/admin-api";
import { getApiErrorMessage } from "@/lib/error-utils";
import { formatShamsiDate } from "@/lib/jalali";
import { cn } from "@/lib/utils";
import { formatPrice, formatPriceNumber, parsePrice } from "@/lib/price-utils";

const ORDER_STEPS = [
  { key: "pending", label: "ثبت سفارش" },
  { key: "paid", label: "تایید پرداخت" },
  { key: "packing", label: "بسته‌بندی" },
  { key: "shipping", label: "تحویل به پست" },
  { key: "delivered", label: "تحویل به مشتری" },
];

const getStepIndex = (status: string) => {
  const s = status?.toLowerCase() || "";
  if (s === "delivered") return 4;
  if (s === "shipping" || s === "shipped") return 3;
  if (s === "packing" || s === "processing") return 2;
  if (s === "paid") return 1;
  return 0;
};

const getStatusBadge = (status: string) => {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "delivered":
      return {
        bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        label: "تحویل داده شده",
      };
    case "shipping":
    case "shipped":
      return {
        bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        label: "ارسال شده به پست",
      };
    case "packing":
    case "processing":
      return {
        bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        label: "در حال بسته‌بندی",
      };
    case "paid":
      return {
        bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        label: "پرداخت شده",
      };
    case "cancelled":
      return {
        bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        label: "لغو شده",
      };
    case "returned":
      return {
        bg: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        label: "مرجوع شده",
      };
    case "refunded":
      return {
        bg: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
        label: "استرداد وجه",
      };
    default:
      return {
        bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        label: "در انتظار پرداخت",
      };
  }
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // User Details & Orders Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (e) {
      console.error("Error loading users:", e);
      toast.error(getApiErrorMessage(e, "خطا در دریافت لیست کاربران"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    try {
      await adminApi.toggleUserActive(userId, !currentActive);
      toast.success(currentActive ? "کاربر غیرفعال شد" : "کاربر مجدداً فعال شد");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u))
      );
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev: any) => ({ ...prev, is_active: !currentActive }));
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "خطا در تغییر وضعیت حساب کاربری"));
    }
  };

  const handleOpenUserDetails = async (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    setIsLoadingOrders(true);
    setExpandedOrderId(null);
    try {
      const orders = await adminApi.getUserOrders(user.id, user.email);
      setUserOrders(orders);
    } catch (err) {
      console.error("Error loading user orders:", err);
      toast.error("خطا در دریافت سوابق سفارشات کاربر");
      setUserOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Calculate sum of money spent on non-cancelled orders
  const totalSpent = useMemo(() => {
    if (!userOrders || userOrders.length === 0) return 0;
    return userOrders
      .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
      .reduce((sum, o) => {
        const raw = o.total ?? o.total_amount ?? 0;
        return sum + parsePrice(raw);
      }, 0);
  }, [userOrders]);

  const filteredUsers = users.filter((u) => {
    const email = (u.email || "").toLowerCase();
    const name = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
    const phone = (u.phone || "").toLowerCase();
    return (
      email.includes(searchQuery.toLowerCase()) ||
      name.includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            مشتریان و حساب‌های کاربری
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            برای مشاهده سوابق خرید، مجموع مبالغ پرداختی و وضعیت مراحل سفارشات، روی هر کاربر کلیک کنید.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-[#111111] border border-white/10 rounded-2xl px-4 py-2">
        <Search className="w-4 h-4 text-gray-500 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو بر اساس نام، نام خانوادگی، شماره موبایل یا آدرس ایمیل..."
          className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder:text-gray-600"
        />
      </div>

      {/* Users Table */}
      <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#161616] text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-4 md:p-5 font-bold">نام و مشخصات کاربر</th>
                <th className="p-4 md:p-5 font-bold">ایمیل</th>
                <th className="p-4 md:p-5 font-bold">نقش کاربری</th>
                <th className="p-4 md:p-5 font-bold">تاریخ عضویت</th>
                <th className="p-4 md:p-5 font-bold">وضعیت حساب</th>
                <th className="p-4 md:p-5 font-bold text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    در حال بارگذاری لیست کاربران...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    هیچ کاربری با این مشخصات یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const fullName =
                    `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                    "کاربر بدون نام";
                  const isStaff = user.is_staff || user.is_superuser;
                  const isActive = user.is_active !== false;

                  return (
                    <tr
                      key={user.id}
                      onClick={() => handleOpenUserDetails(user)}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="p-4 md:p-5 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0 group-hover:border-blue-400/40 transition-colors">
                            {fullName[0] || "U"}
                          </div>
                          <div>
                            <span className="block group-hover:text-blue-300 transition-colors">
                              {fullName}
                            </span>
                            {user.phone && (
                              <span className="text-[10px] text-gray-500 font-mono block mt-0.5" dir="ltr">
                                {user.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 md:p-5 text-gray-300 font-mono" dir="ltr">
                        {user.email || "—"}
                      </td>

                      <td className="p-4 md:p-5">
                        {isStaff ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Shield className="w-3 h-3" />
                            مدیر سیستم
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">مشتری عادی</span>
                        )}
                      </td>

                      <td className="p-4 md:p-5 text-gray-300 font-sans">
                        {user.date_joined
                          ? formatShamsiDate(user.date_joined, { mode: "full" })
                          : "—"}
                      </td>

                      <td className="p-4 md:p-5">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {isActive ? "فعال" : "مسدود شده"}
                        </span>
                      </td>

                      <td className="p-4 md:p-5 text-left">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            onClick={() => handleOpenUserDetails(user)}
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 rounded-lg border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span>سوابق خرید</span>
                          </Button>

                          <Button
                            onClick={() => handleToggleStatus(user.id, isActive)}
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                              isActive
                                ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                : "text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                            }`}
                          >
                            {isActive ? (
                              <>
                                <UserX className="w-3.5 h-3.5 ml-1" />
                                مسدودسازی
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5 ml-1" />
                                فعال‌سازی
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Orders & Profile Detailed Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="bg-[#0a0a0a] border border-white/10 text-white sm:max-w-3xl p-6 max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-black flex items-center gap-2 border-b border-white/10 pb-4">
              <Package className="w-5 h-5 text-amber-400" />
              پرونده مشتری و سوابق سفارشات
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 mt-2">
              {/* User Overview Profile Card */}
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-base font-black shrink-0">
                    {(selectedUser.first_name || selectedUser.email || "U")[0]}
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-black text-white">
                      {`${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim() || "کاربر مهمان"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="font-mono text-gray-300" dir="ltr">
                        {selectedUser.email || "بدون ایمیل"}
                      </span>
                      {selectedUser.phone && (
                        <span className="font-mono text-gray-400" dir="ltr">
                          {selectedUser.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] px-3 py-1 rounded-full font-bold border ${
                      selectedUser.is_active !== false
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {selectedUser.is_active !== false ? "حساب فعال" : "حساب مسدود"}
                  </span>
                  {selectedUser.is_staff && (
                    <span className="text-[11px] px-3 py-1 rounded-full font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      مدیر سیستم
                    </span>
                  )}
                </div>
              </div>

              {/* Financial & Order Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#121212] border border-emerald-500/20 rounded-2xl p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-xs font-bold">مجموع کل خریدها</span>
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-base md:text-lg font-black text-emerald-400 font-mono">
                    {formatPriceNumber(totalSpent)} <span className="text-xs font-sans text-gray-400">تومان</span>
                  </div>
                  <span className="text-[10px] text-gray-500 block mt-1">
                    محاسبه شده بر مبنای سفارشات قطعی و پرداخت‌شده
                  </span>
                </div>

                <div className="bg-[#121212] border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-xs font-bold">تعداد کل سفارش‌ها</span>
                    <ShoppingBag className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-base md:text-lg font-black text-white">
                    {userOrders.length.toLocaleString("fa-IR")} <span className="text-xs font-normal text-gray-400">سفارش</span>
                  </div>
                  <span className="text-[10px] text-gray-500 block mt-1">
                    شامل تمامی سوابق خرید در سیستم
                  </span>
                </div>

                <div className="bg-[#121212] border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span className="text-xs font-bold">تاریخ عضویت</span>
                    <Calendar className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xs md:text-sm font-bold text-gray-200 mt-1">
                    {selectedUser.date_joined
                      ? formatShamsiDate(selectedUser.date_joined, { mode: "full" })
                      : "—"}
                  </div>
                  <span className="text-[10px] text-gray-500 block mt-1">
                    زمان اولین ثبت‌نام در فروشگاه
                  </span>
                </div>
              </div>

              {/* Order History Section */}
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-black text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-400" />
                    تاریخچه سفارش‌ها ({userOrders.length.toLocaleString("fa-IR")})
                  </span>
                  {userOrders.length > 0 && (
                    <span className="text-xs font-normal text-gray-400">
                      مرتب‌سازی از جدیدترین به قدیمی‌ترین
                    </span>
                  )}
                </h4>

                {isLoadingOrders ? (
                  <div className="text-center py-12 text-gray-400 text-xs bg-[#111111] rounded-2xl border border-white/5">
                    در حال دریافت سوابق سفارشات...
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-12 bg-[#111111] border border-white/10 rounded-3xl space-y-2">
                    <Package className="w-8 h-8 text-gray-600 mx-auto" />
                    <p className="text-xs md:text-sm font-bold text-gray-300">
                      هیچ سفارشی توسط این کاربر ثبت نشده است.
                    </p>
                    <p className="text-[11px] text-gray-500">
                      به محض ثبت اولین خرید، سوابق و وضعیت گام‌به‌گام در این بخش نمایش داده می‌شود.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map((ord: any) => {
                      const orderNum = ord.order_number || ord.id || "سفارش";
                      const currentStep = getStepIndex(ord.status);
                      const isCancelled = ord.status === "cancelled";
                      const statusInfo = getStatusBadge(ord.status);
                      const isExpanded = expandedOrderId === ord.id;
                      const rawTotal = ord.total ?? ord.total_amount ?? 0;
                      const numericTotal = parsePrice(rawTotal);

                      return (
                        <div
                          key={ord.id}
                          className="bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-5 transition-all hover:border-white/20 shadow-md"
                        >
                          {/* Order Top Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-white" dir="ltr">
                                  {orderNum}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(orderNum);
                                    setCopiedOrderNumber(orderNum);
                                    toast.success("شماره سفارش کپی شد");
                                    setTimeout(() => setCopiedOrderNumber(null), 2000);
                                  }}
                                  className="p-1 text-gray-400 hover:text-white transition-colors"
                                  title="کپی شماره سفارش"
                                >
                                  {copiedOrderNumber === orderNum ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <div className="text-[11px] text-gray-400">
                                {ord.placed_at ? formatShamsiDate(ord.placed_at, { mode: "full" }) : "—"}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "px-3 py-1 rounded-full text-[11px] font-bold border",
                                  statusInfo.bg
                                )}
                              >
                                {statusInfo.label}
                              </span>

                              <div className="text-left">
                                <span className="text-xs font-black text-amber-400 font-mono block">
                                  {formatPrice(numericTotal)}
                                </span>
                                <span className="text-[10px] text-gray-500 block">
                                  {ord.items_count !== undefined
                                    ? `${ord.items_count} قلم کالا`
                                    : ord.items?.length
                                    ? `${ord.items.length} قلم کالا`
                                    : "مبلغ نهایی"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Step-by-step progress line and circles */}
                          {!isCancelled ? (
                            <div className="py-3 px-2">
                              <div className="relative">
                                {/* Connecting horizontal timeline line behind circles */}
                                <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-white/10 -z-0" />

                                <div className="grid grid-cols-5 gap-2 relative z-10">
                                  {ORDER_STEPS.map((step, idx) => {
                                    const isPassed = idx <= currentStep;
                                    const isCurrent = idx === currentStep;

                                    return (
                                      <div
                                        key={step.key}
                                        className="flex flex-col items-center text-center space-y-2"
                                      >
                                        <div
                                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                            isPassed
                                              ? "bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/20"
                                              : "bg-[#181818] border-white/10 text-gray-600"
                                          }`}
                                        >
                                          {isPassed ? (
                                            <Check className="w-4 h-4 stroke-[3]" />
                                          ) : (
                                            <span className="text-xs font-bold">{idx + 1}</span>
                                          )}
                                        </div>
                                        <span
                                          className={`text-[10px] md:text-[11px] font-bold ${
                                            isCurrent
                                              ? "text-amber-400 font-black"
                                              : isPassed
                                              ? "text-white"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          {step.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                              <XCircle className="w-4 h-4 shrink-0" />
                              <span>این سفارش لغو گردیده است.</span>
                            </div>
                          )}

                          {/* Order Details Accordion Button */}
                          <div className="pt-1 flex items-center justify-between border-t border-white/5">
                            <Button
                              type="button"
                              onClick={() =>
                                setExpandedOrderId(isExpanded ? null : ord.id)
                              }
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-gray-400 hover:text-white text-xs font-bold flex items-center gap-1.5"
                            >
                              <span>جزئیات اقلام و نشانی</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </Button>

                            <span className="text-[11px] text-gray-500 font-mono">
                              شناسه سیستمی: {ord.id?.substring(0, 8)}...
                            </span>
                          </div>

                          {/* Expanded Order Items & Shipping Address */}
                          {isExpanded && (
                            <div className="space-y-4 pt-2 border-t border-white/5 animate-in fade-in-50 duration-200">
                              {/* Shipping Address Box if available */}
                              {ord.shipping_address && typeof ord.shipping_address === "object" && (
                                <div className="bg-[#181818] border border-white/10 rounded-xl p-3.5 space-y-1 text-xs text-gray-300">
                                  <div className="flex items-center gap-2 font-bold text-white mb-1">
                                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                    <span>نشانی تحویل سفارش:</span>
                                  </div>
                                  <p className="text-gray-400 leading-relaxed text-[11px]">
                                    {[
                                      ord.shipping_address.province,
                                      ord.shipping_address.city,
                                      ord.shipping_address.address,
                                    ]
                                      .filter(Boolean)
                                      .join(" - ")}
                                  </p>
                                  {(ord.shipping_address.recipient_name ||
                                    ord.shipping_address.full_name ||
                                    ord.shipping_address.phone) && (
                                    <p className="text-gray-500 text-[10px]">
                                      گیرنده:{" "}
                                      {ord.shipping_address.recipient_name ||
                                        ord.shipping_address.full_name ||
                                        "—"}{" "}
                                      {ord.shipping_address.phone && `(${ord.shipping_address.phone})`}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Order Items */}
                              {ord.items && ord.items.length > 0 ? (
                                <div className="space-y-2">
                                  <span className="text-xs font-bold text-gray-400 block">
                                    اقلام ثبت‌شده در سفارش:
                                  </span>
                                  <div className="space-y-2">
                                    {ord.items.map((item: any, itemIdx: number) => {
                                      const snap = item.product_snapshot || {};
                                      const title = snap.title || item.product_title || item.name || "کالای سفارش";
                                      const img = snap.image || item.image || item.imageUrl || "/globe.svg";

                                      return (
                                        <div
                                          key={item.id || itemIdx}
                                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs"
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <img
                                              src={typeof img === "string" ? img : img.url || "/globe.svg"}
                                              alt={title}
                                              className="w-10 h-10 object-cover rounded-lg bg-[#222] border border-white/10 shrink-0"
                                              onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src = "/globe.svg";
                                              }}
                                            />
                                            <div className="min-w-0">
                                              <span className="font-bold text-white block truncate">{title}</span>
                                              <span className="text-[10px] text-gray-400 block">
                                                تعداد: {item.quantity} عدد
                                              </span>
                                            </div>
                                          </div>
                                          <div className="text-left font-mono font-bold text-gray-200">
                                            {item.price ? formatPrice(item.price) : "—"}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 py-2">
                                  جزئیات کامل ریزاقلام در بخش مدیریت سفارشات قابل بررسی است.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
