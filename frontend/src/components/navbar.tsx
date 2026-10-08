"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, User, Search, Trash2, Menu, Tag, X, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useNotifications } from "@/store/notifications";
import NotificationDropdown from "@/components/notification-dropdown";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/error-utils";
import { formatPrice, formatPriceNumber } from "@/lib/price-utils";
import { isTokenExpired, clearAuthSession, getStoredAuth } from "@/lib/auth";

const POPULAR_SEARCH_TAGS = [
  "پالتو کشمیر",
  "کت بلیزر میلان",
  "پیراهن ماکسی ساتن",
  "کیف دستی چرم",
  "بوت چرم ایتالیایی",
];

export default function Navbar() {
  const router = useRouter();
  const {
    items,
    removeItem,
    fetchCart,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    coupon,
    getTotal,
    getDiscountAmount,
    getFinalTotal,
  } = useCart();
  const { fetchWishlist } = useWishlist();

  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);

  const checkAuth = () => {
    if (typeof window === "undefined") return;
    const { accessToken, refreshToken, user } = getStoredAuth();

    // Check if user has an active, valid token or refresh token
    const hasValidAccess = accessToken && !isTokenExpired(accessToken, 0);
    const hasValidRefresh = refreshToken && !isTokenExpired(refreshToken, 0);
    const authenticated = Boolean(hasValidAccess || hasValidRefresh);

    setIsLoggedIn(authenticated);

    if (authenticated) {
      if (user) {
        setUserDisplayName(
          [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "کاربر گرامی"
        );
      } else if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split(".")[1]));
          setUserDisplayName(payload.email || "کاربر گرامی");
        } catch {
          setUserDisplayName("کاربر گرامی");
        }
      } else {
        setUserDisplayName("کاربر گرامی");
      }
    } else {
      setUserDisplayName(null);
      // Clean up orphaned user state if tokens are already expired/gone
      if (accessToken || refreshToken || user) {
        clearAuthSession({ notify: false, redirect: false });
      }
    }
  };

  useEffect(() => {
    checkAuth();
    const handleAuthEvent = () => checkAuth();
    window.addEventListener("auth-change", handleAuthEvent);
    window.addEventListener("storage", handleAuthEvent);
    return () => {
      window.removeEventListener("auth-change", handleAuthEvent);
      window.removeEventListener("storage", handleAuthEvent);
    };
  }, []);

  const handleLogout = async () => {
    const refresh = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    if (refresh) {
      try {
        await api.post("/api/auth/logout/", { refresh });
      } catch {
        // Graceful silent fallback
      }
    }
    clearAuthSession({ notify: false, redirect: false });
    setIsLoggedIn(false);
    setUserDisplayName(null);
    useNotifications.getState().resetNotifications();
    toast.success("با موفقیت از حساب کاربری خارج شدید");
    router.push("/");
  };
  
  // Initialize Global Data from Backend
  useEffect(() => {
    const initData = async () => {
      try {
        await fetchCart();
        const { accessToken, refreshToken } = getStoredAuth();
        if (accessToken && (!isTokenExpired(accessToken, 0) || (refreshToken && !isTokenExpired(refreshToken, 0)))) {
          await fetchWishlist();
        }
      } catch {
        // Graceful silent fallback
      }
    };
    initData();
  }, [fetchCart, fetchWishlist]);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on expansion
  useEffect(() => {
    if (isSearchExpanded) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchExpanded]);

  // Click outside to collapse search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchExpanded(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchExpanded((prev) => !prev);
      } else if (e.key === "Escape" && isSearchExpanded) {
        setIsSearchExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchExpanded]);

  // Live Backend Search Fetching
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const fetchSearch = async () => {
      try {
        const res = await api.get(`/api/products/?search=${encodeURIComponent(searchQuery)}`);
        setSearchResults(Array.isArray(res.data) ? res.data : res.data.results || []);
      } catch (e) {
        console.error("Search failed:", e);
      } finally {
        setIsSearching(false);
      }
    };
    
    const delay = setTimeout(fetchSearch, 250);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Cart Totals
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleProductClick = (id: string) => {
    setIsSearchExpanded(false);
    setSearchQuery("");
    router.push(`/products/${id}`);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchExpanded(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4" ref={searchContainerRef}>
      <motion.nav
        layout
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className={cn(
          "w-full bg-[#0082CA] backdrop-blur-2xl border border-white/25 rounded-full h-16 flex items-center justify-between px-5 md:px-7 text-white shadow-xl shadow-[#0082CA]/30 transition-[max-width,border-color] duration-500",
          isSearchExpanded ? "max-w-4xl border-white/50 ring-2 ring-white/30" : "max-w-5xl"
        )}
        dir="rtl"
      >
        {/* Right side: Brand Logo */}
        <Link href="/" className="flex items-center gap-2 text-white hover:text-sky-100 shrink-0 transition-all group">
          <span className="text-xl md:text-2xl font-black tracking-widest uppercase drop-shadow-sm font-sans">
            MAVI
          </span>
          <span className="text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-white backdrop-blur-sm group-hover:bg-white/30 transition-colors">
            ماوی
          </span>
        </Link>

        {/* Center Section: Animated Toggle between Nav Links & Expanding Search Field */}
        <div className="flex-1 flex items-center justify-center px-2 md:px-6 relative min-w-0">
          <AnimatePresence mode="wait">
            {!isSearchExpanded ? (
              <motion.div
                key="nav-links"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="hidden md:flex items-center gap-2 lg:gap-3 text-sm font-medium"
              >
                <Link href="/products" className="text-white/95 hover:text-white hover:bg-white/15 px-3 py-1.5 rounded-full transition-all text-xs md:text-sm font-semibold">فروشگاه و کاتالوگ</Link>
                <Link href="/search?sort=newest" className="text-white/95 hover:text-white hover:bg-white/15 px-3 py-1.5 rounded-full transition-all text-xs md:text-sm font-semibold">جدیدترین‌ها</Link>
                <Link href="/search?sort=best_selling" className="text-white/95 hover:text-white hover:bg-white/15 px-3 py-1.5 rounded-full transition-all text-xs md:text-sm font-semibold">پرفروش‌ترین‌ها</Link>
                <Link href="/search?sort=trending" className="text-white/95 hover:text-white hover:bg-white/15 px-3 py-1.5 rounded-full transition-all text-xs md:text-sm font-semibold">ترندها</Link>
              </motion.div>
            ) : (
              <motion.form
                key="search-bar-expanded"
                initial={{ opacity: 0, width: "0%", scale: 0.96 }}
                animate={{ opacity: 1, width: "100%", scale: 1 }}
                exit={{ opacity: 0, width: "0%", scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                onSubmit={handleSearchSubmit}
                className="w-full flex items-center bg-white/20 border border-white/35 rounded-full px-4 h-11 shadow-inner focus-within:border-white focus-within:bg-white transition-all relative text-white focus-within:text-slate-900 group"
              >
                <Search className="w-4 h-4 text-white group-focus-within:text-[#0082CA] shrink-0 ml-2 transition-colors" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی محصول، برند، متریال یا استایل..."
                  className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm text-inherit placeholder:text-white/70 focus-within:placeholder:text-slate-400 font-medium w-full"
                />
                
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-white group-focus-within:text-[#0082CA] animate-spin shrink-0 mx-2" />
                )}

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="p-1 text-white/70 hover:text-white group-focus-within:text-slate-400 group-focus-within:hover:text-slate-700 transition-colors mr-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsSearchExpanded(false)}
                  className="mr-2 text-[11px] font-bold text-white hover:bg-white/20 px-2.5 py-0.5 rounded-full bg-white/15 transition-all border border-white/25 shrink-0 group-focus-within:text-slate-700 group-focus-within:bg-slate-100 group-focus-within:hover:bg-slate-200 group-focus-within:border-slate-200"
                >
                  بستن
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Left Side: Actions (Search Trigger, User, Cart Drawer, Mobile Menu) */}
        <div className="flex items-center gap-2 md:gap-3 text-white shrink-0">
          
          {/* Magnifier Search Toggle Button (When Collapsed) */}
          {!isSearchExpanded && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsSearchExpanded(true)}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              aria-label="Open search bar"
            >
              <Search className="w-5 h-5" />
            </motion.button>
          )}

          {/* Customer Notifications (Strictly visible only when logged in, hidden for guests) */}
          {isLoggedIn && (
            <NotificationDropdown />
          )}

          {/* User Dropdown */}
          <div className="hidden md:block">
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <button 
                  className={cn(
                    "p-2 hover:bg-white/20 rounded-full transition-colors outline-none cursor-pointer flex items-center relative text-white",
                    isLoggedIn ? "bg-white/25 ring-1 ring-white/40" : "hover:bg-white/20"
                  )}
                  aria-label="User Account"
                >
                  <User className="w-5 h-5" />
                  {isLoggedIn && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-sky-100 text-slate-800 w-52 rounded-2xl shadow-2xl mt-2 p-2 font-sans">
                {isLoggedIn ? (
                  <>
                    <div className="px-3 py-2 border-b border-sky-100 mb-1">
                      <p className="text-[11px] text-slate-400">حساب کاربری</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{userDisplayName}</p>
                    </div>
                    <DropdownMenuItem asChild className="focus:bg-sky-50 focus:text-[#0082CA] cursor-pointer rounded-xl text-right">
                      <Link href="/profile">پروفایل کاربری</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-sky-50 focus:text-[#0082CA] cursor-pointer rounded-xl text-right">
                      <Link href="/profile">سفارش‌های من</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-sky-50 focus:text-[#0082CA] cursor-pointer rounded-xl text-right">
                      <Link href="/profile">لیست علاقه‌مندی‌ها</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-sky-100" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="focus:bg-rose-50 text-rose-500 hover:text-rose-600 cursor-pointer rounded-xl text-right font-bold text-xs"
                    >
                      خروج از حساب کاربری
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild className="focus:bg-sky-50 focus:text-[#0082CA] cursor-pointer rounded-xl text-right">
                    <Link href="/auth">ورود / ثبت‌نام</Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Shopping Cart Drawer */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="relative p-2 text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer outline-none flex items-center">
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-[#0082CA] font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                    {itemCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-white border-r border-sky-100 text-slate-800 w-full sm:max-w-md flex flex-col p-6 font-sans" dir="rtl">
              <SheetHeader className="text-right pb-4 border-b border-sky-100 flex flex-row items-center justify-between">
                <SheetTitle className="text-[#0B192C] text-lg font-black font-sans flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0082CA] text-white flex items-center justify-center shadow-md shadow-[#0082CA]/25">
                    <ShoppingBag className="w-4 h-4 text-white" />
                  </div>
                  سبد خرید ({itemCount})
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-slate-400">
                    <ShoppingBag className="w-12 h-12 opacity-30 text-[#0082CA]" />
                    <p className="text-sm font-medium">سبد خرید شما در حال حاضر خالی است.</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center bg-sky-50/50 p-3 rounded-2xl border border-sky-100">
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-20 object-cover rounded-xl border border-sky-100 shadow-sm" />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{item.name}</h4>
                        {item.size && (
                          <div className="text-xs text-slate-500">
                            سایز: {item.size}
                          </div>
                        )}
                        <div className="text-xs text-[#006CA8] font-bold">
                          {formatPriceNumber(item.price)} تومان × {item.quantity}
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.id, item.size, item.variant_id)} className="text-slate-400 hover:text-rose-500 transition-colors p-2 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-sky-100 pt-4 space-y-4">
                  {/* Coupon Box */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="کد تخفیف..."
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      disabled={!!coupon}
                      className="bg-sky-50/60 border-sky-200 text-slate-800 rounded-xl text-xs h-10 placeholder:text-slate-400"
                    />
                    {coupon ? (
                      <Button
                        onClick={() => removeCoupon()}
                        variant="destructive"
                        size="sm"
                        className="rounded-xl text-xs shrink-0 cursor-pointer"
                      >
                        حذف کد
                      </Button>
                    ) : (
                      <Button
                        onClick={async () => {
                          if (!couponInput.trim()) return;
                          setIsApplyingCoupon(true);
                          try {
                            await applyCoupon(couponInput.trim());
                            toast.success("کد تخفیف اعمال شد");
                            setCouponInput("");
                          } catch (err) {
                            toast.error(getApiErrorMessage(err, "کد تخفیف نامعتبر است"));
                          } finally {
                            setIsApplyingCoupon(false);
                          }
                        }}
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        variant="secondary"
                        size="sm"
                        className="rounded-xl text-xs shrink-0 cursor-pointer bg-sky-100 text-[#006CA8] hover:bg-sky-200 border border-sky-200"
                      >
                        {isApplyingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "اعمال"}
                      </Button>
                    )}
                  </div>

                  {/* Summary Details */}
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>جمع اقلام:</span>
                      <span className="font-semibold text-slate-700">{formatPrice(getTotal())}</span>
                    </div>
                    {coupon && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>تخفیف ({coupon.code}):</span>
                        <span>- {formatPrice(getDiscountAmount())}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-sky-100">
                      <span>مبلغ قابل پرداخت:</span>
                      <span className="text-[#0082CA] text-base">{formatPrice(getFinalTotal())}</span>
                    </div>
                  </div>

                  <SheetClose asChild>
                    <Button asChild className="w-full bg-[#0082CA] text-white hover:bg-[#006CA8] font-bold rounded-2xl h-12 shadow-lg shadow-[#0082CA]/25 cursor-pointer">
                      <Link href="/checkout">ثبت سفارش و پرداخت</Link>
                    </Button>
                  </SheetClose>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Mobile Navigation Sheet */}
          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer outline-none">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-white border-l border-sky-100 text-slate-800 w-[280px] flex flex-col p-6 font-sans" dir="rtl">
                <SheetHeader className="text-right pb-6 border-b border-sky-100">
                  <SheetTitle className="text-[#0082CA] text-2xl font-black font-sans flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#0082CA] text-white flex items-center justify-center shadow-md shadow-[#0082CA]/25">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span>ماوی</span>
                    <span className="text-xs uppercase tracking-widest text-sky-500 font-extrabold">MAVI</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-5 py-6 text-base font-medium">
                  <SheetClose asChild><Link href="/products" className="hover:text-[#0082CA] transition-colors text-slate-700">فروشگاه و کاتالوگ</Link></SheetClose>
                  <SheetClose asChild><Link href="/search?sort=newest" className="hover:text-[#0082CA] transition-colors text-slate-700">جدیدترین محصولات</Link></SheetClose>
                  <SheetClose asChild><Link href="/search?sort=best_selling" className="hover:text-[#0082CA] transition-colors text-slate-700">پرفروش‌ترین‌ها</Link></SheetClose>
                  <SheetClose asChild><Link href="/search?sort=trending" className="hover:text-[#0082CA] transition-colors text-slate-700">ترندها</Link></SheetClose>
                  
                  <div className="border-t border-sky-100 pt-5 flex flex-col gap-4">
                    {isLoggedIn ? (
                      <>
                        <div className="pb-1">
                          <p className="text-[11px] text-slate-400">کاربر وارد شده:</p>
                          <p className="text-xs font-bold text-emerald-600 truncate">{userDisplayName}</p>
                        </div>
                        <SheetClose asChild><Link href="/profile" className="hover:text-[#0082CA] transition-colors text-slate-700">پروفایل کاربری</Link></SheetClose>
                        <SheetClose asChild>
                          <button
                            onClick={handleLogout}
                            className="text-right text-rose-500 hover:text-rose-600 transition-colors font-bold text-sm cursor-pointer"
                          >
                            خروج از حساب کاربری
                          </button>
                        </SheetClose>
                      </>
                    ) : (
                      <SheetClose asChild><Link href="/auth" className="hover:text-[#0082CA] transition-colors text-slate-700 font-bold">ورود / ثبت‌نام</Link></SheetClose>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </motion.nav>

      {/* Floating Animated Search Suggestions / Live Results Dropdown */}
      <AnimatePresence>
        {isSearchExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-20 w-full max-w-3xl bg-white/95 backdrop-blur-2xl border border-sky-100 rounded-3xl p-5 shadow-2xl text-slate-800 z-40 overflow-hidden"
            dir="rtl"
          >
            {/* Quick Popular Keywords */}
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-sky-100 flex-wrap">
              <span className="text-xs text-slate-500 flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#0082CA]" />
                پیشنهادهای سریع:
              </span>
              {POPULAR_SEARCH_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearchQuery(tag);
                    setIsSearchExpanded(false);
                    router.push(`/search?q=${encodeURIComponent(tag)}`);
                  }}
                  className="text-xs px-3 py-1 rounded-full bg-sky-50 border border-sky-200/60 text-[#006CA8] hover:text-[#0082CA] hover:bg-sky-100 transition-all cursor-pointer font-medium"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Live Search Results List */}
            {searchResults.length > 0 ? (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                <div className="text-[11px] font-bold text-slate-500 px-1">نتایج سریع محصولات ({searchResults.length})</div>
                {searchResults.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="flex items-center gap-4 p-2.5 hover:bg-sky-50 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-sky-100"
                  >
                    <img
                      src={product.imageUrl || product.image || "/globe.svg"}
                      alt={product.name || product.title}
                      className="w-12 h-14 object-cover rounded-xl border border-sky-100 shrink-0 shadow-sm"
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <h4 className="font-bold text-xs md:text-sm text-slate-800 truncate">{product.name || product.title}</h4>
                      <span className="text-[11px] text-slate-400 mt-0.5 truncate">{product.category}</span>
                    </div>
                    <div className="text-xs font-bold text-[#0082CA] shrink-0">
                      {formatPrice(product.price)}
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-sky-100 text-center">
                  <button
                    type="button"
                    onClick={() => handleSearchSubmit()}
                    className="text-xs text-[#0082CA] hover:text-[#006CA8] font-bold py-1.5 px-4 transition-colors flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <span>مشاهده تمام نتایج جستجو در کاتالوگ</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : searchQuery.trim().length > 0 && !isSearching ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-slate-500">محصولی با این عنوان یافت نشد.</p>
                <Button
                  onClick={() => handleSearchSubmit()}
                  variant="outline"
                  size="sm"
                  className="text-xs border-sky-200 text-[#0082CA] hover:bg-sky-50 rounded-xl"
                >
                  جستجوی جامع در کاتالوگ
                </Button>
              </div>
            ) : (
              <p className="text-center text-slate-400 py-4 text-xs">
                برای جستجو نام کالا را تایپ کنید یا کلید Enter را فشار دهید...
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}