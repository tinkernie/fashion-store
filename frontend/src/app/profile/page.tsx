"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Package, MapPin, User, LogOut, ChevronLeft, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useWishlist } from "@/store/wishlist";
import Link from "next/link";
import { api } from "@/lib/api";

const MOCK_ADDRESSES = [
  { id: 1, title: "خانه", address: "تهران، سعادت آباد، میدان کاج، خیابان سرو شرقی، پلاک ۱۲، واحد ۴", postalCode: "1998612345" },
];

// Helper to extract user ID from the access token securely 
const getUserIdFromToken = () => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id || payload.id;
  } catch (e) {
    return null;
  }
};

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlist();

  useEffect(() => {
    setMounted(true);
    
    const userId = getUserIdFromToken();
    if (!userId) {
      toast.error("لطفا وارد حساب کاربری شوید");
      router.push("/auth");
      return;
    }

    const fetchData = async () => {
      try {
        const [ordersRes, profileRes] = await Promise.all([
          api.get('/api/orders/'),
          api.get(`/api/users/me/${userId}/`)
        ]);
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data.results || []);
        setUserProfile(profileRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout/');
    } catch (e) {
      console.error("Logout failed at backend", e);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    toast.success("از حساب کاربری خارج شدید");
    router.push("/");
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const userId = getUserIdFromToken();
    if (!userId) return;

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const [firstName, ...lastNames] = fullName.split(' ');

    try {
      await api.patch(`/api/users/me/${userId}/`, {
        first_name: firstName || "",
        last_name: lastNames.join(" ") || ""
      });
      toast.success("اطلاعات حساب با موفقیت بروزرسانی شد");
    } catch (error) {
      toast.error("بروزرسانی اطلاعات ناموفق بود");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderDetails = async (id: string) => {
    try {
      const res = await api.get(`/api/orders/${id}/`);
      setSelectedOrder(res.data);
      setIsOrderModalOpen(true);
    } catch (error) {
      toast.error("دریافت جزئیات سفارش ناموفق بود");
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await api.post('/api/auth/change-password/', {
        old_password: formData.get('oldPassword'),
        new_password: formData.get('newPassword')
      });
      toast.success("رمز عبور با موفقیت تغییر یافت");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast.error("تغییر رمز عبور ناموفق بود. اطلاعات را بررسی کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await api.post('/api/users/me/change_email/', {
        new_email: formData.get('newEmail'),
        password: formData.get('currentPassword')
      });
      toast.success("ایمیل با موفقیت تغییر یافت. لطفا صندوق ورودی خود را بررسی کنید.");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast.error("تغییر ایمیل ناموفق بود.");
    } finally {
      setIsLoading(false);
    }
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
            <h2 className="text-lg md:text-xl font-bold text-white mb-1">
              {userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : "کاربر"}
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mb-6" dir="ltr">
              {userProfile?.email || ""}
            </p>
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
              {orders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">سفارشی ثبت نشده است</div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-[#111111] border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 hover:border-white/10 transition-colors">
                    <div className="space-y-2 md:space-y-3 flex-1">
                      <div className="flex items-center gap-4">
                        <span className="text-white font-bold font-sans tracking-widest text-sm md:text-base">{order.id}</span>
                        <span className="text-gray-500 text-xs md:text-sm">{order.created_at || order.date}</span>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] md:text-xs font-bold text-amber-500 bg-amber-500/10`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-4 border-t border-white/10 md:border-0 pt-4 md:pt-0">
                      <span className="text-base md:text-lg font-bold text-white">{order.total_amount || order.total} تومان</span>
                      <Button onClick={() => fetchOrderDetails(order.id)} variant="outline" className="h-10 rounded-xl border-white/20 text-white hover:bg-white hover:text-black text-xs md:text-sm px-3 md:px-4">
                        مشاهده جزئیات
                        <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
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
                        <p className="text-xs md:text-sm font-medium text-gray-300">{item.price?.toLocaleString('fa-IR')} تومان</p>
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

            <TabsContent value="settings" className="outline-none mt-0 space-y-8">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">ویرایش اطلاعات پایه</h3>
                <form onSubmit={handleSaveSettings} className="bg-[#111111] border border-white/5 rounded-2xl p-4 md:p-6 space-y-4 md:space-y-6 max-w-xl">
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium text-gray-300">نام و نام خانوادگی</label>
                    <Input name="fullName" defaultValue={userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : ""} className="bg-[#0a0a0a] border-white/10 h-11 md:h-12 text-white text-sm focus-visible:ring-1 focus-visible:ring-white/30" />
                  </div>
                  <Button disabled={isLoading} type="submit" className="w-full h-12 md:h-14 rounded-xl bg-white text-black hover:bg-gray-200 text-sm md:text-base font-bold transition-all mt-2 md:mt-4">
                    {isLoading ? "در حال ذخیره..." : "ثبت نام جدید"}
                  </Button>
                </form>
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">تغییر ایمیل</h3>
                <form onSubmit={handleChangeEmail} className="bg-[#111111] border border-white/5 rounded-2xl p-4 md:p-6 space-y-4 md:space-y-6 max-w-xl">
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium text-gray-300">ایمیل فعلی: {userProfile?.email || ""}</label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium text-gray-300">ایمیل جدید</label>
                    <Input name="newEmail" type="email" required className="bg-[#0a0a0a] border-white/10 h-11 md:h-12 text-white text-sm focus-visible:ring-1 focus-visible:ring-white/30" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium text-gray-300">رمز عبور (برای تایید)</label>
                    <Input name="currentPassword" type="password" required className="bg-[#0a0a0a] border-white/10 h-11 md:h-12 text-white text-sm focus-visible:ring-1 focus-visible:ring-white/30" dir="ltr" />
                  </div>
                  <Button disabled={isLoading} type="submit" className="w-full h-12 md:h-14 rounded-xl bg-white text-black hover:bg-gray-200 text-sm md:text-base font-bold transition-all mt-2 md:mt-4">
                    {isLoading ? "در حال ذخیره..." : "ثبت ایمیل جدید"}
                  </Button>
                </form>
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">تغییر رمز عبور</h3>
                <form onSubmit={handleChangePassword} className="bg-[#111111] border border-white/5 rounded-2xl p-4 md:p-6 space-y-4 md:space-y-6 max-w-xl">
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium text-gray-300">رمز عبور فعلی</label>
                    <Input name="oldPassword" type="password" required className="bg-[#0a0a0a] border-white/10 h-11 md:h-12 text-white text-sm focus-visible:ring-1 focus-visible:ring-white/30" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium text-gray-300">رمز عبور جدید</label>
                    <Input name="newPassword" type="password" required className="bg-[#0a0a0a] border-white/10 h-11 md:h-12 text-white text-sm focus-visible:ring-1 focus-visible:ring-white/30" dir="ltr" />
                  </div>
                  <Button disabled={isLoading} type="submit" className="w-full h-12 md:h-14 rounded-xl bg-white text-black hover:bg-gray-200 text-sm md:text-base font-bold transition-all mt-2 md:mt-4">
                    {isLoading ? "در حال ذخیره..." : "تغییر رمز عبور"}
                  </Button>
                </form>
              </div>
            </TabsContent>

          </Tabs>
        </motion.div>

        {/* Order Details Modal */}
        <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
          <DialogContent className="bg-[#0a0a0a] border border-white/10 text-white sm:max-w-md p-6" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">جزئیات سفارش</DialogTitle>
            </DialogHeader>
            {selectedOrder ? (
              <div className="space-y-4 mt-4">
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-gray-400 text-sm">شماره سفارش</span>
                  <span className="font-bold">{selectedOrder.id}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-gray-400 text-sm">تاریخ ثبت</span>
                  <span className="font-bold">{selectedOrder.created_at || selectedOrder.date}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-gray-400 text-sm">وضعیت</span>
                  <span className="font-bold text-amber-500">{selectedOrder.status}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-gray-400 text-sm">مبلغ کل</span>
                  <span className="font-bold text-lg">{selectedOrder.total_amount || selectedOrder.total} تومان</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">در حال بارگذاری...</div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </main>
  );
}