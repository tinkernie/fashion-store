"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) {
      toast.error("توکن بازیابی نامعتبر است");
      return;
    }
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/api/auth/password-reset/confirm/', {
        token: token,
        new_password: formData.get("password")
      });
      toast.success("رمز عبور با موفقیت تغییر یافت");
      router.push("/auth");
    } catch (error) {
      toast.error("خطا در تغییر رمز عبور");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">رمز عبور جدید</label>
        <Input name="password" type="password" required className="bg-[#0a0a0a] border-white/10 h-12 text-white" dir="ltr" />
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