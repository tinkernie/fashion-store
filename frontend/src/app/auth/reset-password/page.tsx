"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/error-utils";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const uid = searchParams.get("uid") || searchParams.get("uidb64");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !uid) {
      toast.error("توکن یا شناسه کاربری بازیابی نامعتبر است");
      return;
    }
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/api/auth/password-reset/confirm/', {
        uidb64: uid,
        token: token,
        new_password: formData.get("password")
      });
      toast.success("رمز عبور با موفقیت تغییر یافت");
      router.push("/auth");
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "خطا در تغییر رمز عبور. لینک ممکن است منقضی شده باشد."));
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">رمز عبور جدید</label>
        <div className="relative">
          <Input 
            name="password" 
            type={showPassword ? "text" : "password"} 
            required 
            className="bg-sky-50/50 border-sky-200 h-12 text-slate-900 pr-4 pl-11 focus-visible:ring-2 focus-visible:ring-[#0082CA]" 
            dir="ltr" 
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
            tabIndex={-1}
            aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      <Button disabled={isLoading} type="submit" className="w-full h-14 rounded-2xl bg-[#0082CA] text-white hover:bg-[#0072B5] text-base font-bold shadow-md shadow-[#0082CA]/20 transition-all">
        {isLoading ? "در حال پردازش..." : "ثبت رمز عبور جدید"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pt-32 pb-24 px-6 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white border border-sky-100 rounded-3xl p-8 shadow-xl shadow-sky-950/5">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-900 mb-2">ثبت رمز عبور جدید</h1>
            <p className="text-slate-500 text-sm">رمز عبور جدید خود را وارد کنید</p>
          </div>
          <Suspense fallback={<div className="text-slate-500 text-center">در حال بارگذاری...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </motion.div>
    </main>
  );
}