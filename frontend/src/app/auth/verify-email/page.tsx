"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/error-utils";
import { CheckCircle, XCircle, RotateCw } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus("error");
        setErrorMessage("توکن تایید در لینک وجود ندارد یا ناقص است.");
        return;
      }
      try {
        await api.post("/api/auth/verify-email/", { token });
        setStatus("success");
        toast.success("ایمیل شما با موفقیت تایید شد");
      } catch (error) {
        setStatus("error");
        const msg = getApiErrorMessage(error, "لینک تایید نامعتبر است یا منقضی شده است.");
        setErrorMessage(msg);
        toast.error(msg);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="space-y-6 text-center">
      {status === "loading" && (
        <div className="py-8 space-y-4">
          <div className="animate-spin w-10 h-10 border-2 border-white/20 border-t-white rounded-full mx-auto" />
          <div className="text-gray-400 text-sm">در حال تایید و فعال‌سازی حساب کاربری...</div>
        </div>
      )}

      {status === "success" && (
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="space-y-4">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
          <p className="text-white font-bold text-lg">حساب کاربری شما با موفقیت فعال شد.</p>
          <p className="text-gray-400 text-xs">اکنون می‌توانید با ایمیل و رمز عبور خود وارد شوید.</p>
          <Button
            onClick={() => router.push("/auth")}
            className="w-full mt-4 h-12 rounded-xl bg-white text-black hover:bg-gray-200 font-bold"
          >
            ورود به حساب کاربری
          </Button>
        </motion.div>
      )}

      {status === "error" && (
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="space-y-4">
          <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <p className="text-white font-bold text-lg">تایید ایمیل با خطا مواجه شد</p>
          <p className="text-rose-400 text-xs">{errorMessage || "لینک تایید منقضی یا نامعتبر است."}</p>
          <div className="pt-2 flex flex-col gap-2">
            <Button
              onClick={() => router.push("/auth")}
              className="w-full h-12 rounded-xl bg-white text-black hover:bg-gray-200 font-bold"
            >
              درخواست مجدد لینک تایید / ورود
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full h-12 rounded-xl border-white/20 text-white hover:bg-white hover:text-black"
            >
              بازگشت به صفحه اصلی
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white mb-2">تایید ایمیل</h1>
          </div>
          <Suspense fallback={<div className="text-white text-center">در حال پردازش...</div>}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </motion.div>
    </main>
  );
}