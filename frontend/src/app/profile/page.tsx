"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Package, MapPin, User, LogOut, ChevronLeft, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useWishlist } from "@/store/wishlist";
import Link from "next/link";

// Mock Data
const MOCK_ORDERS = [
  { id: "FS-847291", date: "۲۸ خرداد ۱۴۰۵", total: "۸,۹۰۰,۰۰۰", status: "در حال پردازش", statusColor: "text-amber-500 bg-amber-500/10", items: "کت چرم اورسایز مشکی، هودی کراپ" },
  { id: "FS-392011", date: "۱۲ اردیبهشت ۱۴۰۵", total: "۱,۴۰۰,۰۰۰", status: "تحویل داده شده", statusColor: "text-emerald-500 bg-emerald-500/10", items: "تی‌شرت بیسیک پریمیوم" },
];

const MOCK_ADDRESSES = [
  { id: 1, title: "خانه", address: "تهران، سعادت آباد، میدان کاج، خیابان سرو شرقی، پلاک ۱۲، واحد ۴", postalCode: "1998612345" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Wishlist Store
  const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlist();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    toast.success("از حساب کاربری خارج شدید");
    router.push("/");
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("اطلاعات حساب با موفقیت بروزرسانی شد");
    }, 1000);
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 space-y-6"
        >
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-24 h-24 bg-[#1a1a1a] rounded-full mx-auto mb-4 border border-white/10 flex items-center justify-center">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">علی رضایی</h2>
            <p className="text-sm text-gray-500 mb-6" dir="ltr">ali.rezaei@example.com</p>
            <Button onClick={handleLogout} variant="ghost" className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 h-12 rounded-xl flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" />
              خروج از حساب
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-9"
        >
          <Tabs defaultValue="orders" className="w-full" dir="rtl">
            <TabsList className="flex flex-wrap gap-2 bg-transparent h-auto mb-8 justify-start border-b border-white/10 pb-4">
              <TabsTrigger value="orders" className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl px-6 py-3 transition-all flex items-center gap-2">
                <Package className="w-4 h-4" />
                سفارش‌های من
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl px-6 py-3 transition-all flex items-center gap-2">
                <Heart className="w-4 h-4" />
                علاقه‌مندی‌ها
              </TabsTrigger>
              <TabsTrigger value="addresses" className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl px-6 py-3 transition-all flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                آدرس‌ها
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl px-6 py-3 transition-all flex items-center gap-2">
                <User className="w-4 h-4" />
                اطلاعات حساب
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4 outline-none">
              <h3 className="text-xl font-bold text-white mb-6">تاریخچه سفارشات</h3>
              {MOCK_ORDERS.map((order) => (
                <div key={order.id} className="bg-[#111111] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-colors">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-4">
                      <span className="text-white font-bold font-sans tracking-widest">{order.id}</span>
                      <span className="text-gray-500 text-sm">{order.date}</span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-1">{order.items}</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${order.statusColor}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-4 border-t border-white/10 md:border-0 pt-4 md:pt-0">
                    <span className="text-lg font-bold text-white">{order.total} تومان</span>
                    <Button variant="outline" className="h-10 rounded-xl border-white/20 text-white hover:bg-white hover:text-black">
                      مشاهده جزئیات
                      <ChevronLeft className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist" className="space-y-4 outline-none">
              <h3 className="text-xl font-bold text-white mb-6">لیست علاقه‌مندی‌ها</h3>
              {wishlistItems.length === 0 ? (
                <div className="text-center py-12 bg-[#111111] border border-white/5 rounded-2xl">
                  <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-400">هیچ محصولی در لیست علاقه‌مندی‌های شما وجود ندارد.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wishlistItems.map((item) => (
                    <div key={item.id} className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors">
                      <div className="w-20 h-24 bg-[#0a0a0a] rounded-xl overflow-hidden shrink-0">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.id}`} className="text-sm font-bold text-white hover:underline line-clamp-1 mb-1">{item.name}</Link>
                        <p className="text-xs text-gray-500 mb-2">{item.category}</p>
                        <p className="text-sm font-medium text-gray-300">{item.price.toLocaleString('fa-IR')} تومان</p>
                      </div>
                      <button 
                        onClick={() => removeWishlistItem(item.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors p-2 shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="space-y-4 outline-none">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">آدرس‌های ثبت شده</h3>
                <Button className="h-10 px-4 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-sm">
                  افزودن آدرس جدید
                </Button>
              </div>
              {MOCK_ADDRESSES.map((addr) => (
                <div key={addr.id} className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {addr.title}
                    </span>
                    <button className="text-sm text-gray-500 hover:text-white transition-colors">ویرایش</button>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{addr.address}</p>
                  <p className="text-sm text-gray-500">کد پستی: <span className="font-sans" dir="ltr">{addr.postalCode}</span></p>
                </div>
              ))}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="outline-none">
              <h3 className="text-xl font-bold text-white mb-6">ویرایش اطلاعات</h3>
              <form onSubmit={handleSaveSettings} className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-6 max-w-xl">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">نام و نام خانوادگی</label>
                  <Input defaultValue="علی رضایی" className="bg-[#0a0a0a] border-white/10 h-12 text-white focus-visible:ring-1 focus-visible:ring-white/30" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">ایمیل</label>
                  <Input defaultValue="ali.rezaei@example.com" className="bg-[#0a0a0a] border-white/10 h-12 text-white focus-visible:ring-1 focus-visible:ring-white/30 font-sans" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">شماره موبایل</label>
                  <Input defaultValue="09123456789" disabled className="bg-[#0a0a0a]/50 border-white/5 h-12 text-gray-500 font-sans cursor-not-allowed" dir="ltr" />
                  <p className="text-xs text-gray-500 mt-1">شماره موبایل قابل تغییر نیست.</p>
                </div>
                <Button disabled={isLoading} type="submit" className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-base font-bold transition-all mt-4">
                  {isLoading ? "در حال ذخیره..." : "ثبت تغییرات"}
                </Button>
              </form>
            </TabsContent>

          </Tabs>
        </motion.div>

      </div>
    </main>
  );
}