"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HoneycombLoader } from "@/components/ui/honeycomb-loader";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const router = useRouter();

  useEffect(() => {
    toast.info("احراز هویت فروشگاه ماوی با شماره موبایل و کد پیامکی (OTP) انجام می‌شود.");
    router.replace("/auth");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAFCFE] flex items-center justify-center p-4" dir="rtl">
      <div className="text-center space-y-4">
        <HoneycombLoader size="default" text="در حال انتقال به صفحه ورود با پیامک..." />
      </div>
    </div>
  );
}