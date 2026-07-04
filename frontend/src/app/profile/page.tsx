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
  const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlist();

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
    <main className="min-h-screen pt-24 md:pt-32 pb-32 md:pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 space-y-6"
        >
          <div className="bg-[#111111] border border-white/5 rounded-2xl md:rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-[#1a1a1a] rounded-full mx-auto mb-4 border border-white/10 flex items-center justify-center">
              <User className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-1">علی رضایی</h2>
            <p className="text-xs md:text-sm text-gray-500 mb-6" dir="ltr">ali.rezaei@example.com</p>
            <Button onClick={handleLogout} variant="ghost" className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 h-12 rounded-xl flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" />
              خروج از حساب
            </Button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-9"
        >
          <Tabs defaultValue="orders" className="w-full" dir="rtl">
            <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              <TabsList className="flex w-max md:w-auto gap-2 bg-transparent h-auto mb-6 md:mb-8 justify-start border-b border-white/10 pb-4">
                <TabsTrigger value="orders" className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl px-4 md:px-6 py-2.5 md:py-3 transition-all flex items-center gap-2 text-sm md:text-base shrink-0">
                  <Package className="w-4 h-4" />
                  سفارش‌های من
                </TabsTrigger>
                <TabsTrigger value="wishlist" className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl px-4 md:px-6 py-2.5 md:py-3 transition-all flex items-center gap-2 text-sm md:text-base shrink-0">
                  <Heart className="w-4 h-4" />
                  علاقه‌مندی‌ها
                </TabsTrigger>
                <TabsTrigger value="addresses" className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl px-4 md:px-6 py-2.5 md:py-3 transition-all flex items-center gap-2 text-sm md:text-base shrink-0">
                  <MapPin className="w-4 h-4" />
                  آدرس‌ها
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl px-4 md:px-6 py-2.5 md:py-3 transition-all flex items-center gap-2 text-sm md:text-base shrink-0">
                  <User className="w-4 h-4" />
                  اطلاعات حساب
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="orders" className="space-y-4 outline-none mt-0">
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">تاریخچه سفارشات</h3>
              {MOCK_ORDERS.map((order) => (
                <div key={order.id} className="bg-[#111111] border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 hover:border-white/10 transition-colors">
                  <div className="space-y-2 md:space-y-3 flex-1">
                    <div className="flex items-center gap-4">
                      <span className="text-white font-bold font-sans tracking-widest text-sm md:text-base">{order.id}</span>
                      <span className="text-gray-500 text-xs md:text-sm">{order.date}</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-400 line-clamp-1">{order.items}</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] md:text-xs font-bold ${order.statusColor}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-4 border-t border-white/10 md:border-0 pt-4 md:pt-0">
                    <span className="text-base md:text-lg font-bold text-white">{order.total} تومان</span>
                    <Button variant="outline" className="h-10 rounded-xl border-white/20 text-white hover:bg-white hover:text-black text-xs md:text-sm px-3 md:px-4">
                      مشاهده جزئیات
                      <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="wishlist" className="space-y-4 outline-none mt-0">
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">لیست علاقه‌مندی‌ها</h3>
              {wishlistItems.length === 0 ? (
                <div className="text-center py-12 bg-[#111111] border border-white/5 rounded-2xl">
                  <Heart className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-400 text-sm md:text-base">هیچ محصولی در لیست علاقه‌مندی‌های شما وجود ندارد.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wishlistItems.map((item) => (
                    <div key={item.id} className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors">
                      <div className="w-16 h-20 md:w-20 md:h-24 bg-[#0a0a0a] rounded-xl overflow-hidden shrink-0">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.id}`} className="text-xs md:text-sm font-bold text-white hover:underline line-clamp-1 mb-1">{item.name}</Link>
                        <p className="text-[10px] md:text-xs text-gray-500 mb-1 md:mb-2">{item.category}</p>
                        <p className="text-xs md:text-sm font-medium text-gray-300">{item.price.toLocaleString('fa-IR')} تومان</p>
                      </div>
                      <button 
                        onClick={() => removeWishlistItem(item.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors p-2 shrink-0 outline-none"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="addresses" className="space-y-4 outline-none mt-0">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-white">آدرس‌های ثبت شده</h3>
                <Button className="h-9 md:h-10 px-3 md:px-4 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs md:text-sm">
                  افزودن آدرس
                </Button>
              </div>
              {MOCK_ADDRESSES.map((addr) => (
                <div key={addr.id} className="bg-[#111111] border border-white/5 rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold flex items-center gap-2 text-sm md:text-base">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {addr.title}
                    </span>
                    <button className="text-xs md:text-sm text-gray-500 hover:text-white transition-colors outline-none">ویرایش</button>
                  </div>
                  <p className="text-xs md:text-sm text-gray-400 leading-relaxed">{addr.address}</p>
                  <p className="text-xs md:text-sm text-gray-500">کد پستی: <span className="font-sans" dir="ltr">{addr.postalCode}</span></p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="settings" className="outline-none mt-0">
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">ویرایش اطلاعات</h3>
              <form onSubmit={handleSaveSettings} className="bg-[#111111] border border-white/5 rounded-2xl p-4 md:p-6 space-y-4 md:space-y-6 max-w-xl">
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-medium text-gray-300">نام و نام خانوادگی</label>
                  <Input defaultValue="علی رضایی" className="bg-[#0a0a0a] border-white/10 h-11 md:h-12 text-white text-sm focus-visible:ring-1 focus-visible:ring-white/30" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-medium text-gray-300">ایمیل</label>
                  <Input defaultValue="ali.rezaei@example.com" className="bg-[#0a0a0a] border-white/10 h-11 md:h-12 text-white text-sm focus-visible:ring-1 focus-visible:ring-white/30 font-sans" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-medium text-gray-300">شماره موبایل</label>
                  <Input defaultValue="09123456789" disabled className="bg-[#0a0a0a]/50 border-white/5 h-11 md:h-12 text-gray-500 text-sm font-sans cursor-not-allowed" dir="ltr" />
                  <p className="text-[10px] md:text-xs text-gray-500 mt-1">شماره موبایل قابل تغییر نیست.</p>
                </div>
                <Button disabled={isLoading} type="submit" className="w-full h-12 md:h-14 rounded-xl bg-white text-black hover:bg-gray-200 text-sm md:text-base font-bold transition-all mt-2 md:mt-4">
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