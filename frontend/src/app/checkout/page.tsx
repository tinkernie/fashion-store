"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/store/cart";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch when rendering Zustand state on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  const cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shippingCost = 50000; // Mock fixed shipping cost
  const finalTotal = cartTotal + shippingCost;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error("سبد خرید شما خالی است");
      return;
    }
    
    // Fire success notification
    toast.success("سفارش شما با موفقیت ثبت شد!", {
      description: "شماره پیگیری: FS-" + Math.floor(Math.random() * 1000000),
    });
    
    // Clear the cart and redirect to home
    clearCart();
    router.push("/");
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-3xl md:text-4xl font-black text-white">تکمیل سفارش</h1>
        <p className="text-gray-400 mt-2">لطفاً اطلاعات پستی خود را با دقت وارد کنید.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Shipping Form (Right Side) */}
        <div className="lg:col-span-7 space-y-8">
          <form onSubmit={handleCheckout} className="space-y-6 bg-[#111111] p-6 md:p-8 rounded-3xl border border-white/5">
            <h2 className="text-xl font-bold text-white mb-6">اطلاعات ارسال</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">نام و نام خانوادگی</label>
                <Input required placeholder="مثال: علی رضایی" className="bg-[#0a0a0a] border-white/10 h-12 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">شماره موبایل</label>
                <Input required type="tel" placeholder="09123456789" className="bg-[#0a0a0a] border-white/10 h-12 text-white" dir="ltr" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">آدرس دقیق پستی</label>
              <Input required placeholder="استان، شهر، خیابان، پلاک، واحد..." className="bg-[#0a0a0a] border-white/10 h-12 text-white" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">کد پستی (۱۰ رقمی)</label>
                <Input required type="text" placeholder="1234567890" className="bg-[#0a0a0a] border-white/10 h-12 text-white" dir="ltr" />
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-base font-bold transition-all mt-4">
              پرداخت و ثبت نهایی
            </Button>
          </form>
        </div>

        {/* Order Summary (Left Side) */}
        <div className="lg:col-span-5">
          <div className="bg-[#111111] p-6 md:p-8 rounded-3xl border border-white/5 sticky top-32">
            <h2 className="text-xl font-bold text-white mb-6">خلاصه سفارش</h2>
            
            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
              {items.length === 0 ? (
                <p className="text-gray-500 text-sm">سبد خرید شما خالی است.</p>
              ) : (
                items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-4 items-center">
                    <div className="w-16 h-20 bg-[#0a0a0a] rounded-lg overflow-hidden border border-white/5 shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-90" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>
                      <span className="text-xs text-gray-400">سایز: {item.size} | تعداد: {item.quantity.toLocaleString('fa-IR')}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      {(item.price * item.quantity).toLocaleString('fa-IR')}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex justify-between text-sm text-gray-400">
                <span>مبلغ کل کالاها</span>
                <span>{cartTotal.toLocaleString('fa-IR')} تومان</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>هزینه ارسال</span>
                <span>{items.length > 0 ? shippingCost.toLocaleString('fa-IR') : "۰"} تومان</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-white pt-4 border-t border-white/5">
                <span>مبلغ قابل پرداخت</span>
                <span>{items.length > 0 ? finalTotal.toLocaleString('fa-IR') : "۰"} تومان</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}