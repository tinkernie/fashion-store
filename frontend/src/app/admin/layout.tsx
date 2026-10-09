"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  Package,
  Layers,
  Percent,
  Users,
  MessageSquare,
  Store,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronLeft,
  Sparkles,
  Bell,
  Lock,
  ArrowRight,
  Phone,
  Smartphone,
  RefreshCw
} from "lucide-react";
import { MaviWordmark } from "@/components/ui/mavi-wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/error-utils";
import { HoneycombLoader } from "@/components/ui/honeycomb-loader";
import { isTokenExpired, clearAuthSession, getStoredAuth, setAuthSession } from "@/lib/auth";
import { normalizePersianDigits } from "@/lib/utils";

const NAV_ITEMS = [
  {
    title: "داشبورد و آمار",
    href: "/admin",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    title: "مدیریت محتوا (CMS)",
    href: "/admin/cms",
    icon: FileText,
    badge: "محتوا",
  },
  {
    title: "محصولات و کاتالوگ",
    href: "/admin/products",
    icon: ShoppingBag,
    badge: null,
  },
  {
    title: "کالکشن‌ها و مناسبت‌ها",
    href: "/admin/collections",
    icon: Sparkles,
    badge: "ویژه",
  },
  {
    title: "نظرات کاربران",
    href: "/admin/reviews",
    icon: MessageSquare,
    badge: "نظرات",
  },
  {
    title: "سفارشات و ارسال",
    href: "/admin/orders",
    icon: Package,
    badge: null,
  },
  {
    title: "موجودی و انبار",
    href: "/admin/inventory",
    icon: Layers,
    badge: null,
  },
  {
    title: "کدهای تخفیف",
    href: "/admin/coupons",
    icon: Percent,
    badge: null,
  },
  {
    title: "اعلان‌ها و پیام‌ها",
    href: "/admin/notifications",
    icon: Bell,
    badge: null,
  },
  {
    title: "مشتریان و کاربران",
    href: "/admin/users",
    icon: Users,
    badge: null,
  },
];


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Admin Auth States - fully synchronized with backend contracts (phone_number + password / OTP)
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const checkAdminAuth = async () => {
    if (typeof window === "undefined") return;
    const { accessToken, refreshToken } = getStoredAuth();
    if (!accessToken && !refreshToken) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      return;
    }

    if (accessToken && isTokenExpired(accessToken, 0) && (!refreshToken || isTokenExpired(refreshToken, 0))) {
      clearAuthSession({ notify: false, redirect: false });
      setIsAuthenticated(false);
      setCurrentUser(null);
      return;
    }

    try {
      // Verify with backend user profile
      const res = await api.get(`/api/users/me/`);
      const profile = res.data;

      const isSuperUser = Boolean(profile?.is_superuser);
      const isStaffUser = Boolean(profile?.is_staff);

      if (!isSuperUser && !isStaffUser) {
        // Logged in as regular customer - block access to admin panel
        setIsAuthenticated(false);
        setCurrentUser(profile || { is_staff: false, is_superuser: false });
        return;
      }

      setCurrentUser(profile);
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  const processAuthSuccess = (data: any) => {
    const user = data?.user;
    const token = data?.access;
    const refresh = data?.refresh;

    let isSuperUser = Boolean(user?.is_superuser);
    let isStaff = Boolean(user?.is_staff);

    if (!isSuperUser && !isStaff && token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        isSuperUser = Boolean(payload?.is_superuser);
        isStaff = Boolean(payload?.is_staff);
      } catch {
        // ignore
      }
    }

    if (!isSuperUser && !isStaff) {
      toast.error("دسترسی غیرمجاز: این حساب کاربری دسترسی مدیریت (Staff / Superuser) ندارد.");
      return;
    }

    setAuthSession({
      access: token,
      refresh: refresh,
      user: user,
    });

    setCurrentUser(user);
    setIsAuthenticated(true);
    toast.success("ورود به پنل مدیریت با موفقیت انجام شد");
  };

  // 1. Password Login: POST /api/auth/login/ { phone_number, password }
  const handleAdminPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = normalizePersianDigits(loginPhone);
    if (!/^09\d{9}$/.test(phone)) {
      toast.error("شماره موبایل باید ۱۱ رقم بوده و با 09 شروع شود (مثال: 09123456789).");
      return;
    }
    if (!loginPassword) {
      toast.error("لطفاً رمز عبور مدیر را وارد کنید.");
      return;
    }
    setIsLoggingIn(true);
    try {
      const response = await api.post("/api/auth/login/", {
        phone_number: phone,
        password: loginPassword,
      });
      processAuthSuccess(response.data);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "شماره موبایل یا رمز عبور اشتباه است، یا دسترسی مدیریت ندارید."));
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 2. OTP Request: POST /api/auth/otp/request/ { phone_number, purpose: "login" }
  const handleAdminRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = normalizePersianDigits(loginPhone);
    if (!/^09\d{9}$/.test(phone)) {
      toast.error("شماره موبایل باید ۱۱ رقم بوده و با 09 شروع شود (مثال: 09123456789).");
      return;
    }
    setIsLoggingIn(true);
    try {
      await api.post("/api/auth/otp/request/", {
        phone_number: phone,
        purpose: "login",
      });
      setOtpStep("verify");
      setOtpCooldown(60);
      toast.success("کد تأیید یک‌بارمصرف پیامک شد");
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "خطا در ارسال کد پیامکی"));
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 3. OTP Verify: POST /api/auth/otp/verify/ { phone_number, code, purpose: "login" }
  const handleAdminVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = normalizePersianDigits(loginPhone);
    const code = normalizePersianDigits(otpCode);
    if (!code || code.length < 4) {
      toast.error("کد تأیید را به طور کامل وارد کنید");
      return;
    }
    setIsLoggingIn(true);
    try {
      const response = await api.post("/api/auth/otp/verify/", {
        phone_number: phone,
        code: code,
        purpose: "login",
      });
      processAuthSuccess(response.data);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "کد تأیید اشتباه است یا منقضی شده"));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        await api.post("/api/auth/logout/", { refresh });
      }
    } catch {
      // ignore
    }
    clearAuthSession({ notify: false, redirect: false });
    setIsAuthenticated(false);
    setCurrentUser(null);
    toast.success("از پنل مدیریت خارج شدید");
    router.push("/");
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white" dir="rtl">
        <HoneycombLoader 
          size="default" 
          text="در حال اعتبارسنجی دسترسی مدیریت..." 
        />
      </div>
    );
  }

  // If not logged in or not staff, show sleek Admin Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4" dir="rtl">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#0082CA]/20 via-[#0082CA] to-[#0082CA]/20" />

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl mx-auto mb-4 border border-[#0082CA]/30 flex items-center justify-center text-[#0082CA] shadow-lg shadow-[#0082CA]/10">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-white mb-2">ورود به پنل مدیریت ماوی</h1>
              <p className="text-gray-400 text-xs leading-relaxed">
                دسترسی به کنترل پنل محصولات، سفارشات، کاربران و CMS
              </p>
            </div>

            {currentUser && currentUser.is_staff === false && (
              <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 leading-relaxed text-center space-y-2">
                <div>
                  شما با شماره موبایل عادی (<span dir="ltr" className="font-mono text-amber-200">{currentUser.phone_number || "کاربر عادی"}</span>) وارد شده‌اید و دسترسی مدیریت سیستم ندارید.
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-[11px] underline text-amber-200 hover:text-white transition-colors cursor-pointer"
                >
                  خروج و ورود با حساب مدیر
                </button>
              </div>
            )}

            {/* Auth Mode Tabs (Password vs OTP) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#1a1a1a] border border-white/10 rounded-2xl mb-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("password");
                  setOtpStep("request");
                }}
                className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === "password"
                    ? "bg-[#0082CA] text-white shadow-md shadow-[#0082CA]/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>رمز عبور</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("otp")}
                className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === "otp"
                    ? "bg-[#0082CA] text-white shadow-md shadow-[#0082CA]/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>کد پیامکی (OTP)</span>
              </button>
            </div>

            {/* Tab 1: Password Login */}
            {authMode === "password" && (
              <form onSubmit={handleAdminPasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#0082CA]" />
                    <span>شماره موبایل مدیر</span>
                  </label>
                  <Input
                    type="tel"
                    required
                    placeholder="09123456789"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-[#0082CA] text-sm"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#0082CA]" />
                    <span>رمز عبور</span>
                  </label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-[#0082CA] text-sm"
                    dir="ltr"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full h-12 rounded-xl bg-[#0082CA] hover:bg-[#0072B5] text-white font-bold text-sm transition-all mt-4 shadow-lg shadow-[#0082CA]/25 cursor-pointer"
                >
                  {isLoggingIn ? "در حال اعتبارسنجی..." : "ورود به کنترل پنل"}
                </Button>
              </form>
            )}

            {/* Tab 2: OTP Login */}
            {authMode === "otp" && (
              <div className="space-y-4">
                {otpStep === "request" ? (
                  <form onSubmit={handleAdminRequestOtp} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#0082CA]" />
                        <span>شماره موبایل مدیر</span>
                      </label>
                      <Input
                        type="tel"
                        required
                        placeholder="09123456789"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-[#0082CA] text-sm"
                        dir="ltr"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full h-12 rounded-xl bg-[#0082CA] hover:bg-[#0072B5] text-white font-bold text-sm transition-all mt-4 shadow-lg shadow-[#0082CA]/25 cursor-pointer"
                    >
                      {isLoggingIn ? "در حال ارسال پیامک..." : "دریافت کد پیامکی"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleAdminVerifyOtp} className="space-y-4">
                    <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-xs text-sky-300 text-center flex items-center justify-between">
                      <span dir="ltr" className="font-mono text-white">{loginPhone}</span>
                      <button
                        type="button"
                        onClick={() => setOtpStep("request")}
                        className="text-[11px] underline text-sky-400 hover:text-white cursor-pointer"
                      >
                        ویرایش شماره
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-[#0082CA]" />
                        <span>کد تأیید پیامک‌شده</span>
                      </label>
                      <Input
                        type="text"
                        required
                        maxLength={8}
                        placeholder="12345"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="bg-[#0a0a0a] border-white/10 h-12 text-white text-center text-lg tracking-widest placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-[#0082CA]"
                        dir="ltr"
                        autoFocus
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      {otpCooldown > 0 ? (
                        <span>ارسال مجدد تا {otpCooldown} ثانیه دیگر</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleAdminRequestOtp}
                          disabled={isLoggingIn}
                          className="text-[#0082CA] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>ارسال مجدد کد</span>
                        </button>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full h-12 rounded-xl bg-[#0082CA] hover:bg-[#0072B5] text-white font-bold text-sm transition-all mt-4 shadow-lg shadow-[#0082CA]/25 cursor-pointer"
                    >
                      {isLoggingIn ? "در حال تأیید کد..." : "ورود به کنترل پنل"}
                    </Button>
                  </form>
                )}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <Link
                href="/"
                className="text-xs text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-1"
              >
                <span>بازگشت به فروشگاه</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex" dir="rtl">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-72 bg-[#0d0d0d] border-l border-white/10 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-20 px-6 border-b border-white/10 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-[#0082CA] flex items-center justify-center font-black text-lg shadow-lg">
              م
            </div>
            <div>
              <span className="font-black text-base text-white tracking-wider block">پنل مدیریت ماوی</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MaviWordmark className="h-2.5 w-auto text-sky-400" />
                <span className="text-[9px] text-sky-300 font-extrabold tracking-widest uppercase">CMS</span>
              </div>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Manager Quick Profile */}
        <div className="p-4 mx-4 mt-4 mb-2 bg-[#141414] border border-white/5 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">
              {currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ""}` : "مدیر ارشد"}
            </div>
            <div className="text-[11px] text-gray-400 truncate" dir="ltr">
              {currentUser?.email || "admin"}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 hide-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-white text-black shadow-lg font-bold"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-black" : "text-gray-400 group-hover:text-white"
                    }`}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? "bg-black/10 text-black"
                        : "bg-white/10 text-gray-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 text-xs font-bold transition-all"
          >
            <Store className="w-4 h-4" />
            <span>مشاهده وب‌سایت زنده</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-red-400 hover:bg-red-500/10 text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از پنل</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:mr-72 min-w-0">
        {/* Top Navbar */}
        <header className="h-20 bg-[#0d0d0d]/80 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white p-2 rounded-xl bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
              <Link href="/admin" className="hover:text-white">
                مدیریت
              </Link>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="text-white font-bold">
                {NAV_ITEMS.find((n) =>
                  n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)
                )?.title || "صفحه"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 text-xs font-bold bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-xl transition-all"
            >
              <Store className="w-3.5 h-3.5" />
              فروشگاه
            </Link>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
