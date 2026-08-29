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
import Link from "next/link";
import { api } from "@/lib/api";

const getUserIdFromToken = () => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user_id || payload.id;
  } catch (e) {
    return null;
  }
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
  if (s === "shipping") return 3;
  if (s === "packing") return 2;
  if (s === "paid" || s === "processing") return 1;
  return 0;
};

export default function ProfilePage() {
  const router = useRouter();
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
      toast.error("لطفاً ابتدا وارد حساب کاربری خود شوید");
      router.push("/auth");
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
        const [ordersRes, profileRes, notifsRes] = await Promise.allSettled([
          api.get("/api/orders/"),
          api.get("/api/users/me/"),
          api.get("/api/notifications/"),
        ]);

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
          const notifList = Array.isArray(notifsRes.value.data)
            ? notifsRes.value.data
            : notifsRes.value.data.results || [];
          setNotifications(notifList);
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
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    toast.success("با موفقیت از حساب کاربری خارج شدید");
    router.push("/");
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const userId = getUserIdFromToken();
    if (!userId) return;

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const [firstName, ...lastNames] = fullName.split(" ");

    try {
      await api.patch("/api/users/me/", {
        first_name: firstName || "",
        last_name: lastNames.join(" ") || "",
      });
      toast.success("اطلاعات کاربری بروزرسانی شد");
    } catch (error) {
      toast.error("خطا در بروزرسانی اطلاعات");
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

  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      await api.post("/api/notifications/mark-read/", { notification_id: notifId });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
      toast.success("اعلان خوانده شد");
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.post("/api/notifications/mark-all-read/");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("تمام اعلان‌ها به عنوان خوانده شده علامت‌گذاری شدند");
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
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
      const data = error?.response?.data;
      const msg =
        data?.error?.message ||
        data?.detail ||
        data?.message ||
        "تغییر رمز عبور ناموفق بود. لطفاً رمز عبور فعلی را بررسی کنید.";
      toast.error(msg);
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

  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  if (!mounted) return null;

  return (
    <main className="min-h-screen pt-28 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-white" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: User Summary Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 space-y-6"
        >
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 md:p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-white to-amber-400" />

            <div className="w-24 h-24 bg-gradient-to-tr from-amber-400/20 to-white/10 rounded-full mx-auto mb-4 border-2 border-white/20 flex items-center justify-center shadow-xl">
              <User className="w-10 h-10 text-amber-400" />
            </div>

            <h2 className="text-xl font-black text-white mb-1">
              {userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : "کاربر گرامی"}
            </h2>
            <p className="text-xs text-gray-400 font-sans mb-6" dir="ltr">
              {userProfile?.email || ""}
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/10 mb-6 text-center">
              <div>
                <span className="text-base font-black text-white">{orders.length.toLocaleString("fa-IR")}</span>
                <span className="text-[10px] text-gray-500 block">سفارش‌ها</span>
              </div>
              <div>
                <span className="text-base font-black text-white">{wishlistItems.length.toLocaleString("fa-IR")}</span>
                <span className="text-[10px] text-gray-500 block">علاقه‌مندی</span>
              </div>
              <div>
                <span className="text-base font-black text-white">{addresses.length.toLocaleString("fa-IR")}</span>
                <span className="text-[10px] text-gray-500 block">آدرس‌ها</span>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/20 h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all"
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
          <Tabs defaultValue="orders" className="w-full" dir="rtl">
            <div className="overflow-x-auto hide-scrollbar pb-2">
              <TabsList className="flex w-max md:w-auto gap-2 bg-[#111111] p-1.5 rounded-2xl border border-white/10 mb-8 justify-start">
                <TabsTrigger
                  value="orders"
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl px-5 py-2.5 transition-all flex items-center gap-2 text-xs md:text-sm font-bold shrink-0"
                >
                  <Package className="w-4 h-4" />
                  سفارش‌های من ({orders.length})
                </TabsTrigger>
                <TabsTrigger
                  value="wishlist"
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl px-5 py-2.5 transition-all flex items-center gap-2 text-xs md:text-sm font-bold shrink-0"
                >
                  <Heart className="w-4 h-4" />
                  علاقه‌مندی‌ها ({wishlistItems.length})
                </TabsTrigger>
                <TabsTrigger
                  value="addresses"
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl px-5 py-2.5 transition-all flex items-center gap-2 text-xs md:text-sm font-bold shrink-0"
                >
                  <MapPin className="w-4 h-4" />
                  آدرس‌ها ({addresses.length})
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl px-5 py-2.5 transition-all flex items-center gap-2 text-xs md:text-sm font-bold shrink-0 relative"
                >
                  <Bell className="w-4 h-4" />
                  اعلان‌ها
                  {unreadNotifsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl px-5 py-2.5 transition-all flex items-center gap-2 text-xs md:text-sm font-bold shrink-0"
                >
                  <User className="w-4 h-4" />
                  تنظیمات امنیتی
                </TabsTrigger>
              </TabsList>
            </div>

            {/* --- 1. Orders Tab with Visual Timeline --- */}
            <TabsContent value="orders" className="space-y-6 outline-none mt-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white">پیگیری و تاریخچه سفارشات</h3>
                  <p className="text-xs text-gray-400 mt-0.5">وضعیت آماده‌سازی، کد رهگیری پستی و جزئیات سفارش‌ها</p>
                </div>

                {/* Sub-filters */}
                <div className="flex items-center gap-1.5 bg-[#181818] p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setOrderFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      orderFilter === "all" ? "bg-white text-black" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    همه
                  </button>
                  <button
                    onClick={() => setOrderFilter("active")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      orderFilter === "active" ? "bg-white text-black" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    جاری
                  </button>
                  <button
                    onClick={() => setOrderFilter("delivered")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      orderFilter === "delivered" ? "bg-white text-black" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    تحویل شده
                  </button>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-[#111111] border border-white/10 rounded-3xl space-y-4">
                  <Package className="w-12 h-12 text-gray-600 mx-auto" />
                  <p className="text-sm text-gray-400">سفارشی در این بخش یافت نشد.</p>
                  <Button asChild className="h-10 px-6 rounded-xl bg-white text-black font-bold text-xs">
                    <Link href="/products">مشاهده و خرید محصولات</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredOrders.map((order) => {
                    const orderId = order.order_number || order.id;
                    const orderDate = order.placed_at || order.created_at || "اخیراً";
                    const orderTotal = parseFloat(order.total || order.total_amount || 0);
                    const currentStep = getStepIndex(order.status);
                    const isCancelled = order.status?.toLowerCase() === "cancelled";

                    return (
                      <div
                        key={orderId}
                        className="bg-[#111111] border border-white/10 hover:border-white/20 rounded-3xl p-6 space-y-6 transition-all shadow-xl"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-white font-mono">{orderId}</span>
                              <span className="text-xs text-gray-500">{orderDate}</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              مبلغ کل: <strong className="text-white">{orderTotal.toLocaleString("fa-IR")} تومان</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black border ${
                                isCancelled
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : currentStep === 4
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-amber-400/10 text-amber-400 border-amber-400/20"
                              }`}
                            >
                              {order.status}
                            </span>
                            <Button
                              onClick={() => fetchOrderDetails(orderId)}
                              variant="outline"
                              className="h-9 px-4 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white hover:text-black font-bold text-xs"
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
                                      className={`text-[11px] font-bold ${
                                        isCurrent ? "text-amber-400 font-black" : isPassed ? "text-white" : "text-gray-500"
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
                          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
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
              <h3 className="text-lg font-black text-white">لیست کالاهای مورد علاقه</h3>
              {wishlistItems.length === 0 ? (
                <div className="text-center py-16 bg-[#111111] border border-white/10 rounded-3xl space-y-4">
                  <Heart className="w-12 h-12 text-gray-600 mx-auto" />
                  <p className="text-sm text-gray-400">هیچ محصولی در لیست علاقه‌مندی‌های شما قرار ندارد.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#111111] border border-white/10 hover:border-white/20 rounded-3xl p-4 flex items-center gap-4 transition-all shadow-lg"
                    >
                      <img
                        src={item.imageUrl || "/globe.svg"}
                        alt={item.name}
                        className="w-20 h-24 object-cover rounded-2xl border border-white/10 shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <Link href={`/products/${item.id}`} className="block">
                          <h4 className="text-sm font-bold text-white hover:text-amber-400 transition-colors truncate">
                            {item.name}
                          </h4>
                        </Link>
                        <span className="text-xs text-gray-500 block">{item.category || "پوشاک"}</span>
                        <p className="text-xs font-black text-gray-200 pt-1">
                          {item.price?.toLocaleString("fa-IR")} تومان
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          removeWishlistItem(item.id);
                          toast.info("از علاقه‌مندی‌ها حذف شد");
                        }}
                        className="p-2.5 text-gray-500 hover:text-rose-400 transition-colors rounded-xl hover:bg-white/5"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* --- 3. Addresses Tab --- */}
            <TabsContent value="addresses" className="space-y-6 outline-none mt-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">دفترچه آدرس‌ها</h3>
                  <p className="text-xs text-gray-400 mt-0.5">آدرس‌های ارسال سفارش‌های خود را مدیریت کنید</p>
                </div>
                <Button
                  onClick={handleOpenAddAddress}
                  className="h-10 px-4 rounded-xl bg-white text-black font-bold text-xs flex items-center gap-1.5 hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                  افزودن آدرس جدید
                </Button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-16 bg-[#111111] border border-white/10 rounded-3xl space-y-4">
                  <MapPin className="w-12 h-12 text-gray-600 mx-auto" />
                  <p className="text-sm text-gray-400">هنوز آدرسی در حساب کاربری شما ثبت نشده است.</p>
                  <Button onClick={handleOpenAddAddress} className="h-10 px-6 rounded-xl bg-white text-black font-bold text-xs">
                    ثبت اولین آدرس
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="bg-[#111111] border border-white/10 hover:border-white/20 rounded-3xl p-6 flex flex-col justify-between space-y-4 transition-all shadow-lg"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-amber-400" />
                            {addr.title || "آدرس من"}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditAddress(addr)}
                              className="p-1.5 text-gray-400 hover:text-white transition-colors"
                              title="ویرایش"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-400 transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{addr.address}</p>
                        {(addr.province || addr.city) && (
                          <p className="text-xs text-gray-500">
                            استان {addr.province} - شهر {addr.city}
                          </p>
                        )}
                        {addr.fullName && (
                          <p className="text-xs text-gray-400">
                            تحویل‌گیرنده: <strong className="text-gray-200">{addr.fullName}</strong>{" "}
                            {addr.phone && `(${addr.phone})`}
                          </p>
                        )}
                      </div>

                      {addr.postalCode && (
                        <div className="pt-3 border-t border-white/5 text-[11px] text-gray-500 flex justify-between">
                          <span>کد پستی:</span>
                          <span className="font-mono text-gray-300" dir="ltr">
                            {addr.postalCode}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* --- 4. In-App Notifications Tab --- */}
            <TabsContent value="notifications" className="space-y-6 outline-none mt-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">اعلان‌ها و رویدادهای حساب</h3>
                  <p className="text-xs text-gray-400 mt-0.5">پیام‌های سفارش‌ها، تخفیف‌های ویژه و هشدارهای امنیتی</p>
                </div>
                {unreadNotifsCount > 0 && (
                  <Button
                    onClick={handleMarkAllNotificationsRead}
                    variant="outline"
                    className="h-9 px-3.5 rounded-xl border-white/10 bg-white/5 text-xs text-amber-400 hover:text-white font-bold"
                  >
                    خوانده شدن همه ({unreadNotifsCount.toLocaleString("fa-IR")})
                  </Button>
                )}
              </div>


              {notifications.length === 0 ? (
                <div className="text-center py-16 bg-[#111111] border border-white/10 rounded-3xl space-y-4">
                  <Bell className="w-12 h-12 text-gray-600 mx-auto" />
                  <p className="text-sm text-gray-400">در حال حاضر هیچ اعلان جدیدی وجود ندارد.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                        notif.is_read
                          ? "bg-[#111111] border-white/5 opacity-70"
                          : "bg-white/5 border-white/15 shadow-lg"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{notif.title || "پیام سیستم"}</span>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{notif.body || notif.message}</p>
                        <span className="text-[10px] text-gray-500 block pt-1">{notif.created_at || "اخیراً"}</span>
                      </div>

                      {!notif.is_read && (
                        <Button
                          onClick={() => handleMarkNotificationRead(notif.id)}
                          variant="ghost"
                          className="text-xs text-gray-400 hover:text-white h-8 px-3 rounded-lg"
                        >
                          خوانده شد
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* --- 5. Security & Settings Tab --- */}
            <TabsContent value="settings" className="space-y-8 outline-none mt-0">
              <div>
                <h3 className="text-lg font-black text-white mb-4">ویرایش اطلاعات پایه حساب</h3>
                <form onSubmit={handleSaveSettings} className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4 max-w-xl shadow-xl">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300">نام و نام خانوادگی</label>
                    <Input
                      name="fullName"
                      defaultValue={userProfile ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() : ""}
                      className="bg-[#181818] border-white/10 h-12 text-white text-sm rounded-xl"
                    />
                  </div>
                  <Button disabled={isLoading} type="submit" className="w-full h-12 rounded-xl bg-white text-black font-bold text-xs hover:bg-gray-200">
                    {isLoading ? "در حال ذخیره..." : "ذخیره تغییرات مشخصات"}
                  </Button>
                </form>
              </div>

              <div>
                <h3 className="text-lg font-black text-white mb-4">تغییر کلمه عبور</h3>
                <form onSubmit={handleChangePassword} className="bg-[#111111] border border-white/10 rounded-3xl p-6 space-y-4 max-w-xl shadow-xl">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300">رمز عبور فعلی</label>
                    <div className="relative">
                      <Input
                        name="oldPassword"
                        type={showOldPassword ? "text" : "password"}
                        required
                        className="bg-[#181818] border-white/10 h-12 text-white text-sm rounded-xl pr-4 pl-11"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"
                      >
                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300">رمز عبور جدید</label>
                    <div className="relative">
                      <Input
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        required
                        className="bg-[#181818] border-white/10 h-12 text-white text-sm rounded-xl pr-4 pl-11"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button disabled={isLoading} type="submit" className="w-full h-12 rounded-xl bg-white text-black font-bold text-xs hover:bg-gray-200">
                    {isLoading ? "در حال ذخیره..." : "تغییر کلمه عبور"}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* --- Detailed Order Modal --- */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border border-white/10 text-white sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              جزئیات کامل سفارش
            </DialogTitle>
          </DialogHeader>

          {selectedOrder ? (
            <div className="space-y-6 mt-4">
              {/* Reference Banner */}
              <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-400 block">شماره سفارش:</span>
                  <span className="font-mono font-bold text-white text-sm">{selectedOrder.order_number || selectedOrder.id}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedOrder.order_number || selectedOrder.id);
                    setCopiedCode(true);
                    toast.success("شماره سفارش کپی شد");
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>کپی</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-gray-400">اقلام سفارش</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.items?.map((it: any) => (
                    <div key={it.id} className="flex gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <img
                        src={it.image?.url || it.image || it.product_image || "/globe.svg"}
                        alt={it.product_title || it.name}
                        className="w-14 h-16 object-cover rounded-xl shrink-0 border border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-white truncate">{it.product_title || it.name}</h5>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          تعداد: {it.quantity} | قیمت واحد: {parseFloat(it.price || 0).toLocaleString("fa-IR")} تومان
                        </span>
                        <p className="text-xs font-black text-amber-400 mt-1">
                          {(parseFloat(it.price || 0) * (it.quantity || 1)).toLocaleString("fa-IR")} تومان
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address Box */}
              {selectedOrder.shipping_address && (
                <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                  <span className="font-bold text-gray-300 block">نشانی تحویل گیرنده:</span>
                  <p className="text-gray-400 leading-relaxed">
                    {selectedOrder.shipping_address.province} - {selectedOrder.shipping_address.city}،{" "}
                    {selectedOrder.shipping_address.address}
                  </p>
                  <p className="text-gray-500">
                    تحویل‌گیرنده: {selectedOrder.shipping_address.full_name} ({selectedOrder.shipping_address.phone})
                  </p>
                </div>
              )}

              {/* Financial Totals */}
              <div className="border-t border-white/10 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>وضعیت سفارش:</span>
                  <span className="font-bold text-amber-400">{selectedOrder.status}</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/5">
                  <span>مبلغ پرداختی:</span>
                  <span className="text-emerald-400">
                    {parseFloat(selectedOrder.total || selectedOrder.total_amount || 0).toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-xs">در حال دریافت اطلاعات...</div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- Address Edit/Create Modal --- */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border border-white/10 text-white sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              {editingAddress ? "ویرایش آدرس" : "افزودن آدرس جدید"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAddress} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">عنوان آدرس (خانه، محل کار)</label>
              <Input
                name="title"
                defaultValue={editingAddress?.title || "خانه"}
                required
                className="bg-[#181818] border-white/10 h-11 text-white text-sm rounded-xl"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">نام تحویل‌گیرنده</label>
                <Input
                  name="fullName"
                  defaultValue={
                    editingAddress?.fullName ||
                    (userProfile ? `${userProfile?.first_name || ""} ${userProfile?.last_name || ""}`.trim() : "")
                  }
                  className="bg-[#181818] border-white/10 h-11 text-white text-sm rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">شماره موبایل</label>
                <Input
                  name="phone"
                  defaultValue={editingAddress?.phone || ""}
                  className="bg-[#181818] border-white/10 h-11 text-white text-sm rounded-xl font-sans text-left"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">استان</label>
                <Input
                  name="province"
                  defaultValue={editingAddress?.province || ""}
                  required
                  className="bg-[#181818] border-white/10 h-11 text-white text-sm rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">شهر</label>
                <Input
                  name="city"
                  defaultValue={editingAddress?.city || ""}
                  required
                  className="bg-[#181818] border-white/10 h-11 text-white text-sm rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">آدرس پستی کامل</label>
              <Input
                name="address"
                defaultValue={editingAddress?.address || ""}
                required
                className="bg-[#181818] border-white/10 h-11 text-white text-sm rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">کد پستی (۱۰ رقمی)</label>
              <Input
                name="postalCode"
                defaultValue={editingAddress?.postalCode || ""}
                className="bg-[#181818] border-white/10 h-11 text-white text-sm rounded-xl font-sans text-left"
                dir="ltr"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 h-12 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs">
                {editingAddress ? "ذخیره تغییرات آدرس" : "ثبت آدرس جدید"}
              </Button>
              <Button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                variant="ghost"
                className="h-12 rounded-xl text-gray-400 hover:text-white text-xs"
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