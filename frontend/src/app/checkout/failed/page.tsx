"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  RotateCcw,
  ShoppingBag,
  HelpCircle,
  PhoneCall,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/error-utils";
import { HoneycombLoader } from "@/components/ui/honeycomb-loader";

function FailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") || "ORD-UNKNOWN";
  const rawError = searchParams.get("error");
  const errorMessage = rawError
    ? getApiErrorMessage(rawError)
    : "تراکنش توسط کاربر لغو شد یا خطایی در ارتباط با درگاه بانکی رخ داد.";


  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-24 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-sky-100 rounded-3xl p-8 md:p-10 shadow-xl shadow-sky-950/5 text-center space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-rose-500" />

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-rose-50 border-2 border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-lg shadow-rose-500/10"
          >
            <AlertTriangle className="w-10 h-10" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">
              پرداخت ناموفق بود
            </h1>
            <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto">
              متأسفانه فرآیند پرداخت شما تکمیل نشد. اگر مبلغی از حساب شما کسر شده است، ظرف ۷۲ ساعت آینده توسط بانک عودت داده خواهد شد.
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-5 text-right space-y-3 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-rose-100/60">
              <span className="text-slate-500">شماره سفارش:</span>
              <span className="font-mono font-bold text-slate-900">{orderId}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">علت خطا:</span>
              <span className="text-rose-600 font-bold">{errorMessage}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <Button
              asChild
              className="w-full sm:flex-1 h-12 rounded-xl bg-[#0082CA] text-white font-black hover:bg-[#0072B5] shadow-md shadow-[#0082CA]/20"
            >
              <Link href="/checkout" className="flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" />
                تلاش مجدد جهت پرداخت
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full sm:flex-1 h-12 rounded-xl border-sky-200 bg-white hover:bg-sky-50 text-slate-800 font-bold shadow-sm"
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

export default function CheckoutFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-foreground" dir="rtl">
          <HoneycombLoader 
            size="default" 
            text="در حال بررسی وضعیت تراکنش..." 
          />
        </div>
      }
    >
      <FailedContent />
    </Suspense>
  );
}
