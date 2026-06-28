"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/store/cart";
import { toast } from "sonner";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- Validation Schema ---
const checkoutSchema = z.object({
  fullName: z.string().min(3, "نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد"),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد"),
  province: z.string().min(2, "استان الزامی است"),
  city: z.string().min(2, "شهر الزامی است"),
  address: z.string().min(10, "آدرس باید کامل و دقیق باشد (حداقل ۱۰ کاراکتر)"),
  postalCode: z.string().regex(/^\d{10}$/, "کد پستی باید دقیقاً ۱۰ رقم باشد"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form Hook
  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shippingCost = cartTotal > 5000000 ? 0 : 45000;
  const finalTotal = cartTotal + shippingCost;

  const onCheckout = (data: CheckoutForm) => {
    setIsLoading(true);

    // Mock API Call
    setTimeout(() => {
      setIsLoading(false);
      toast.success("سفارش شما با موفقیت ثبت شد", {
        description: "کد پیگیری به زودی پیامک می‌شود.",
      });
      router.push("/");
    }, 2000);
  };

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <main className="min-h-screen pt-32 pb-24 px-6 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black text-white mb-4">سبد خرید شما خالی است</h1>
        <Button asChild className="h-12 px-6 rounded-xl bg-white text-black hover:bg-gray-200">
          <Link href="/">بازگشت به فروشگاه</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8">
        <ArrowRight className="w-4 h-4" />
        بازگشت به سبد خرید
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Shipping Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 space-y-8"
        >
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
              <MapPin className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-black text-white">اطلاعات ارسال</h2>
            </div>

            <form id="checkout-form" onSubmit={handleSubmit(onCheckout)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">نام و نام خانوادگی</label>
                  <Input {...register("fullName")} placeholder="مثال: علی رضایی" className="bg-[#0a0a0a] border-white/10 h-12 text-white focus-visible:ring-1 focus-visible:ring-white/30" />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">شماره موبایل</label>
                  <Input {...register("phone")} placeholder="09123456789" className="bg-[#0a0a0a] border-white/10 h-12 text-white focus-visible:ring-1 focus-visible:ring-white/30 font-sans" dir="ltr" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">استان</label>
                  <Input {...register("province")} placeholder="مثال: تهران" className="bg-[#0a0a0a] border-white/10 h-12 text-white focus-visible:ring-1 focus-visible:ring-white/30" />
                  {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">شهر</label>
                  <Input {...register("city")} placeholder="مثال: تهران" className="bg-[#0a0a0a] border-white/10 h-12 text-white focus-visible:ring-1 focus-visible:ring-white/30" />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">آدرس دقیق پستی</label>
                <Input {...register("address")} placeholder="خیابان، کوچه، پلاک، واحد..." className="bg-[#0a0a0a] border-white/10 h-12 text-white focus-visible:ring-1 focus-visible:ring-white/30" />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">کد پستی (۱۰ رقمی)</label>
                <Input {...register("postalCode")} placeholder="1234567890" className="bg-[#0a0a0a] border-white/10 h-12 text-white focus-visible:ring-1 focus-visible:ring-white/30 font-sans" dir="ltr" />
                {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>}
              </div>
            </form>
          </div>

          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <CreditCard className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-black text-white">روش پرداخت</h2>
            </div>
            
            <div className="border border-white/30 bg-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full border-4 border-white bg-black"></div>
                <span className="font-bold text-white">پرداخت اینترنتی (درگاه زرین‌پال)</span>
              </div>
              <ShieldCheck className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </motion.div>

        {/* Right Column: Order Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-4"
        >
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 sticky top-24">
            <h2 className="text-xl font-black text-white mb-6">خلاصه سفارش</h2>
            
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex gap-4 items-center">
                  <div className="w-16 h-20 bg-[#0a0a0a] rounded-xl overflow-hidden shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>
                    <span className="text-xs text-gray-500">سایز: {item.size} | تعداد: {item.quantity.toLocaleString('fa-IR')}</span>
                    <p className="text-sm font-medium text-gray-300 mt-1">{(item.price * item.quantity).toLocaleString('fa-IR')} تومان</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4 space-y-4 mb-8">
              <div className="flex justify-between text-gray-400 text-sm">
                <span>مبلغ کل کالاها:</span>
                <span>{cartTotal.toLocaleString('fa-IR')} تومان</span>
              </div>
              <div className="flex justify-between text-gray-400 text-sm">
                <span>هزینه ارسال:</span>
                <span>{shippingCost === 0 ? "رایگان" : `${shippingCost.toLocaleString('fa-IR')} تومان`}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-white pt-4 border-t border-white/10">
                <span>مبلغ قابل پرداخت:</span>
                <span>{finalTotal.toLocaleString('fa-IR')} تومان</span>
              </div>
            </div>

            <Button 
              type="submit" 
              form="checkout-form"
              disabled={isLoading}
              className="w-full h-16 rounded-2xl bg-white text-black hover:bg-gray-200 text-lg font-bold transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              {isLoading ? "در حال انتقال به درگاه..." : "پرداخت و ثبت سفارش"}
            </Button>
          </div>
        </motion.div>

      </div>
    </main>
  );
}