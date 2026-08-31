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
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-32 pb-24 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-[#111111] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl text-center space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-rose-500" />

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-rose-500/10 border-2 border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/10"
          >
            <AlertTriangle className="w-10 h-10" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-white">
              پرداخت ناموفق بود
            </h1>
            <p className="text-xs md:text-sm text-gray-400 max-w-md mx-auto">
              متأسفانه فرآیند پرداخت شما تکمیل نشد. اگر مبلغی از حساب شما کسر شده است، ظرف ۷۲ ساعت آینده توسط بانک عودت داده خواهد شد.
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-5 text-right space-y-3 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-gray-400">شماره سفارش:</span>
              <span className="font-mono font-bold text-white">{orderId}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">علت خطا:</span>
              <span className="text-rose-400 font-medium">{errorMessage}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <Button
              asChild
              className="w-full sm:flex-1 h-12 rounded-xl bg-white text-black font-black hover:bg-gray-200"
            >
              <Link href="/checkout" className="flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" />
                تلاش مجدد جهت پرداخت
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full sm:flex-1 h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold"
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
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white" dir="rtl">
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
