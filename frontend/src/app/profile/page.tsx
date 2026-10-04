"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  MapPin,
  User,
  LogOut,
  ChevronLeft,
  Heart,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Pencil,
  Bell,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  Tag,
  ShoppingBag,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useWishlist } from "@/store/wishlist";
import GradientMenu from "@/components/ui/gradient-menu";
import Link from "next/link";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/error-utils";
import { formatShamsiDate } from "@/lib/jalali";
import { cn } from "@/lib/utils";
import { isTokenExpired, clearAuthSession, parseJwtPayload } from "@/lib/auth";
import { formatPrice, parsePrice, getDiscountInfo } from "@/lib/price-utils";


const getUserIdFromToken = () => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  if (!token && !refreshToken) return null;

  if (token && !isTokenExpired(token, 0)) {
    const payload = parseJwtPayload(token);
    return payload?.user_id || payload?.id || null;
  }

  if (refreshToken && !isTokenExpired(refreshToken, 0)) {
    const payload = parseJwtPayload(refreshToken);
    return payload?.user_id || payload?.id || null;
  }

  return null;
};

const ORDER_STEPS = [
  { key: "pending", label: "ثبت سفارش", desc: "سفارش شما در سیستم ثبت شد" },
  { key: "paid", label: "تایید پرداخت", desc: "پرداخت تایید و به انبار ارسال شد" },
  { key: "packing", label: "بسته‌بندی", desc: "کالا در حال آماده‌سازی و بسته‌بندی است" },
  { key: "shipping", label: "تحویل به پست", desc: "مرسوله تحویل شرکت پست گردید" },
  { key: "delivered", label: "تحویل به مشتری", desc: "سفارش با موفقیت تحویل داده شد" },
];

const getStepIndex = (status: string) => {
  const s = status?.toLowerCase() || "";
  if (s === "delivered") return 4;
  if (s === "shipping" || s === "shipped") return 3;
  if (s === "packing" || s === "processing") return 2;
  if (s === "paid") return 1;
  return 0;
};

const getProfileStatusBadge = (status: string) => {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "delivered":
      return { label: "تحویل داده شده", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "shipping":
    case "shipped":
      return { label: "تحویل به پست", bg: "bg-sky-50 text-sky-700 border-sky-200" };
    case "packing":
    case "processing":
      return { label: "در حال بسته‌بندی", bg: "bg-blue-50 text-[#0082CA] border-sky-200" };
    case "paid":
      return { label: "پرداخت شده", bg: "bg-sky-50 text-[#0082CA] border-sky-200" };
    case "cancelled":
      return { label: "لغو شده", bg: "bg-rose-50 text-rose-700 border-rose-200" };
    case "returned":
      return { label: "مرجوع شده", bg: "bg-amber-50 text-amber-700 border-amber-200" };
    case "refunded":
      return { label: "مسترد شده", bg: "bg-teal-50 text-teal-700 border-teal-200" };
    default:
      return { label: "در انتظار پرداخت", bg: "bg-amber-50 text-amber-700 border-amber-200" };
  }
};

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("orders");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState<"all" | "active" | "delivered" | "cancelled">("all");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>({
    email_order_updates: true,
    email_promotions: true,
    email_account: true,
    in_app_order_updates: true,
    in_app_account: true,
  });
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);

  // Email Change State
  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailChangePassword, setEmailChangePassword] = useState("");
  const [emailChangeToken, setEmailChangeToken] = useState("");
  const [isEmailChangeStepTwo, setIsEmailChangeStepTwo] = useState(false);
  const [isSubmittingEmailChange, setIsSubmittingEmailChange] = useState(false);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlist();

  useEffect(() => {
    setMounted(true);

    const userId = getUserIdFromToken();
    if (!userId) {
      clearAuthSession({ notify: true, redirect: false });
      router.push("/auth?redirect=/profile");
      return;
    }

    // Load addresses
    const saved = localStorage.getItem(`user_addresses_${userId}`);
    if (saved) {
      try {
        setAddresses(JSON.parse(saved));
      } catch (e) {
        setAddresses([]);
      }
    }

    const fetchData = async () => {
      try {
        const [ordersRes, profileRes, notifsRes, prefsRes] = await Promise.allSettled([
          api.get("/api/orders/"),
          api.get("/api/users/me/"),
          api.get("/api/notifications/"),
          api.get("/api/notifications/preferences/"),
        ]);

        const isAuth401 = (res: PromiseSettledResult<any>) =>
          res.status === "rejected" && res.reason?.response?.status === 401;

        if (isAuth401(profileRes) || isAuth401(ordersRes)) {
          clearAuthSession({ notify: true, redirect: false });
          router.push("/auth?redirect=/profile");
          return;
        }

        if (ordersRes.status === "fulfilled") {
          const fetchedOrders = Array.isArray(ordersRes.value.data)
            ? ordersRes.value.data
            : ordersRes.value.data.results || [];
          setOrders(fetchedOrders);

          // Populate initial addresses from order history if empty
          if (!saved && fetchedOrders.length > 0) {
            const extracted: any[] = [];
            fetchedOrders.forEach((ord: any, idx: number) => {
              const ship = ord.shipping_address;
              if (ship && ship.address && !extracted.some((a) => a.address === ship.address)) {
                extracted.push({
                  id: `ord-addr-${idx}-${Date.now()}`,
                  title: ship.city ? `آدرس ${ship.city}` : `آدرس سفارش ${ord.order_number || idx + 1}`,
                  fullName: ship.full_name || "",
                  phone: ship.phone || "",
                  province: ship.province || "",
                  city: ship.city || "",
                  address: ship.address,
                  postalCode: ship.postal_code || "",
                });
              }
            });
            if (extracted.length > 0) {
              setAddresses(extracted);
              localStorage.setItem(`user_addresses_${userId}`, JSON.stringify(extracted));
            }
          }
        }

        if (profileRes.status === "fulfilled") {
          setUserProfile(profileRes.value.data);
        }

        if (notifsRes.status === "fulfilled") {
          const data = notifsRes.value.data;
          const notifList = Array.isArray(data)
            ? data
            : data.notifications || data.results || [];
          setNotifications(notifList);
        }

        if (prefsRes.status === "fulfilled" && prefsRes.value.data) {
          setPreferences(prefsRes.value.data);
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    };
    fetchData();
  }, [router]);


  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: any) => {
    setEditingAddress(addr);
    setIsAddressModalOpen(true);
  };

  const handleDeleteAddress = (id: string | number) => {
    const userId = getUserIdFromToken();
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    if (userId) {
      localStorage.setItem(`user_addresses_${userId}`, JSON.stringify(updated));
    }
    toast.success("آدرس با موفقیت حذف شد");
  };

  const handleSaveAddress = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const userId = getUserIdFromToken();
    const formData = new FormData(e.currentTarget);

    const newAddr = {
      id: editingAddress ? editingAddress.id : `addr-${Date.now()}`,
      title: (formData.get("title") as string) || "آدرس من",
      fullName: (formData.get("fullName") as string) || "",
      phone: (formData.get("phone") as string) || "",
      province: (formData.get("province") as string) || "",
      city: (formData.get("city") as string) || "",
      address: formData.get("address") as string,
      postalCode: (formData.get("postalCode") as string) || "",
    };

    let updatedList;
    if (editingAddress) {
      updatedList = addresses.map((a) => (a.id === editingAddress.id ? newAddr : a));
      toast.success("آدرس با موفقیت ویرایش شد");
    } else {
      updatedList = [...addresses, newAddr];
      toast.success("آدرس جدید با موفقیت افزوده شد");
    }

    setAddresses(updatedList);
    if (userId) {
      localStorage.setItem(`user_addresses_${userId}`, JSON.stringify(updatedList));
    }
    setIsAddressModalOpen(false);
    setEditingAddress(null);
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await api.post("/api/auth/logout/", { refresh: refreshToken });
      }
    } catch (e) {
      console.error("Logout error:", e);
    }
    clearAuthSession({ notify: false, redirect: false });
    toast.success("با موفقیت از حساب کاربری خارج شدید");
    router.push("/");
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const userId = getUserIdFromToken();
    if (!userId) return;

    const formData = new FormData(e.currentTarget);
    const fullName = ((formData.get("fullName") as string) || "").trim();
    if (!fullName) {
      toast.error("نام و نام خانوادگی نمی‌تواند خالی باشد");
      setIsLoading(false);
      return;
    }

    // Name characters regex check (Persian, Arabic, Latin, hyphens, spaces)
    const nameRegex = /^[\w\s\-\'\u0600-\u06FF]+$/;
    if (!nameRegex.test(fullName) || fullName.includes("<") || fullName.includes(">")) {
      toast.error("نام وارد شده شامل کاراکترهای غیرمجاز است");
      setIsLoading(false);
      return;
    }

    const [firstName, ...lastNames] = fullName.split(" ");
    const fName = (firstName || "").trim();
    const lName = (lastNames.join(" ") || "").trim() || fName;

    try {
      const res = await api.patch("/api/users/me/", {
        first_name: fName,
        last_name: lName,
      });

      const updatedProfile = res.data || {
        ...userProfile,
        first_name: fName,
        last_name: lName,
      };

      setUserProfile(updatedProfile);

      // Sync updated user in localStorage and trigger auth-change event
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("user");
        const parsed = storedUser ? JSON.parse(storedUser) : {};
        localStorage.setItem("user", JSON.stringify({ ...parsed, ...updatedProfile }));
        window.dispatchEvent(new Event("auth-change"));
      }

      toast.success("اطلاعات کاربری با موفقیت بروزرسانی شد");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "خطا در بروزرسانی اطلاعات"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderDetails = async (orderIdentifier: string) => {
    try {
      const res = await api.get(`/api/orders/${orderIdentifier}/`);
      setSelectedOrder(res.data);
      setIsOrderModalOpen(true);
    } catch (error) {
      toast.error("دریافت جزئیات سفارش ناموفق بود");
    }
  };

  const handleTogglePreference = async (key: string, value: boolean) => {
    setIsUpdatingPrefs(true);
    try {
      const updated = { ...preferences, [key]: value };
      setPreferences(updated);
      await api.patch("/api/notifications/preferences/", { [key]: value });
      toast.success("تنظیمات اعلان بروزرسانی شد");
    } catch {
      toast.error("خطا در بروزرسانی تنظیمات اعلان");
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const handleChangeEmailRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = newEmailInput.trim().toLowerCase();
    if (!normalizedEmail || !emailChangePassword) {
      toast.error("لطفاً ایمیل جدید و رمز عبور را وارد کنید");
      return;
    }
    setIsSubmittingEmailChange(true);
    try {
      await api.post("/api/users/me/change_email/", {
        new_email: normalizedEmail,
        password: emailChangePassword,
      });
      toast.success("لینک و کد تایید به ایمیل جدید ارسال شد. لطفاً کد را در کادر زیر وارد کنید.");
      setIsEmailChangeStepTwo(true);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "خطا در ثبت درخواست تغییر ایمیل"));
    } finally {
      setIsSubmittingEmailChange(false);
    }
  };

  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = emailChangeToken.trim();
    if (!token) {
      toast.error("کد یا توکن تایید را وارد کنید");
      return;
    }
    setIsSubmittingEmailChange(true);
    try {
      await api.post("/api/users/me/confirm_email/", {
        token: token,
      });
      toast.success("ایمیل شما با موفقیت تغییر یافت. به دلایل امنیتی، لطفاً مجدداً وارد حساب خود شوید.");
      
      // Clear session tokens and redirect to auth
      clearAuthSession({ notify: false, redirect: false });
      
      setTimeout(() => {
        router.push(`/auth?email=${encodeURIComponent(newEmailInput.trim().toLowerCase())}`);
      }, 1500);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "کد تایید اشتباه یا منقضی شده است"));
    } finally {
      setIsSubmittingEmailChange(false);
    }
  };



  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      await api.post("/api/auth/change-password/", {
        old_password: formData.get("oldPassword"),
        new_password: formData.get("newPassword"),
      });
      toast.success("رمز عبور با موفقیت تغییر یافت");
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "تغییر رمز عبور ناموفق بود. لطفاً رمز عبور فعلی را بررسی کنید."));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const s = ord.status?.toLowerCase() || "";
    if (orderFilter === "delivered") return s === "delivered";
    if (orderFilter === "cancelled") return s === "cancelled" || s === "returned" || s === "refunded";
    if (orderFilter === "active") return s !== "delivered" && s !== "cancelled" && s !== "returned" && s !== "refunded";
    return true;
  });

  const profileFullName = userProfile
    ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim()
    : "";
  const displayName =
    profileFullName ||
    (userProfile?.email ? userProfile.email.split("@")[0] : "کاربر گرامی");

  if (!mounted) return null;

  return (
    <main className="min-h-screen pt-28 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-slate-800 bg-background" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: User Summary Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 space-y-6"
        >
          <div className="bg-white border border-sky-100 rounded-3xl p-6 md:p-8 text-center shadow-xl shadow-sky-950/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-sky-400 via-[#0082CA] to-sky-400" />

            <div className="w-24 h-24 bg-sky-50 rounded-full mx-auto mb-4 border-2 border-sky-200 flex items-center justify-center shadow-lg shadow-sky-500/10">
              <User className="w-10 h-10 text-[#0082CA]" />
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-1">
              {displayName}
            </h2>
            <p className="text-xs text-slate-500 font-sans mb-6" dir="ltr">
              {userProfile?.email || ""}
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 py-4 border-y border-sky-100 mb-6 text-center">
              <div>
                <span className="text-base font-black text-slate-900">{orders.length.toLocaleString("fa-IR")}</span>
                <span className="text-[10px] text-slate-400 block">سفارش‌ها</span>
              </div>
              <div>
                <span className="text-base font-black text-slate-900">{wishlistItems.length.toLocaleString("fa-IR")}</span>
                <span className="text-[10px] text-slate-400 block">علاقه‌مندی</span>
              </div>
              <div>
                <span className="text-base font-black text-slate-900">{addresses.length.toLocaleString("fa-IR")}</span>
                <span className="text-[10px] text-slate-400 block">آدرس‌ها</span>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 bg-white h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              خروج از حساب کاربری
            </Button>
          </div>
        </motion.div>

        {/* Right Column: Interactive Tabs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-8"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
            <div className="mb-8">
              <GradientMenu
                items={[
                  {
                    id: "orders",
                    title: "سفارش‌های من",
                    icon: <Package className="w-4 h-4" />,
                    badge: `(${orders.length})`,
                  },
                  {
                    id: "wishlist",
                    title: "علاقه‌مندی‌ها",
                    icon: <Heart className="w-4 h-4" />,
                    badge: `(${wishlistItems.length})`,
                  },
                  {
                    id: "addresses",
                    title: "آدرس‌ها",
                    icon: <MapPin className="w-4 h-4" />,
                    badge: `(${addresses.length})`,
                  },
                  {
                    id: "settings",
                    title: "تنظیمات حساب",
                    icon: <User className="w-4 h-4" />,
                  },
                ]}
                activeId={activeTab}
                onChange={setActiveTab}
              />
            </div>

            {/* --- 1. Orders Tab with Visual Timeline --- */}
            <TabsContent value="orders" className="space-y-6 outline-none mt-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">پیگیری و تاریخچه سفارشات</h3>
                  <p className="text-xs text-slate-500 mt-0.5">وضعیت آماده‌سازی، کد رهگیری پستی و جزئیات سفارش‌ها</p>
                </div>

                {/* Sub-filters */}
                <div className="flex items-center gap-1.5 bg-sky-50 p-1 rounded-xl border border-sky-100">
                  <button
                    onClick={() => setOrderFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      orderFilter === "all" ? "bg-[#0082CA] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    همه
                  </button>
                  <button
                    onClick={() => setOrderFilter("active")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      orderFilter === "active" ? "bg-[#0082CA] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    جاری
                  </button>
                  <button
                    onClick={() => setOrderFilter("delivered")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      orderFilter === "delivered" ? "bg-[#0082CA] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    تحویل شده
                  </button>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white border border-sky-100 rounded-3xl space-y-4 shadow-sm">
                  <Package className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-500">سفارشی در این بخش یافت نشد.</p>
                  <Button asChild className="h-10 px-6 rounded-xl bg-[#0082CA] text-white hover:bg-[#0072B5] font-bold text-xs shadow-md shadow-[#0082CA]/20">
                    <Link href="/products">مشاهده و خرید محصولات</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredOrders.map((order) => {
                    const orderId = order.order_number || order.id;
                    const orderDate = order.placed_at || order.created_at || "اخیراً";
                    const orderTotal = parsePrice(order.total || order.total_amount || 0);
                    const currentStep = getStepIndex(order.status);
                    const isCancelled = order.status?.toLowerCase() === "cancelled";

                    return (
                      <div
                        key={orderId}
                        className="bg-white border border-sky-100 hover:border-sky-300 rounded-3xl p-6 space-y-6 transition-all shadow-md shadow-sky-950/5"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sky-100">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-slate-900 font-mono">{orderId}</span>
                              <span className="text-xs text-slate-500 font-sans">
                                {formatShamsiDate(order.placed_at || order.created_at, { mode: "full", withTime: true })}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">
                              مبلغ کل: <strong className="text-slate-900">{formatPrice(orderTotal)}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black border ${
                                getProfileStatusBadge(order.status).bg
                              }`}
                            >
                              {getProfileStatusBadge(order.status).label}
                            </span>
                            <Button
                              onClick={() => fetchOrderDetails(orderId)}
                              variant="outline"
                              className="h-9 px-4 rounded-xl border-sky-200 bg-white text-slate-700 hover:bg-sky-50 font-bold text-xs shadow-sm"
                            >
                              جزئیات سفارش
                              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                            </Button>
                          </div>
                        </div>

                        {/* Visual Progress Stepper (if not cancelled) */}
                        {!isCancelled ? (
                          <div className="py-2">
                            <div className="grid grid-cols-5 gap-2 relative">
                              {ORDER_STEPS.map((step, idx) => {
                                const isPassed = idx <= currentStep;
                                const isCurrent = idx === currentStep;

                                return (
                                  <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                        isPassed
                                          ? "bg-[#0082CA] border-[#0082CA] text-white shadow-md shadow-[#0082CA]/20"
                                          : "bg-sky-50 border-sky-200 text-slate-400"
                                      }`}
                                    >
                                      {isPassed ? (
                                        <Check className="w-4 h-4 stroke-[3]" />
                                      ) : (
                                        <span className="text-xs font-bold">{idx + 1}</span>
                                      )}
                                    </div>
                                    <span
                                      className={`text-[11px] font-bold ${
                                        isCurrent ? "text-[#0082CA] font-black" : isPassed ? "text-slate-800" : "text-slate-400"
                                      }`}
                                    >
                                      {step.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                            <XCircle className="w-4 h-4 shrink-0" />
                            <span>این سفارش لغو گردیده است. در صورت نیاز با پشتیبانی تماس بگیرید.</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* --- 2. Wishlist Tab --- */}
            <TabsContent value="wishlist" className="space-y-6 outline-none mt-0">
              <h3 className="text-lg font-black text-slate-900">لیست کالاهای مورد علاقه</h3>
              {wishlistItems.length === 0 ? (
                <div className="text-center py-16 bg-white border border-sky-100 rounded-3xl space-y-4 shadow-sm">
                  <Heart className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-500">هیچ محصولی در لیست علاقه‌مندی‌های شما قرار ندارد.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistItems.map((item) => {
                    const disc = getDiscountInfo(item);
                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-sky-100 hover:border-sky-300 rounded-3xl p-4 flex items-center gap-4 transition-all shadow-sm hover:shadow-md relative overflow-hidden"
                      >
                        <div className="relative shrink-0">
                          <img
                            src={item.imageUrl || "/globe.svg"}
                            alt={item.name}
                            className="w-20 h-24 object-cover rounded-2xl border border-sky-100 bg-sky-50"
                          />
                          {disc.hasDiscount && (
                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-black shadow-md">
                              ٪{disc.discountPercent}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <Link href={`/products/${item.id}`} className="block">
                            <h4 className="text-sm font-bold text-slate-900 hover:text-[#0082CA] transition-colors truncate">
                              {item.name}
                            </h4>
                          </Link>
                          <span className="text-xs text-slate-400 block">{item.category || "پوشاک"}</span>
                          {disc.hasDiscount ? (
                            <div className="flex flex-col pt-1">
                              <span className="text-[10px] text-slate-400 line-through">
                                {formatPrice(disc.basePrice)}
                              </span>
                              <span className="text-xs font-black text-[#0082CA]">
                                {formatPrice(disc.discountPrice)}
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs font-black text-[#0082CA] pt-1">
                              {formatPrice(item.price)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            removeWishlistItem(item.id);
                            toast.info("از علاقه‌مندی‌ها حذف شد");
                          }}
                          className="p-2.5 text-slate-400 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50 cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* --- 3. Addresses Tab --- */}
            <TabsContent value="addresses" className="space-y-6 outline-none mt-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">دفترچه آدرس‌ها</h3>
                  <p className="text-xs text-slate-500 mt-0.5">آدرس‌های ارسال سفارش‌های خود را مدیریت کنید</p>
                </div>
                <Button
                  onClick={handleOpenAddAddress}
                  className="h-10 px-4 rounded-xl bg-[#0082CA] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#0072B5] shadow-md shadow-[#0082CA]/20"
                >
                  <Plus className="w-4 h-4" />
                  افزودن آدرس جدید
                </Button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-16 bg-white border border-sky-100 rounded-3xl space-y-4 shadow-sm">
                  <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-500">هنوز آدرسی در حساب کاربری شما ثبت نشده است.</p>
                  <Button onClick={handleOpenAddAddress} className="h-10 px-6 rounded-xl bg-[#0082CA] text-white hover:bg-[#0072B5] font-bold text-xs shadow-md shadow-[#0082CA]/20">
                    ثبت اولین آدرس
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="bg-white border border-sky-100 hover:border-sky-300 rounded-3xl p-6 flex flex-col justify-between space-y-4 transition-all shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#0082CA]" />
                            {addr.title || "آدرس من"}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditAddress(addr)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                              title="ویرایش"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{addr.address}</p>
                        {(addr.province || addr.city) && (
                          <p className="text-xs text-slate-400">
                            استان {addr.province} - شهر {addr.city}
                          </p>
                        )}
                        {addr.fullName && (
                          <p className="text-xs text-slate-500">
                            تحویل‌گیرنده: <strong className="text-slate-800">{addr.fullName}</strong>{" "}
                            {addr.phone && `(${addr.phone})`}
                          </p>
                        )}
                      </div>

                      {addr.postalCode && (
                        <div className="pt-3 border-t border-sky-100 text-[11px] text-slate-400 flex justify-between">
                          <span>کد پستی:</span>
                          <span className="font-mono text-slate-700" dir="ltr">
                            {addr.postalCode}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* --- 4. Security & Settings Tab --- */}
            <TabsContent value="settings" className="space-y-8 outline-none mt-0">
              {/* Basic Profile Name */}
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-4">ویرایش مشخصات حساب</h3>
                <form onSubmit={handleSaveSettings} className="bg-white border border-sky-100 rounded-3xl p-6 space-y-4 max-w-xl shadow-sm">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">نام و نام خانوادگی</label>
                    <Input
                      key={userProfile?.id || userProfile?.email || "profile-name"}
                      name="fullName"
                      defaultValue={profileFullName}
                      placeholder="مثال: علی رضایی"
                      className="bg-sky-50/50 border-sky-200 h-12 text-slate-900 text-sm rounded-xl focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                    />
                  </div>
                  <Button disabled={isLoading} type="submit" className="w-full h-12 rounded-xl bg-[#0082CA] text-white font-bold text-xs hover:bg-[#0072B5] shadow-md shadow-[#0082CA]/20">
                    {isLoading ? "در حال ذخیره..." : "ذخیره تغییرات مشخصات"}
                  </Button>
                </form>
              </div>

              {/* Change Email */}
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-4">تغییر آدرس ایمیل</h3>
                <div className="bg-white border border-sky-100 rounded-3xl p-6 max-w-xl shadow-sm space-y-4">
                  {!isEmailChangeStepTwo ? (
                    <form onSubmit={handleChangeEmailRequest} className="space-y-4">
                      <p className="text-xs text-slate-500">
                        ایمیل فعلی شما: <strong className="text-slate-900 font-mono" dir="ltr">{userProfile?.email || ""}</strong>
                      </p>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700">ایمیل جدید</label>
                        <Input
                          type="email"
                          required
                          value={newEmailInput}
                          onChange={(e) => setNewEmailInput(e.target.value)}
                          placeholder="new-email@example.com"
                          className="bg-sky-50/50 border-sky-200 h-12 text-slate-900 text-sm rounded-xl focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700">رمز عبور فعلی برای تایید هویت</label>
                        <Input
                          type="password"
                          required
                          value={emailChangePassword}
                          onChange={(e) => setEmailChangePassword(e.target.value)}
                          placeholder="••••••••"
                          className="bg-sky-50/50 border-sky-200 h-12 text-slate-900 text-sm rounded-xl focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                          dir="ltr"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isSubmittingEmailChange}
                        className="w-full h-12 rounded-xl bg-[#0082CA] text-white font-bold text-xs hover:bg-[#0072B5] shadow-md shadow-[#0082CA]/20"
                      >
                        {isSubmittingEmailChange ? "در حال ارسال کد..." : "ارسال کد تایید به ایمیل جدید"}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleConfirmEmailChange} className="space-y-4">
                      <p className="text-xs text-[#0082CA] font-bold">
                        کد تایید ارسال شده به ایمیل جدید «{newEmailInput}» را وارد کنید:
                      </p>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700">کد / توکن تایید</label>
                        <Input
                          required
                          value={emailChangeToken}
                          onChange={(e) => setEmailChangeToken(e.target.value)}
                          placeholder="کد تایید را وارد کنید"
                          className="bg-sky-50/50 border-sky-200 h-12 text-slate-900 text-sm rounded-xl font-mono text-center focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                          dir="ltr"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={isSubmittingEmailChange}
                          className="flex-1 h-12 rounded-xl bg-[#0082CA] text-white font-bold text-xs hover:bg-[#0072B5] shadow-md shadow-[#0082CA]/20"
                        >
                          {isSubmittingEmailChange ? "در حال تایید..." : "تایید نهایی ایمیل جدید"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsEmailChangeStepTwo(false)}
                          className="h-12 text-xs text-slate-500 hover:text-slate-900"
                        >
                          انصراف
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Change Password */}
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-4">تغییر کلمه عبور</h3>
                <form onSubmit={handleChangePassword} className="bg-white border border-sky-100 rounded-3xl p-6 space-y-4 max-w-xl shadow-sm">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">رمز عبور فعلی</label>
                    <div className="relative">
                      <Input
                        name="oldPassword"
                        type={showOldPassword ? "text" : "password"}
                        required
                        className="bg-sky-50/50 border-sky-200 h-12 text-slate-900 text-sm rounded-xl pr-4 pl-11 focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">رمز عبور جدید</label>
                    <div className="relative">
                      <Input
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        required
                        className="bg-sky-50/50 border-sky-200 h-12 text-slate-900 text-sm rounded-xl pr-4 pl-11 focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button disabled={isLoading} type="submit" className="w-full h-12 rounded-xl bg-[#0082CA] text-white font-bold text-xs hover:bg-[#0072B5] shadow-md shadow-[#0082CA]/20">
                    {isLoading ? "در حال ذخیره..." : "تغییر کلمه عبور"}
                  </Button>
                </form>
              </div>

              {/* Notification Preferences Sub-Panel */}
              <div className="bg-white border border-sky-100 rounded-3xl p-6 space-y-4 max-w-xl shadow-sm">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#0082CA]" />
                  تنظیمات دریافت اعلان‌ها و پیامک‌ها
                </h4>
                <p className="text-xs text-slate-500">کانال‌های اطلاع‌رسانی دلخواه خود را فعال یا غیرفعال کنید</p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 bg-sky-50/60 rounded-2xl">
                    <span className="text-xs font-bold text-slate-800">ایمیل‌های تغییر وضعیت سفارش</span>
                    <input
                      type="checkbox"
                      checked={!!preferences.email_order_updates}
                      onChange={(e) => handleTogglePreference("email_order_updates", e.target.checked)}
                      className="w-4 h-4 accent-[#0082CA] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-sky-50/60 rounded-2xl">
                    <span className="text-xs font-bold text-slate-800">ایمیل‌های تخفیف‌ها و پیشنهادات شگفت‌انگیز</span>
                    <input
                      type="checkbox"
                      checked={!!preferences.email_promotions}
                      onChange={(e) => handleTogglePreference("email_promotions", e.target.checked)}
                      className="w-4 h-4 accent-[#0082CA] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-sky-50/60 rounded-2xl">
                    <span className="text-xs font-bold text-slate-800">اعلان‌های درون‌برنامه‌ای سفارش‌ها</span>
                    <input
                      type="checkbox"
                      checked={!!preferences.in_app_order_updates}
                      onChange={(e) => handleTogglePreference("in_app_order_updates", e.target.checked)}
                      className="w-4 h-4 accent-[#0082CA] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

          </Tabs>
        </motion.div>
      </div>

      {/* --- Detailed Order Modal --- */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="bg-white border border-sky-100 text-slate-900 sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Package className="w-5 h-5 text-[#0082CA]" />
              جزئیات کامل سفارش
            </DialogTitle>
          </DialogHeader>

          {selectedOrder ? (
            <div className="space-y-6 mt-4">
              {/* Reference Banner */}
              <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">شماره سفارش:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedOrder.order_number || selectedOrder.id}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedOrder.order_number || selectedOrder.id);
                    setCopiedCode(true);
                    toast.success("شماره سفارش کپی شد");
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="p-2 bg-white hover:bg-sky-50 border border-sky-200 rounded-xl text-slate-700 transition-colors flex items-center gap-1 shadow-sm"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>کپی</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-500">اقلام سفارش</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.items?.map((it: any) => {
                    const snap = it.product_snapshot || {};
                    const itemTitle = snap.title || it.product_title || it.name || "کالای سفارش";
                    const itemOptions = snap.options || (it.size ? `سایز: ${it.size}` : "");
                    
                    let rawImage = snap.image?.url || (typeof snap.image === "string" ? snap.image : "") || it.image?.url || (typeof it.image === "string" ? it.image : "") || it.product_image || "";
                    let finalImage = rawImage;
                    if (finalImage && !finalImage.startsWith("http") && !finalImage.startsWith("data:")) {
                      const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
                      finalImage = `${backendBase}${finalImage.startsWith("/") ? "" : "/"}${finalImage}`;
                    }
                    if (!finalImage) {
                      finalImage = "/globe.svg";
                    }

                    return (
                      <div key={it.id} className="flex gap-3 bg-sky-50/50 p-3 rounded-2xl border border-sky-100 items-center">
                        <img
                          src={finalImage}
                          alt={itemTitle}
                          className="w-16 h-18 object-cover rounded-xl shrink-0 border border-sky-200 bg-white"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/globe.svg";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 truncate">{itemTitle}</h5>
                          {itemOptions && (
                            <span className="text-[11px] text-[#0082CA] block mt-0.5 truncate font-medium">
                              {itemOptions}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            تعداد: {it.quantity} | قیمت واحد: {formatPrice(it.price)}
                          </span>
                          <p className="text-xs font-black text-[#0082CA] mt-1">
                            {formatPrice(parsePrice(it.price) * (it.quantity || 1))}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping Address Box */}
              {selectedOrder.shipping_address && (
                <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-4 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">نشانی تحویل گیرنده:</span>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedOrder.shipping_address.province} - {selectedOrder.shipping_address.city}،{" "}
                    {selectedOrder.shipping_address.address}
                  </p>
                  <p className="text-slate-500">
                    تحویل‌گیرنده: {selectedOrder.shipping_address.full_name} ({selectedOrder.shipping_address.phone})
                  </p>
                </div>
              )}

              {/* Financial Totals */}
              <div className="border-t border-sky-100 pt-4 space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>وضعیت سفارش:</span>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold border",
                      getProfileStatusBadge(selectedOrder.status).bg
                    )}
                  >
                    {getProfileStatusBadge(selectedOrder.status).label}
                  </span>
                </div>
                <div className="flex justify-between items-center text-base font-black text-slate-900 pt-2 border-t border-sky-100">
                  <span>مبلغ کل پرداختی:</span>
                  <span className="text-[#0082CA] font-mono font-black">
                    {formatPrice(selectedOrder.total || selectedOrder.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">در حال دریافت اطلاعات...</div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- Address Edit/Create Modal --- */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="bg-white border border-sky-100 text-slate-900 sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              {editingAddress ? "ویرایش آدرس" : "افزودن آدرس جدید"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAddress} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">عنوان آدرس (خانه، محل کار)</label>
              <Input
                name="title"
                defaultValue={editingAddress?.title || "خانه"}
                required
                className="bg-sky-50/50 border-sky-200 h-11 text-slate-900 text-sm rounded-xl focus-visible:ring-2 focus-visible:ring-[#0082CA]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">نام تحویل‌گیرنده</label>
                <Input
                  name="fullName"
                  defaultValue={
                    editingAddress?.fullName ||
                    (userProfile ? `${userProfile?.first_name || ""} ${userProfile?.last_name || ""}`.trim() : "")
                  }
                  className="bg-sky-50/50 border-sky-200 h-11 text-slate-900 text-sm rounded-xl focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">شماره موبایل</label>
                <Input
                  name="phone"
                  defaultValue={editingAddress?.phone || ""}
                  className="bg-sky-50/50 border-sky-200 h-11 text-slate-900 text-sm rounded-xl font-sans text-left focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">استان</label>
                <Input
                  name="province"
                  defaultValue={editingAddress?.province || ""}
                  required
                  className="bg-sky-50/50 border-sky-200 h-11 text-slate-900 text-sm rounded-xl focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">شهر</label>
                <Input
                  name="city"
                  defaultValue={editingAddress?.city || ""}
                  required
                  className="bg-sky-50/50 border-sky-200 h-11 text-slate-900 text-sm rounded-xl focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">آدرس پستی کامل</label>
              <Input
                name="address"
                defaultValue={editingAddress?.address || ""}
                required
                className="bg-sky-50/50 border-sky-200 h-11 text-slate-900 text-sm rounded-xl focus-visible:ring-2 focus-visible:ring-[#0082CA]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">کد پستی (۱۰ رقمی)</label>
              <Input
                name="postalCode"
                defaultValue={editingAddress?.postalCode || ""}
                className="bg-sky-50/50 border-sky-200 h-11 text-slate-900 text-sm rounded-xl font-sans text-left focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                dir="ltr"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 h-12 rounded-xl bg-[#0082CA] text-white hover:bg-[#0072B5] font-bold text-xs shadow-md shadow-[#0082CA]/20">
                {editingAddress ? "ذخیره تغییرات آدرس" : "ثبت آدرس جدید"}
              </Button>
              <Button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                variant="ghost"
                className="h-12 rounded-xl text-slate-500 hover:text-slate-900 text-xs"
              >
                انصراف
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}