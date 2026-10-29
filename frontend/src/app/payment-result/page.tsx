"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
  CreditCard,
  Clock,
  PhoneCall,
  Loader2,
  ShieldCheck,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoneycombLoader } from "@/components/ui/honeycomb-loader";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/error-utils";
import { formatPrice } from "@/lib/price-utils";
import { useCart } from "@/store/cart";
import { toast } from "sonner";
import type { AuthoritativeOrder, PaymentInitiateResponse } from "@/lib/payment-types";

function PaymentResultContent() {
  const searchParams = useSearchParams();

  // URL Query Parameters returned by PaymentCallbackResultView
  const orderNumber = searchParams.get("order") || "";
  const refCode = searchParams.get("ref") || "";
  const urlStatus = searchParams.get("status") || "";

  const [isLoadingOrder, setIsLoadingOrder] = useState<boolean>(() => Boolean(orderNumber));
  const [orderData, setOrderData] = useState<AuthoritativeOrder | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const clearCart = useCart((state) => state.clearCart);

  // Authoritative Backend Verification: Fetch live order record
  const verifyOrderWithBackend = useCallback(async (orderNum: string) => {
    setIsLoadingOrder(true);
    setFetchError(null);
    try {
      const res = await api.get<AuthoritativeOrder>(`/api/orders/${encodeURIComponent(orderNum)}/`);
      const order = res.data;
      setOrderData(order);

      // Only purge client cart when backend authoritatively confirms payment
      if (
        order.status === "paid" ||
        order.status === "packing" ||
        order.status === "shipping" ||
        order.status === "delivered"
      ) {
        try {
          await clearCart();
        } catch (e) {
          console.error("Error clearing cart on confirmed payment:", e);
        }
      }
    } catch (err: unknown) {
      console.error("Error verifying order with backend:", err);
      setFetchError(getApiErrorMessage(err, "خطا در تایید وضعیت سفارش از سرور"));
    } finally {
      setIsLoadingOrder(false);
    }
  }, [clearCart]);

  useEffect(() => {
    if (!orderNumber) {
      return;
    }

    let ignore = false;
    async function loadOrder() {
      try {
        const res = await api.get<AuthoritativeOrder>(`/api/orders/${encodeURIComponent(orderNumber)}/`);
        if (!ignore) {
          const order = res.data;
          setOrderData(order);

          if (
            order.status === "paid" ||
            order.status === "packing" ||
            order.status === "shipping" ||
            order.status === "delivered"
          ) {
            try {
              await clearCart();
            } catch (e) {
              console.error("Error clearing cart on confirmed payment:", e);
            }
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error("Error verifying order with backend:", err);
          setFetchError(getApiErrorMessage(err, "خطا در تایید وضعیت سفارش از سرور"));
        }
      } finally {
        if (!ignore) {
          setIsLoadingOrder(false);
        }
      }
    }

    loadOrder();

    return () => {
      ignore = true;
    };
  }, [orderNumber, clearCart]);

  // Re-initiate payment flow on the existing order (only allowed for pending / awaiting_payment)
  const handleRetryPayment = async () => {
    if (!orderData?.id) {
      toast.error("شناسه سفارش جهت پرداخت مجدد یافت نشد.");
      return;
    }
    setIsRetrying(true);
    try {
      toast.loading("در حال آماده‌سازی درگاه پرداخت بانکی...");
      const res = await api.post<PaymentInitiateResponse>("/api/payments/initiate/", {
        order_id: orderData.id,
        gateway: "zarinpal",
      });

      const payData = res.data;
      if (payData.redirect_url) {
        window.location.href = payData.redirect_url;
        return;
      }

      if (payData.status === "succeeded") {
        await clearCart();
        toast.success("سفارش با موفقیت تسویه گردید.");
        verifyOrderWithBackend(orderData.order_number);
        return;
      }

      toast.error("دریافت آدرس درگاه پرداخت با خطا مواجه شد.");
    } catch (err: unknown) {
      console.error("Payment retry failed:", err);
      toast.error(getApiErrorMessage(err, "خطا در ارتباط با درگاه پرداخت"));
    } finally {
      setIsRetrying(false);
    }
  };

  // 1. Loading State
  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-36 pb-24 px-4 flex flex-col items-center justify-center" dir="rtl">
        <HoneycombLoader />
        <p className="mt-6 text-sm font-bold text-slate-600 animate-pulse">
          در حال بررسی و تایید نهایی تراکنش از سرور...
        </p>
      </div>
    );
  }

  // Authoritative Order Status Mapping (strictly Order.Status choices)
  const isPaymentConfirmed =
    orderData?.status === "paid" ||
    orderData?.status === "packing" ||
    orderData?.status === "shipping" ||
    orderData?.status === "delivered";

  const isPendingOrAwaiting =
    orderData?.status === "pending" || orderData?.status === "awaiting_payment";

  const isCancelled = orderData?.status === "cancelled";
  const isReturned = orderData?.status === "returned";
  const isRefunded = orderData?.status === "refunded";

  // 2. PAYMENT CONFIRMED (paid, packing, shipping, delivered)
  if (isPaymentConfirmed && orderData) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-32 pb-24 px-4 sm:px-6 lg:px-8" dir="rtl">
        <div className="max-w-2xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="bg-white border border-sky-100 rounded-3xl p-8 md:p-10 shadow-xl shadow-sky-950/5 text-center space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#0082CA] to-emerald-500" />

            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 220, delay: 0.15 }}
              className="w-20 h-20 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-lg shadow-emerald-500/10"
            >
              <CheckCircle2 className="w-10 h-10" />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                پرداخت با موفقیت انجام شد
              </h1>
              <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                سفارش شما با موفقیت ثبت و پرداخت گردید و جهت آماده‌سازی و ارسال به واحد انبارداری تحویل داده شد.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-5 text-right space-y-3.5 text-xs">
              <div className="flex justify-between items-center pb-3 border-b border-sky-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#0082CA]" />
                  شماره پیگیری سفارش:
                </span>
                <span className="font-mono font-bold text-slate-900 tracking-wider text-sm" dir="ltr">
                  {orderData.order_number}
                </span>
              </div>

              {refCode && (
                <div className="flex justify-between items-center pb-3 border-b border-sky-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    کد رهگیری تراکنش بانکی:
                  </span>
                  <span className="font-mono font-bold text-[#0082CA] tracking-wider" dir="ltr">
                    {refCode}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pb-3 border-b border-sky-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  مبلغ پرداخت شده:
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatPrice(orderData.total)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  وضعیت سفارش:
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  پرداخت تایید شده
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
              <Button
                asChild
                className="w-full sm:flex-1 h-12 rounded-xl bg-[#0082CA] text-white font-black hover:bg-[#0072B5] shadow-md shadow-[#0082CA]/20 transition-all cursor-pointer"
              >
                <Link href="/profile" className="flex items-center justify-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  مشاهده سفارشات من
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full sm:flex-1 h-12 rounded-xl border-sky-200 bg-white hover:bg-sky-50 text-slate-800 font-bold shadow-sm transition-all cursor-pointer"
              >
                <Link href="/" className="flex items-center justify-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  ادامه خرید از فروشگاه
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 3. PENDING / AWAITING PAYMENT (Retry payment ONLY shown here)
  if (isPendingOrAwaiting && orderData) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-32 pb-24 px-4 sm:px-6 lg:px-8" dir="rtl">
        <div className="max-w-2xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="bg-white border border-amber-200 rounded-3xl p-8 md:p-10 shadow-xl shadow-amber-950/5 text-center space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-amber-500" />

            {/* Pending Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 220, delay: 0.15 }}
              className="w-20 h-20 bg-amber-50 border-2 border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-lg shadow-amber-500/10"
            >
              <Clock className="w-10 h-10" />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                در انتظار تکمیل پرداخت
              </h1>
              <p className="text-xs md:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                تراکنش توسط درگاه بانکی تایید نشد یا فرآیند پرداخت ناتمام ماند. سفارش شما ثبت شده است و می‌توانید هم‌اکنون هزینه آن را پرداخت نمایید.
              </p>
            </div>

            {/* Order Details */}
            <div className="bg-amber-50/50 border border-amber-200/70 rounded-2xl p-5 text-right space-y-3.5 text-xs">
              <div className="flex justify-between items-center pb-3 border-b border-amber-200/50">
                <span className="text-slate-600">شماره سفارش:</span>
                <span className="font-mono font-bold text-slate-900" dir="ltr">
                  {orderData.order_number}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-amber-200/50">
                <span className="text-slate-600">مبلغ قابل پرداخت:</span>
                <span className="font-bold text-slate-900">
                  {formatPrice(orderData.total)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">وضعیت فعلی:</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                  در انتظار پرداخت
                </span>
              </div>
            </div>

            {/* Action CTAs: Retry button ONLY for pending and awaiting_payment */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
              <Button
                type="button"
                onClick={handleRetryPayment}
                disabled={isRetrying}
                className="w-full sm:flex-1 h-12 rounded-xl bg-[#0082CA] text-white font-black hover:bg-[#0072B5] shadow-md shadow-[#0082CA]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال اتصال به درگاه...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    پرداخت مجدد همین سفارش
                  </>
                )}
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full sm:flex-1 h-12 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold shadow-sm transition-all cursor-pointer"
              >
                <Link href="/profile" className="flex items-center justify-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  مشاهده سفارش در پنل
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 4. CANCELLED STATE
  if (isCancelled && orderData) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-32 pb-24 px-4 sm:px-6 lg:px-8" dir="rtl">
        <div className="max-w-2xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-rose-200 rounded-3xl p-8 md:p-10 shadow-xl text-center space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-rose-500" />
            <div className="w-20 h-20 bg-rose-50 border-2 border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900">این سفارش لغو شده است</h1>
              <p className="text-xs md:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                سفارش شماره {orderData.order_number} لغو گردیده و امکان پرداخت مجدد آن وجود ندارد.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button asChild className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#0082CA] text-white font-bold">
                <Link href="/profile">مشاهده سفارشات من</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto h-12 px-8 rounded-xl">
                <Link href="/">ادامه خرید از فروشگاه</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 5. RETURNED STATE
  if (isReturned && orderData) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-32 pb-24 px-4 sm:px-6 lg:px-8" dir="rtl">
        <div className="max-w-2xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-amber-200 rounded-3xl p-8 md:p-10 shadow-xl text-center space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-amber-500" />
            <div className="w-20 h-20 bg-amber-50 border-2 border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <RotateCcw className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900">سفارش مرجوع شده است</h1>
              <p className="text-xs md:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                سفارش شماره {orderData.order_number} مرجوع گردیده است.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button asChild className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#0082CA] text-white font-bold">
                <Link href="/profile">مشاهده سفارشات من</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto h-12 px-8 rounded-xl">
                <Link href="/">ادامه خرید از فروشگاه</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 6. REFUNDED STATE
  if (isRefunded && orderData) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-32 pb-24 px-4 sm:px-6 lg:px-8" dir="rtl">
        <div className="max-w-2xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-teal-200 rounded-3xl p-8 md:p-10 shadow-xl text-center space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-teal-500" />
            <div className="w-20 h-20 bg-teal-50 border-2 border-teal-200 rounded-full flex items-center justify-center mx-auto text-teal-600">
              <RotateCcw className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900">مبلغ سفارش مسترد گردیده است</h1>
              <p className="text-xs md:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                مبلغ سفارش شماره {orderData.order_number} به حساب شما عودت داده شد.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button asChild className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#0082CA] text-white font-bold">
                <Link href="/profile">مشاهده سفارشات من</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto h-12 px-8 rounded-xl">
                <Link href="/">ادامه خرید از فروشگاه</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 7. ERROR / INVALID GATEWAY / UNRESOLVED ORDER STATE
  const errorTitle =
    urlStatus === "invalid_gateway"
      ? "درگاه پرداخت نامعتبر"
      : urlStatus === "error"
      ? "خطا در پردازش اطلاعات پرداخت"
      : "عدم تایید پرداخت سفارش";

  const errorDescription =
    urlStatus === "invalid_gateway"
      ? "درگاه پرداخت انتخاب‌شده در سیستم معتبر نمی‌باشد. لطفاً با پشتیبانی تماس حاصل نمایید."
      : urlStatus === "error"
      ? "در فرآیند اعتبارسنجی پرداخت بانکی خطایی رخ داده است. در صورت کسر وجه ظرف ۷۲ ساعت توسط بانک عودت می‌گردد."
      : fetchError ||
        "اطلاعات تایید تراکنش دریافت نشد یا ارتباط با سرور برقرار نگردید. لطفاً حساب کاربری خود را بررسی نمایید.";

  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-24 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="bg-white border border-rose-200 rounded-3xl p-8 md:p-10 shadow-xl shadow-rose-950/5 text-center space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-rose-500" />

          {/* Alert Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 220, delay: 0.15 }}
            className="w-20 h-20 bg-rose-50 border-2 border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-lg shadow-rose-500/10"
          >
            <AlertTriangle className="w-10 h-10" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">
              {errorTitle}
            </h1>
            <p className="text-xs md:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {errorDescription}
            </p>
          </div>

          {orderNumber && (
            <div className="bg-rose-50/40 border border-rose-200/60 rounded-2xl p-4 text-right space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">شماره سفارش:</span>
                <span className="font-mono font-bold text-slate-900" dir="ltr">
                  {orderNumber}
                </span>
              </div>
            </div>
          )}

          {/* Action CTAs (No retry button here - retry is strictly for pending / awaiting_payment) */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <Button
              asChild
              className="w-full sm:flex-1 h-12 rounded-xl bg-[#0082CA] text-white font-black hover:bg-[#0072B5] shadow-md shadow-[#0082CA]/20 transition-all cursor-pointer"
            >
              <Link href="/profile" className="flex items-center justify-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                مشاهده سفارشات من
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full sm:flex-1 h-12 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold shadow-sm transition-all cursor-pointer"
            >
              <Link href="/contact" className="flex items-center justify-center gap-2">
                <PhoneCall className="w-4 h-4" />
                تماس با پشتیبانی
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background pt-36 pb-24 px-4 flex items-center justify-center" dir="rtl">
          <HoneycombLoader />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
