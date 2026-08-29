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
        <label className="text-sm font-medium text-gray-300">رمز عبور جدید</label>
        <div className="relative">
          <Input 
            name="password" 
            type={showPassword ? "text" : "password"} 
            required 
            className="bg-[#0a0a0a] border-white/10 h-12 text-white pr-4 pl-11" 
            dir="ltr" 
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none transition-colors p-1"
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
      <Button disabled={isLoading} type="submit" className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-base font-bold transition-all">
        {isLoading ? "در حال پردازش..." : "ثبت رمز عبور جدید"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white mb-2">ثبت رمز عبور جدید</h1>
            <p className="text-gray-400 text-sm">رمز عبور جدید خود را وارد کنید</p>
          </div>
          <Suspense fallback={<div className="text-white text-center">در حال بارگذاری...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </motion.div>
    </main>
  );
}