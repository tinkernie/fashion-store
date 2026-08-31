"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Printer,
  ShoppingBag,
  Clock,
  MapPin,
  FileText,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoneycombLoader } from "@/components/ui/honeycomb-loader";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") || "ORD-" + Math.floor(100000 + Math.random() * 900000);
  const refCode = searchParams.get("ref") || "REF-" + Math.floor(100000 + Math.random() * 900000);
  const amount = searchParams.get("amount") ? parseFloat(searchParams.get("amount")!) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-32 pb-24 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Success Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-[#111111] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl text-center space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

          {/* Animated Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/10"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-white">
              پرداخت با موفقیت انجام شد!
            </h1>
            <p className="text-xs md:text-sm text-gray-400 max-w-md mx-auto">
              سفارش شما با موفقیت در سیستم ثبت گردید و جهت آماده‌سازی و ارسال به واحد انبارداری تحویل داده شد.
            </p>
          </div>

          {/* Receipt Info Box */}
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-5 text-right space-y-3.5 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-gray-400">شماره پیگیری سفارش:</span>
              <span className="font-mono font-bold text-white tracking-wider text-sm">{orderId}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-gray-400">کد رهگیری بانکی / تراکنش:</span>
              <span className="font-mono font-bold text-amber-400 tracking-wider">{refCode}</span>
            </div>

            {amount && (
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-gray-400">مبلغ پرداخت شده:</span>
                <span className="font-bold text-white">{amount.toLocaleString("fa-IR")} تومان</span>
              </div>
            )}

            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <span className="text-gray-400">زمان تحویل تقریبی:</span>
              <span className="font-bold text-gray-200">۲ الی ۴ روز کاری (پست پیشتاز)</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">وضعیت سفارش:</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                در انتظار بسته‌بندی و ارسال
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <Button
              asChild
              className="w-full sm:flex-1 h-12 rounded-xl bg-white text-black font-black hover:bg-gray-200"
            >
              <Link href="/profile" className="flex items-center justify-center gap-2">
                <User className="w-4 h-4" />
                پیگیری سفارش در حساب کاربری
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full sm:flex-1 h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold"
            >
              <Link href="/products" className="flex items-center justify-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                بازگشت به فروشگاه
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white" dir="rtl">
          <HoneycombLoader 
            size="default" 
            text="در حال تایید و ثبت تراکنش پرداخت..." 
          />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
