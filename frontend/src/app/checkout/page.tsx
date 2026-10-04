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
import { formatPrice, formatPriceNumber, parsePrice } from "@/lib/price-utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { isTokenExpired, parseJwtPayload } from "@/lib/auth";

const checkoutSchema = z.object({
  fullName: z.string().min(3, "نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد"),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد"),
  province: z.string().min(2, "استان الزامی است"),
  city: z.string().min(2, "شهر الزامی است"),
  address: z.string().min(10, "آدرس باید کامل و دقیق باشد (حداقل ۱۰ کاراکتر)"),
  postalCode: z.string().regex(/^\d{10}$/, "کد پستی باید دقیقاً ۱۰ رقم باشد"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

// Postal shipping constants (base_amount + (total_weight * 1.6))
const BASE_SHIPPING_AMOUNT = 35000; // مبلغ پایه ارسال پستی (تومان)
const WEIGHT_MULTIPLIER = 1.6; // ضریب هزینه به ازای هر گرم وزن

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
    getTotalWeight,
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
      const isExpired = isTokenExpired(token, 0);
      if (!token || isExpired) {
        toast.info("برای تکمیل سفارش، لطفاً ابتدا وارد حساب خود شوید یا اطلاعات ارسال را وارد کنید.");
      }
      try {
        const payload = token && !isExpired ? parseJwtPayload(token) : null;
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
  const totalWeight = getTotalWeight();
  const discountAmount = getDiscountAmount();
  // هزینه ارسال = پایه + (مجموع وزن کل اقلام به گرم * ۱.۶)
  const shippingCost = items.length === 0 ? 0 : Math.round(BASE_SHIPPING_AMOUNT + totalWeight * WEIGHT_MULTIPLIER);
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
      const guestKey = typeof window !== "undefined" ? localStorage.getItem("guest_cart_session_key") : null;

      // 1. Create order from active cart
      const orderRes = await api.post(
        "/api/orders/checkout/",
        {
          shipping_address: {
            full_name: data.fullName,
            phone: data.phone,
            province: data.province,
            city: data.city,
            address: data.address,
            postal_code: data.postalCode,
            shipping_cost: shippingCost,
            total_weight: totalWeight,
          },
          billing_address: {
            full_name: data.fullName,
            phone: data.phone,
            province: data.province,
            city: data.city,
            address: data.address,
            postal_code: data.postalCode,
          },
          session_key: guestKey,
        },
        {
          headers: guestKey ? { "X-Cart-Session-Key": guestKey } : {},
        }
      );

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
        <div className="w-20 h-20 bg-sky-50 border border-sky-100 rounded-full flex items-center justify-center mb-6 text-[#0082CA]">
          <Truck className="w-8 h-8 text-[#0082CA]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-[#0B192C] mb-2">سبد خرید شما خالی است</h1>
        <p className="text-xs md:text-sm text-slate-500 max-w-sm mb-8">
          برای تکمیل فرآیند تسویه حساب، ابتدا باید محصولاتی را به سبد خرید خود اضافه کنید.
        </p>
        <Button asChild className="h-12 px-8 rounded-2xl bg-[#0082CA] text-white font-bold hover:bg-[#006CA8] shadow-md shadow-[#0082CA]/25">
          <Link href="/products">مشاهده کاتالوگ فروشگاه</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-slate-800" dir="rtl">
      {/* Back Link */}
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-xs md:text-sm text-slate-500 hover:text-[#0082CA] transition-colors mb-8"
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
          <div className="bg-white border border-sky-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-sky-100 pb-4">
              <MapPin className="w-6 h-6 text-[#0082CA]" />
              <div>
                <h2 className="text-xl md:text-2xl font-black text-[#0B192C]">آدرس و اطلاعات تحویل‌گیرنده</h2>
                <p className="text-xs text-slate-500 mt-0.5">مشخصات ارسال مرسوله پستی را با دقت وارد نمایید</p>
              </div>
            </div>

            <form id="checkout-form" onSubmit={handleSubmit(onCheckout)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    نام و نام خانوادگی تحویل‌گیرنده
                  </label>
                  <Input
                    {...register("fullName")}
                    placeholder="مثال: علی رضایی"
                    className="bg-sky-50/60 border-sky-200 h-12 text-sm text-slate-800 placeholder:text-slate-400 rounded-xl focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                  />
                  {errors.fullName && <p className="text-rose-500 text-xs mt-1">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    شماره موبایل
                  </label>
                  <Input
                    {...register("phone")}
                    placeholder="09123456789"
                    className="bg-sky-50/60 border-sky-200 h-12 text-sm text-slate-800 placeholder:text-slate-400 rounded-xl focus-visible:ring-2 focus-visible:ring-[#0082CA] font-sans text-left"
                    dir="ltr"
                  />
                  {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    استان
                  </label>
                  <Input
                    {...register("province")}
                    placeholder="مثال: تهران"
                    className="bg-sky-50/60 border-sky-200 h-12 text-sm text-slate-800 placeholder:text-slate-400 rounded-xl focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                  />
                  {errors.province && <p className="text-rose-500 text-xs mt-1">{errors.province.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    شهر
                  </label>
                  <Input
                    {...register("city")}
                    placeholder="مثال: تهران"
                    className="bg-sky-50/60 border-sky-200 h-12 text-sm text-slate-800 placeholder:text-slate-400 rounded-xl focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                  />
                  {errors.city && <p className="text-rose-500 text-xs mt-1">{errors.city.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">نشانی پستی دقیق</label>
                <Input
                  {...register("address")}
                  placeholder="خیابان، کوچه، پلاک، طبقه، واحد..."
                  className="bg-sky-50/60 border-sky-200 h-12 text-sm text-slate-800 placeholder:text-slate-400 rounded-xl focus-visible:ring-2 focus-visible:ring-[#0082CA]"
                />
                {errors.address && <p className="text-rose-500 text-xs mt-1">{errors.address.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">کد پستی (۱۰ رقمی)</label>
                <Input
                  {...register("postalCode")}
                  placeholder="1234567890"
                  className="bg-sky-50/60 border-sky-200 h-12 text-sm text-slate-800 placeholder:text-slate-400 rounded-xl focus-visible:ring-2 focus-visible:ring-[#0082CA] font-sans text-left"
                  dir="ltr"
                />
                {errors.postalCode && <p className="text-rose-500 text-xs mt-1">{errors.postalCode.message}</p>}
              </div>
            </form>
          </div>

          {/* Shipping Method & Weight Info */}
          <div className="bg-white border border-sky-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-sky-100 pb-4">
              <Truck className="w-6 h-6 text-[#0082CA]" />
              <div>
                <h2 className="text-xl md:text-2xl font-black text-[#0B192C]">روش و هزینه ارسال</h2>
                <p className="text-xs text-slate-500 mt-0.5">محاسبه دقیق تعرفه پستی بر پایه وزن محصولات سفارش</p>
              </div>
            </div>

            <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#0B192C]">پست پیشتاز سراسری</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-100 text-[#0082CA] border border-sky-200 font-bold">
                    وزن کل: {totalWeight.toLocaleString("fa-IR")} گرم
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  فرمول محاسبه: {formatPriceNumber(BASE_SHIPPING_AMOUNT)} تومان پایه + ({totalWeight.toLocaleString("fa-IR")} گرم × ۱.۶)
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">هزینه ارسال:</span>
                <span className="text-base font-black text-[#0082CA]">
                  {formatPrice(shippingCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white border border-sky-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-sky-100 pb-4">
              <CreditCard className="w-6 h-6 text-[#0082CA]" />
              <div>
                <h2 className="text-xl md:text-2xl font-black text-[#0B192C]">انتخاب درگاه پرداخت</h2>
                <p className="text-xs text-slate-500 mt-0.5">کلیه تراکنش‌ها از طریق بستر رمزنگاری شده SSL انجام می‌پذیرد</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentGateway("dummy")}
                className={`p-5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                  paymentGateway === "dummy"
                    ? "bg-sky-50 border-[#0082CA] shadow-sm ring-1 ring-[#0082CA]/30"
                    : "bg-white border-sky-200 hover:border-sky-300"
                }`}
              >
                <div className="space-y-1">
                  <span className="text-sm font-bold text-[#0B192C] block">درگاه شبیه‌ساز تستی (آنلاین)</span>
                  <span className="text-xs text-slate-500">تراکنش فوری و امن جهت تست تسویه</span>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-sky-300 flex items-center justify-center shrink-0">
                  {paymentGateway === "dummy" && <div className="w-2.5 h-2.5 bg-[#0082CA] rounded-full" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentGateway("zarinpal")}
                className={`p-5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                  paymentGateway === "zarinpal"
                    ? "bg-sky-50 border-[#0082CA] shadow-sm ring-1 ring-[#0082CA]/30"
                    : "bg-white border-sky-200 hover:border-sky-300"
                }`}
              >
                <div className="space-y-1">
                  <span className="text-sm font-bold text-[#0B192C] block">درگاه پرداخت زرین‌پال / بانکی</span>
                  <span className="text-xs text-slate-500">پشتیبانی از تمامی کارت‌های عضو شتاب</span>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-sky-300 flex items-center justify-center shrink-0">
                  {paymentGateway === "zarinpal" && <div className="w-2.5 h-2.5 bg-[#0082CA] rounded-full" />}
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
          <div className="bg-white border border-sky-100 rounded-3xl p-6 sticky top-28 shadow-sm space-y-6">
            <h2 className="text-lg md:text-xl font-black text-[#0B192C] border-b border-sky-100 pb-4">
              خلاصه سفارش ({items.length} کالا)
            </h2>

            {/* Items Mini List */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.size}`}
                  className="flex gap-3 items-center bg-sky-50/50 p-2.5 rounded-2xl border border-sky-100"
                >
                  <img
                    src={item.imageUrl || "/globe.svg"}
                    alt={item.name}
                    className="w-14 h-16 object-cover rounded-xl shrink-0 border border-sky-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#0B192C] truncate">{item.name}</h4>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      سایز: {item.size || "Free"} | تعداد: {item.quantity.toLocaleString("fa-IR")} | وزن: {((item.weight || 500) * item.quantity).toLocaleString("fa-IR")} گرم
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      {formatPrice(parsePrice(item.price) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            <div className="pt-2">
              {coupon ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Tag className="w-4 h-4" />
                    <span>کد «{coupon.code}» اعمال شد</span>
                  </div>
                  <button
                    onClick={() => removeCoupon()}
                    className="text-xs text-rose-500 hover:text-rose-600 cursor-pointer p-1"
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
                    className="bg-sky-50/60 border-sky-200 h-10 text-xs rounded-xl text-slate-800 placeholder:text-slate-400"
                  />
                  <Button
                    type="submit"
                    disabled={isApplyingCoupon}
                    variant="outline"
                    className="h-10 px-4 text-xs font-bold border-sky-200 bg-sky-50 hover:bg-sky-100 text-[#0082CA] rounded-xl shrink-0 cursor-pointer"
                  >
                    {isApplyingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "اعمال"}
                  </Button>
                </form>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="border-t border-sky-100 pt-4 space-y-3 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>مجموع سبد خرید:</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>تخفیف کوپن:</span>
                  <span>- {formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-start text-slate-500">
                <div className="flex flex-col">
                  <span className="text-[#0B192C] font-medium">هزینه ارسال:</span>
                  <span className="text-[10px] text-slate-400">
                    پست پیشتاز ({totalWeight.toLocaleString("fa-IR")} گرم)
                  </span>
                </div>
                <span className="font-bold text-[#0B192C] text-sm">
                  {formatPrice(shippingCost)}
                </span>
              </div>

              <div className="flex justify-between text-base font-black text-[#0B192C] pt-3 border-t border-sky-100">
                <span>مبلغ نهایی پرداخت:</span>
                <span className="text-[#0082CA]">{formatPrice(finalPayable)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              form="checkout-form"
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-[#0082CA] text-white hover:bg-[#006CA8] text-sm md:text-base font-black transition-all shadow-md shadow-[#0082CA]/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال ثبت سفارش و اتصال به درگاه...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-white" />
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