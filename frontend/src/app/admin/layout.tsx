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
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";

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
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      // Decode JWT
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.user_id || payload.id;
      
      if (userId) {
        try {
          const res = await api.get(`/api/users/me/${userId}/`);
          setCurrentUser(res.data);
        } catch {
          // Token valid but profile fetch might fallback
          setCurrentUser({ email: payload.email || "مدیر سیستم", is_staff: true });
        }
      }
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const response = await api.post("/api/auth/login/", {
        email: loginEmail,
        password: loginPassword,
      });
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      toast.success("ورود به پنل مدیریت با موفقیت انجام شد");
      await checkAdminAuth();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error?.message ||
        "اطلاعات ورود اشتباه است یا دسترسی مدیریت ندارید.";
      toast.error(msg);
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
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsAuthenticated(false);
    setCurrentUser(null);
    toast.success("از پنل مدیریت خارج شدید");
    router.push("/");
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">در حال اعتبارسنجی دسترسی مدیریت...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show sleek Admin Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4" dir="rtl">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-white/10 via-white to-white/10" />

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl mx-auto mb-4 border border-white/10 flex items-center justify-center text-white">
                <Lock className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-white mb-2">ورود به پنل مدیریت</h1>
              <p className="text-gray-400 text-xs leading-relaxed">
                لطفاً برای دسترسی به تنظیمات CMS، محصولات و سفارشات وارد حساب مدیر شوید
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">ایمیل مدیر</label>
                <Input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30 text-sm"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">رمز عبور</label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30 text-sm"
                  dir="ltr"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-12 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-sm transition-all mt-4"
              >
                {isLoggingIn ? "در حال بررسی..." : "ورود به کنترل پنل"}
              </Button>
            </form>

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
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black text-lg shadow-lg">
              ف
            </div>
            <div>
              <span className="font-black text-base text-white tracking-wider block">پنل مدیریت</span>
              <span className="text-[10px] text-gray-400 block -mt-1">Fashion Store CMS</span>
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
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              سیستم آنلاین
            </div>

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
