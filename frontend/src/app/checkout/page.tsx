"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  CreditCard,
  ShieldCheck,
  Tag,
  Check,
  X,
  Sparkles,
  Truck,
  Building,
  Phone,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/store/cart";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/error-utils";
import { toast } from "sonner";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
  const {
    items,
    coupon,
    applyCoupon,
    removeCoupon,
    clearCart,
    fetchCart,
    getTotal,
    getDiscountAmount,
    getFinalTotal,
  } = useCart();

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<"dummy" | "zarinpal">("dummy");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  });

  useEffect(() => {
    setMounted(true);

    // Auto-fill from saved profile addresses if available
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.info("برای تکمیل سفارش، لطفاً ابتدا وارد حساب خود شوید یا اطلاعات ارسال را وارد کنید.");
      }
      try {
        const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
        const userId = payload?.user_id || payload?.id;
        if (userId) {
          const saved = localStorage.getItem(`user_addresses_${userId}`);
          if (saved) {
            const list = JSON.parse(saved);
            if (Array.isArray(list) && list.length > 0) {
              const def = list[0];
              if (def.fullName) setValue("fullName", def.fullName);
              if (def.phone) setValue("phone", def.phone);
              if (def.province) setValue("province", def.province);
              if (def.city) setValue("city", def.city);
              if (def.address) setValue("address", def.address);
              if (def.postalCode) setValue("postalCode", def.postalCode);
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }, [setValue]);

  const cartTotal = getTotal();
  const discountAmount = getDiscountAmount();
  const shippingCost = cartTotal > 5000000 ? 0 : 45000;
  const finalPayable = Math.max(0, cartTotal - discountAmount) + shippingCost;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) {
      toast.error("کد تخفیف را وارد کنید");
      return;
    }
    setIsApplyingCoupon(true);
    try {
      await applyCoupon(couponCodeInput.trim());
      toast.success("کد تخفیف با موفقیت اعمال شد");
      setCouponCodeInput("");
    } catch (e: any) {
      toast.error(getApiErrorMessage(e, "کد تخفیف نامعتبر یا منقضی شده است"));
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const onCheckout = async (data: CheckoutForm) => {
    setIsLoading(true);
    try {
      // 1. Create order from active cart
      const orderRes = await api.post("/api/orders/checkout/", {
        shipping_address: {
          full_name: data.fullName,
          phone: data.phone,
          province: data.province,
          city: data.city,
          address: data.address,
          postal_code: data.postalCode,
        },
        billing_address: {
          full_name: data.fullName,
          phone: data.phone,
          province: data.province,
          city: data.city,
          address: data.address,
          postal_code: data.postalCode,
        },
      });

      const orderData = orderRes.data;
      const orderId = orderData.id || orderData.order_number;

      // 2. Initiate payment session
      const paymentRes = await api.post("/api/payments/initiate/", {
        order_id: orderData.id || orderId,
        gateway: paymentGateway,
      });

      const payData = paymentRes.data;

      // If gateway returns external redirect URL (e.g. Zarinpal / Mellat / Shaparak)
      if (payData?.payment_url || payData?.redirect_url) {
        toast.loading("در حال انتقال به درگاه پرداخت بانکی...");
        window.location.href = payData.payment_url || payData.redirect_url;
        return;
      }

      // If simulated / synchronous payment completed successfully
      if (payData?.status === "succeeded" || payData?.status === "paid") {
        await clearCart();
        const refNumber =
          payData.gateway_reference ||
          payData.authority ||
          `REF-${Math.floor(100000 + Math.random() * 900000)}`;
        toast.success("سفارش شما با موفقیت ثبت و پرداخت شد");
        router.push(
          `/checkout/success?order_id=${encodeURIComponent(
            orderData.order_number || orderId
          )}&ref=${encodeURIComponent(refNumber)}&amount=${finalPayable}`
        );
        return;
      }

      // If payment status returned failed or unconfirmed
      router.push(
        `/checkout/failed?order_id=${encodeURIComponent(
          orderData.order_number || orderId
        )}&error=${encodeURIComponent(payData?.error || "پرداخت ناموفق بود")}`
      );
    } catch (error: any) {
      console.error("Checkout failed:", error);
      const errCode = error?.response?.data?.code || error?.response?.data?.error?.code;

      // If error is related to expired reservations or price/inventory changes, refresh cart
      if (
        errCode === "reservation_expired" ||
        errCode === "price_changed" ||
        errCode === "insufficient_stock"
      ) {
        await fetchCart();
      }

      toast.error(
        getApiErrorMessage(error, "ثبت سفارش ناموفق بود. لطفاً اطلاعات را بررسی کنید.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <main
        className="min-h-screen pt-32 pb-24 px-6 flex flex-col items-center justify-center text-white text-center"
        dir="rtl"
      >
        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6">
          <Truck className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2">سبد خرید شما خالی است</h1>
        <p className="text-xs md:text-sm text-gray-400 max-w-sm mb-8">
          برای تکمیل فرآیند تسویه حساب، ابتدا باید محصولاتی را به سبد خرید خود اضافه کنید.
        </p>
        <Button asChild className="h-12 px-8 rounded-2xl bg-white text-black font-bold hover:bg-gray-200">
          <Link href="/products">مشاهده کاتالوگ فروشگاه</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-white" dir="rtl">
      {/* Back Link */}
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-400 hover:text-white transition-colors mb-8"
      >
        <ArrowRight className="w-4 h-4" />
        ادامه خرید و بازگشت به کاتالوگ
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Shipping Form & Gateway Selection */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 space-y-8"
        >
          {/* Shipping Details Card */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <MapPin className="w-6 h-6 text-amber-400" />
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white">آدرس و اطلاعات تحویل‌گیرنده</h2>
                <p className="text-xs text-gray-400 mt-0.5">مشخصات ارسال مرسوله پستی را با دقت وارد نمایید</p>
              </div>
            </div>

            <form id="checkout-form" onSubmit={handleSubmit(onCheckout)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    نام و نام خانوادگی تحویل‌گیرنده
                  </label>
                  <Input
                    {...register("fullName")}
                    placeholder="مثال: علی رضایی"
                    className="bg-[#181818] border-white/10 h-12 text-sm text-white rounded-xl focus-visible:ring-1 focus-visible:ring-amber-400/50"
                  />
                  {errors.fullName && <p className="text-rose-400 text-xs mt-1">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    شماره موبایل
                  </label>
                  <Input
                    {...register("phone")}
                    placeholder="09123456789"
                    className="bg-[#181818] border-white/10 h-12 text-sm text-white rounded-xl focus-visible:ring-1 focus-visible:ring-amber-400/50 font-sans text-left"
                    dir="ltr"
                  />
                  {errors.phone && <p className="text-rose-400 text-xs mt-1">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    استان
                  </label>
                  <Input
                    {...register("province")}
                    placeholder="مثال: تهران"
                    className="bg-[#181818] border-white/10 h-12 text-sm text-white rounded-xl focus-visible:ring-1 focus-visible:ring-amber-400/50"
                  />
                  {errors.province && <p className="text-rose-400 text-xs mt-1">{errors.province.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    شهر
                  </label>
                  <Input
                    {...register("city")}
                    placeholder="مثال: تهران"
                    className="bg-[#181818] border-white/10 h-12 text-sm text-white rounded-xl focus-visible:ring-1 focus-visible:ring-amber-400/50"
                  />
                  {errors.city && <p className="text-rose-400 text-xs mt-1">{errors.city.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">نشانی پستی دقیق</label>
                <Input
                  {...register("address")}
                  placeholder="خیابان، کوچه، پلاک، طبقه، واحد..."
                  className="bg-[#181818] border-white/10 h-12 text-sm text-white rounded-xl focus-visible:ring-1 focus-visible:ring-amber-400/50"
                />
                {errors.address && <p className="text-rose-400 text-xs mt-1">{errors.address.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">کد پستی (۱۰ رقمی)</label>
                <Input
                  {...register("postalCode")}
                  placeholder="1234567890"
                  className="bg-[#181818] border-white/10 h-12 text-sm text-white rounded-xl focus-visible:ring-1 focus-visible:ring-amber-400/50 font-sans text-left"
                  dir="ltr"
                />
                {errors.postalCode && <p className="text-rose-400 text-xs mt-1">{errors.postalCode.message}</p>}
              </div>
            </form>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <CreditCard className="w-6 h-6 text-amber-400" />
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white">انتخاب درگاه پرداخت</h2>
                <p className="text-xs text-gray-400 mt-0.5">کلیه تراکنش‌ها از طریق بستر رمزنگاری شده SSL انجام می‌پذیرد</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentGateway("dummy")}
                className={`p-5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                  paymentGateway === "dummy"
                    ? "bg-amber-400/10 border-amber-400 shadow-md ring-1 ring-amber-400/30"
                    : "bg-[#181818] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="space-y-1">
                  <span className="text-sm font-bold text-white block">درگاه شبیه‌ساز تستی (آنلاین)</span>
                  <span className="text-xs text-gray-400">تراکنش فوری و امن جهت تست تسویه</span>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-white/40 flex items-center justify-center shrink-0">
                  {paymentGateway === "dummy" && <div className="w-2.5 h-2.5 bg-amber-400 rounded-full" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentGateway("zarinpal")}
                className={`p-5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                  paymentGateway === "zarinpal"
                    ? "bg-amber-400/10 border-amber-400 shadow-md ring-1 ring-amber-400/30"
                    : "bg-[#181818] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="space-y-1">
                  <span className="text-sm font-bold text-white block">درگاه پرداخت زرین‌پال / بانکی</span>
                  <span className="text-xs text-gray-400">پشتیبانی از تمامی کارت‌های عضو شتاب</span>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-white/40 flex items-center justify-center shrink-0">
                  {paymentGateway === "zarinpal" && <div className="w-2.5 h-2.5 bg-amber-400 rounded-full" />}
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Order Summary & Coupon */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-4"
        >
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 sticky top-28 shadow-2xl space-y-6">
            <h2 className="text-lg md:text-xl font-black text-white border-b border-white/10 pb-4">
              خلاصه سفارش ({items.length} کالا)
            </h2>

            {/* Items Mini List */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.size}`}
                  className="flex gap-3 items-center bg-white/5 p-2.5 rounded-2xl border border-white/5"
                >
                  <img
                    src={item.imageUrl || "/globe.svg"}
                    alt={item.name}
                    className="w-14 h-16 object-cover rounded-xl shrink-0 border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      سایز: {item.size || "Free"} | تعداد: {item.quantity.toLocaleString("fa-IR")}
                    </span>
                    <p className="text-xs font-bold text-gray-200 mt-1">
                      {(item.price * item.quantity).toLocaleString("fa-IR")} تومان
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            <div className="pt-2">
              {coupon ? (
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Tag className="w-4 h-4" />
                    <span>کد «{coupon.code}» اعمال شد</span>
                  </div>
                  <button
                    onClick={() => removeCoupon()}
                    className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <Input
                    placeholder="کد تخفیف دارید؟"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    className="bg-[#181818] border-white/10 h-10 text-xs rounded-xl text-white placeholder:text-gray-500"
                  />
                  <Button
                    type="submit"
                    disabled={isApplyingCoupon}
                    variant="outline"
                    className="h-10 px-4 text-xs font-bold border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl shrink-0"
                  >
                    {isApplyingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "اعمال"}
                  </Button>
                </form>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="border-t border-white/10 pt-4 space-y-3 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>مجموع سبد خرید:</span>
                <span>{cartTotal.toLocaleString("fa-IR")} تومان</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>تخفیف کوپن:</span>
                  <span>- {discountAmount.toLocaleString("fa-IR")} تومان</span>
                </div>
              )}

              <div className="flex justify-between text-gray-400">
                <span>هزینه بسته‌بندی و ارسال:</span>
                <span>
                  {shippingCost === 0
                    ? "رایگان (خرید بالای ۵ میلیون)"
                    : `${shippingCost.toLocaleString("fa-IR")} تومان`}
                </span>
              </div>

              <div className="flex justify-between text-base font-black text-white pt-3 border-t border-white/10">
                <span>مبلغ نهایی پرداخت:</span>
                <span className="text-amber-400">{finalPayable.toLocaleString("fa-IR")} تومان</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              form="checkout-form"
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-sm md:text-base font-black transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال ثبت سفارش و اتصال به درگاه...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  پرداخت و ثبت نهایی سفارش
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}