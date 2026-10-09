"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Phone, KeyRound, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/error-utils";
import { normalizePersianDigits } from "@/lib/utils";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Request OTP for password reset
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizePersianDigits(phone);
    if (!/^09\d{9}$/.test(cleanPhone)) {
      toast.error("شماره موبایل باید ۱۱ رقم بوده و با 09 شروع شود (مثال: 09123456789).");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/auth/otp/request/", {
        phone_number: cleanPhone,
        purpose: "reset",
      });
      setStep("verify");
      setCooldown(60);
      toast.success("کد تأیید بازیابی پیامک شد");
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "خطا در ارسال کد بازیابی پیامکی"));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Confirm OTP & set new password via /api/auth/password-reset-otp/
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizePersianDigits(phone);
    const cleanCode = normalizePersianDigits(otpCode);

    if (!cleanCode || cleanCode.length < 4) {
      toast.error("کد تأیید پیامک‌شده را به طور کامل وارد کنید");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      toast.error("رمز عبور جدید باید حداقل ۸ کاراکتر باشد");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/auth/password-reset-otp/", {
        phone_number: cleanPhone,
        code: cleanCode,
        new_password: newPassword,
      });
      toast.success("رمز عبور با موفقیت تغییر یافت", {
        description: "اکنون می‌توانید با رمز عبور جدید وارد حساب خود شوید.",
      });
      router.push("/auth");
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "کد تأیید اشتباه است یا منقضی شده است"));
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "phone") {
    return (
      <form onSubmit={handleRequestOtp} className="space-y-5" dir="rtl">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#0082CA]" />
            <span>شماره موبایل حساب کاربری</span>
          </label>
          <Input
            type="tel"
            required
            placeholder="09123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-sky-50/40 border-sky-200 h-12 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#0082CA] text-sm"
            dir="ltr"
            autoFocus
          />
          <p className="text-[11px] text-slate-500">
            کد یک‌بارمصرف پیامکی برای بازیابی رمز عبور به این شماره ارسال خواهد شد.
          </p>
        </div>

        <Button
          disabled={isLoading}
          type="submit"
          className="w-full h-12 rounded-xl bg-[#0082CA] text-white hover:bg-[#0072B5] text-sm font-bold shadow-md shadow-[#0082CA]/20 transition-all cursor-pointer"
        >
          {isLoading ? "در حال ارسال کد..." : "ارسال کد تأیید پیامکی"}
        </Button>

        <div className="pt-4 border-t border-slate-100 text-center">
          <Link
            href="/auth"
            className="text-xs text-slate-500 hover:text-[#0082CA] transition-colors inline-flex items-center gap-1"
          >
            <span>بازگشت به صفحه ورود</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleResetPassword} className="space-y-4" dir="rtl">
      <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 flex items-center justify-between">
        <span dir="ltr" className="font-mono font-bold">{phone}</span>
        <button
          type="button"
          onClick={() => setStep("phone")}
          className="text-[11px] text-[#0082CA] hover:underline cursor-pointer"
        >
          ویرایش شماره
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-[#0082CA]" />
          <span>کد تأیید پیامک‌شده</span>
        </label>
        <Input
          type="text"
          required
          maxLength={8}
          placeholder="12345"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          className="bg-sky-50/40 border-sky-200 h-12 text-slate-900 text-center text-lg tracking-widest placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#0082CA]"
          dir="ltr"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0082CA]" />
          <span>رمز عبور جدید</span>
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            required
            placeholder="حداقل ۸ کاراکتر"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="bg-sky-50/40 border-sky-200 h-12 text-slate-900 pr-4 pl-11 focus-visible:ring-2 focus-visible:ring-[#0082CA] text-sm"
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
            tabIndex={-1}
            aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        {cooldown > 0 ? (
          <span>ارسال مجدد کد تا {cooldown} ثانیه</span>
        ) : (
          <button
            type="button"
            onClick={handleRequestOtp}
            disabled={isLoading}
            className="text-[#0082CA] hover:underline cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>ارسال مجدد پیامک</span>
          </button>
        )}
      </div>

      <Button
        disabled={isLoading}
        type="submit"
        className="w-full h-12 rounded-xl bg-[#0082CA] text-white hover:bg-[#0072B5] text-sm font-bold shadow-md shadow-[#0082CA]/20 transition-all cursor-pointer mt-2"
      >
        {isLoading ? "در حال تغییر رمز عبور..." : "ثبت رمز عبور جدید"}
      </Button>

      <div className="pt-4 border-t border-slate-100 text-center">
        <Link
          href="/auth"
          className="text-xs text-slate-500 hover:text-[#0082CA] transition-colors inline-flex items-center gap-1"
        >
          <span>انصراف و بازگشت به ورود</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#FAFCFE] text-foreground pt-32 pb-24 px-4 sm:px-6 flex items-center justify-center" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white border border-sky-100 rounded-3xl p-8 shadow-xl shadow-sky-950/5">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-sky-50 rounded-2xl mx-auto mb-4 border border-sky-100 flex items-center justify-center text-[#0082CA] shadow-sm">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">بازیابی رمز عبور</h1>
            <p className="text-slate-500 text-xs">
              تغییر رمز عبور با دریافت کد تأیید پیامکی (OTP)
            </p>
          </div>
          <Suspense fallback={<div className="text-slate-500 text-center py-6 text-sm">در حال بارگذاری...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </motion.div>
    </main>
  );
}