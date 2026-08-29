"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, User, Search, Trash2, Menu, Tag, X, Loader2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { api } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const {
    items,
    removeItem,
    fetchCart,
    coupon,
    applyCoupon,
    removeCoupon,
    getTotal,
    getDiscountAmount,
    getFinalTotal,
  } = useCart();
  const { fetchWishlist } = useWishlist();

  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  // Initialize Global Data from Backend
  useEffect(() => {
    const initData = async () => {
      try {
        await fetchCart();
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (token) {
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Keyboard Shortcut for Search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Live Backend Search Fetching
  useEffect(() => {
    const fetchSearch = async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await api.get(`/api/products/?search=${searchQuery}`);
        setSearchResults(Array.isArray(res.data) ? res.data : res.data.results || []);
      } catch (e) {
        console.error("Search failed:", e);
      }
    };
    
    const delay = setTimeout(fetchSearch, 300); // 300ms debounce
    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Cart Totals
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleProductClick = (id: string) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    router.push(`/products/${id}`);
  };

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="w-full max-w-5xl bg-[#111111]/80 backdrop-blur-xl border border-white/10 rounded-full h-16 flex items-center justify-between px-6 md:px-8 text-white shadow-2xl">
        
        {/* Brand Logo */}
        <Link href="/" className="text-xl font-black tracking-widest uppercase text-white">
          فشن استور
        </Link>

        {/* Desktop Categories */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <Link href="/products" className="hover:text-white transition-colors">فروشگاه و کاتالوگ</Link>
          <Link href="/search?sort=newest" className="hover:text-white transition-colors">جدیدترین‌ها</Link>
          <Link href="/search?sort=popularity" className="hover:text-white transition-colors">پرفروش‌ترین‌ها</Link>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-4 md:gap-6 text-gray-300">
          
          {/* Mobile Navigation Menu (Hidden on Desktop) */}
          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <button className="hover:text-white transition-colors cursor-pointer outline-none">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#0a0a0a] border-l border-white/10 text-white w-[280px] flex flex-col p-6" dir="rtl">
                <SheetHeader className="text-right pb-6 border-b border-white/10">
                  <SheetTitle className="text-white text-2xl font-black font-sans">منو</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 py-6 text-lg font-medium">
                  <SheetClose asChild><Link href="/products" className="hover:text-gray-300 transition-colors">فروشگاه و کاتالوگ</Link></SheetClose>
                  <SheetClose asChild><Link href="/search?sort=newest" className="hover:text-gray-300 transition-colors">جدیدترین محصولات</Link></SheetClose>
                  <SheetClose asChild><Link href="/search?sort=popularity" className="hover:text-gray-300 transition-colors">پرفروش‌ترین‌ها</Link></SheetClose>
                  <div className="border-t border-white/10 pt-6 flex flex-col gap-6">
                    <SheetClose asChild><Link href="/profile" className="hover:text-gray-300 transition-colors">پروفایل کاربری</Link></SheetClose>
                    <SheetClose asChild><Link href="/auth" className="hover:text-gray-300 transition-colors">ورود / ثبت‌نام</Link></SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Search Spotlight Modal */}
          <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <DialogTrigger asChild>
              <button className="hover:text-white transition-colors"><Search className="w-5 h-5" /></button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0a0a] border border-white/10 text-white sm:max-w-2xl gap-0 p-0 overflow-hidden shadow-2xl" dir="rtl">
              <DialogHeader className="sr-only">
                <DialogTitle>جستجوی محصولات</DialogTitle>
              </DialogHeader>
              
              {/* Search Input */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    setIsSearchOpen(false);
                    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                  }
                }}
                className="flex items-center border-b border-white/10 px-6 py-4"
              >
                <Search className="w-6 h-6 text-gray-500 ml-4 shrink-0" />
                <input 
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-600 font-sans text-xl"
                  placeholder="جستجوی محصول، دسته‌بندی..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </form>

              {/* Search Results */}
              <div className="max-h-[50vh] overflow-y-auto p-4 space-y-2">
                {searchQuery.length > 0 && searchResults.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-gray-500 text-sm">محصولی در پیش‌نمایش سریع یافت نشد.</p>
                    <Button
                      onClick={() => {
                        setIsSearchOpen(false);
                        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                      }}
                      variant="outline"
                      className="text-xs border-white/10 text-white"
                    >
                      جستجوی پیشرفته در کاتالوگ
                    </Button>
                  </div>
                ) : (
                  <>
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-colors"
                      >
                        <img 
                          src={product.imageUrl || product.image || "/globe.svg"} 
                          alt={product.name || product.title} 
                          className="w-14 h-16 object-cover rounded-xl border border-white/5"
                        />
                        <div className="flex flex-col">
                          <h4 className="font-bold text-sm text-white">{product.name || product.title}</h4>
                          <span className="text-xs text-gray-500 mt-1">{product.category}</span>
                        </div>
                        <div className="mr-auto text-sm text-gray-300 font-medium">
                          {product.price} تومان
                        </div>
                      </div>
                    ))}
                    {searchQuery.trim().length > 0 && (
                      <div className="pt-2 border-t border-white/10 text-center">
                        <button
                          onClick={() => {
                            setIsSearchOpen(false);
                            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                          }}
                          className="text-xs text-amber-400 hover:text-amber-300 font-bold py-2 px-4 transition-colors"
                        >
                          مشاهده تمام نتایج جستجو برای «{searchQuery}» ←
                        </button>
                      </div>
                    )}
                  </>
                )}
                {searchQuery.length === 0 && (
                  <p className="text-center text-gray-600 py-8 text-sm">برای جستجو شروع به تایپ کنید یا Enter را بزنید...</p>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* User Dropdown (Hidden on mobile to save space, moved to mobile menu) */}
          <div className="hidden md:block">
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <button className="hover:text-white transition-colors outline-none cursor-pointer flex items-center"><User className="w-5 h-5" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#111111] border border-white/10 text-white w-48 rounded-2xl shadow-2xl mt-2 p-2 font-sans">
                <DropdownMenuItem asChild className="hover:bg-white/10 focus:bg-white/10 cursor-pointer rounded-xl mb-1">
                  <Link href="/profile" className="flex items-center w-full">پروفایل کاربری</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-white/10 focus:bg-white/10 cursor-pointer rounded-xl mb-1">
                  <Link href="/profile" className="flex items-center w-full">سفارشات من</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10 my-1" />
                <DropdownMenuItem asChild className="hover:bg-white/10 focus:bg-white/10 cursor-pointer rounded-xl text-gray-400 focus:text-white">
                  <Link href="/auth" className="flex items-center w-full">ورود / ثبت‌نام</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Cart Slide-out Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="relative hover:text-white transition-colors cursor-pointer outline-none">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -left-2 bg-white text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {itemCount.toLocaleString('fa-IR')}
                </span>
              </button>
            </SheetTrigger>
            
            <SheetContent side="left" className="bg-[#0a0a0a] border-r border-white/10 text-white w-full sm:max-w-md flex flex-col p-6" dir="rtl">
              <SheetHeader className="text-right pb-6 border-b border-white/10">
                <SheetTitle className="text-white text-2xl font-black font-sans">سبد خرید</SheetTitle>
              </SheetHeader>
              
              {/* Dynamic Cart Items Container */}
              <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-6">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                    <p>سبد خرید شما خالی است</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="flex gap-4 items-center">
                      <div className="w-20 h-24 bg-[#111111] rounded-xl overflow-hidden border border-white/5 shrink-0">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>
                        <span className="text-xs text-gray-400">سایز: {item.size} | تعداد: {item.quantity.toLocaleString('fa-IR')}</span>
                        <span className="text-sm font-medium text-gray-300 mt-2">
                          {(item.price * item.quantity).toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id, item.size, item.variant_id)}
                        className="text-gray-500 hover:text-red-500 transition-colors shrink-0 outline-none"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Summary & Coupon Box */}
              {items.length > 0 && (
                <div className="pt-4 border-t border-white/10 space-y-4">
                  {/* Coupon Code Input */}
                  <div>
                    {coupon ? (
                      <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <Tag className="w-3.5 h-3.5" />
                          <span>کد «{coupon.code}» اعمال شد</span>
                        </div>
                        <button
                          onClick={async () => {
                            await removeCoupon();
                            toast.info("کد تخفیف حذف شد");
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!couponInput.trim()) {
                            toast.error("کد تخفیف را وارد کنید");
                            return;
                          }
                          setIsApplyingCoupon(true);
                          try {
                            await applyCoupon(couponInput.trim());
                            toast.success("کد تخفیف با موفقیت اعمال شد");
                            setCouponInput("");
                          } catch (err: any) {
                            toast.error(err?.response?.data?.message || "کد تخفیف نامعتبر یا منقضی شده است");
                          } finally {
                            setIsApplyingCoupon(false);
                          }
                        }}
                        className="flex gap-2"
                      >
                        <Input
                          placeholder="کد تخفیف..."
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          className="bg-[#181818] border-white/10 h-9 text-xs rounded-xl text-white placeholder:text-gray-500"
                        />
                        <Button
                          type="submit"
                          disabled={isApplyingCoupon}
                          variant="outline"
                          className="h-9 px-3 text-xs font-bold border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl shrink-0 cursor-pointer"
                        >
                          {isApplyingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : "اعمال"}
                        </Button>
                      </form>
                    )}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-400">
                      <span>مجموع اقلام:</span>
                      <span>{getTotal().toLocaleString('fa-IR')} تومان</span>
                    </div>

                    {getDiscountAmount() > 0 && (
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>تخفیف کوپن:</span>
                        <span>- {getDiscountAmount().toLocaleString('fa-IR')} تومان</span>
                      </div>
                    )}

                    <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/5">
                      <span>مبلغ قابل پرداخت:</span>
                      <span className="text-amber-400">{getFinalTotal().toLocaleString('fa-IR')} تومان</span>
                    </div>
                  </div>

                  <SheetClose asChild>
                    <Button asChild className="w-full h-12 rounded-xl bg-white text-black hover:bg-gray-200 text-sm font-black transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                      <Link href="/checkout">ثبت سفارش و تسویه</Link>
                    </Button>
                  </SheetClose>
                </div>
              )}

            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}