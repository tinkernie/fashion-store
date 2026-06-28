"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- Validation Schemas ---
const phoneRegex = /^09\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const identifierValidator = z.string().refine(
  (value) => phoneRegex.test(value) || emailRegex.test(value),
  { message: "فرمت ایمیل یا شماره موبایل (مثال: 09123456789) نامعتبر است" }
);

const loginSchema = z.object({
  identifier: identifierValidator,
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
});

const registerSchema = z.object({
  fullName: z.string().min(3, "نام باید حداقل ۳ کاراکتر باشد"),
  identifier: identifierValidator,
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
});

const forgotPasswordSchema = z.object({
  identifier: identifierValidator,
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<"auth" | "forgotPassword">("auth");

  // Form Hooks
  const { register: registerLogin, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const { register: registerSignup, handleSubmit: handleRegisterSubmit, formState: { errors: registerErrors } } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const { register: registerForgot, handleSubmit: handleForgotSubmit, formState: { errors: forgotErrors }, reset: resetForgot } = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema) });

  const onLogin = (data: LoginForm) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("با موفقیت وارد شدید");
      router.push("/");
    }, 1500);
  };

  const onRegister = (data: RegisterForm) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("حساب کاربری با موفقیت ساخته شد");
      router.push("/");
    }, 1500);
  };

  const onForgotPassword = (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("لینک بازیابی ارسال شد", { description: "لطفاً ایمیل یا پیامک خود را بررسی کنید" });
      setView("auth");
      resetForgot();
    }, 1500);
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("ورود با گوگل موفقیت‌آمیز بود");
      router.push("/");
    }, 1000);
  };

  // Reusable Google Button Component
  const GoogleButton = () => (
    <div className="mt-6">
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#111111] px-4 text-gray-500 font-medium">یا</span>
        </div>
      </div>
      <Button 
        type="button" 
        onClick={handleGoogleAuth}
        disabled={isLoading}
        className="w-full h-14 rounded-2xl border border-white/10 bg-transparent text-white hover:bg-white/5 text-base font-bold transition-all flex items-center justify-center gap-3"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        ادامه با گوگل
      </Button>
    </div>
  );

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl">
          
          {view === "auth" ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-white mb-2">خوش آمدید</h1>
                <p className="text-gray-400 text-sm">برای ادامه وارد حساب کاربری خود شوید</p>
              </div>

              <Tabs defaultValue="login" className="w-full" dir="rtl">
                <TabsList className="grid w-full grid-cols-2 bg-[#0a0a0a] border border-white/5 p-1 rounded-xl mb-8">
                  <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white text-gray-500 transition-all">ورود</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white text-gray-500 transition-all">ثبت نام</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">ایمیل یا شماره موبایل</label>
                      <Input {...registerLogin("identifier")} placeholder="example@email.com" className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30" dir="ltr" />
                      {loginErrors.identifier && <p className="text-red-500 text-xs mt-1">{loginErrors.identifier.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-300">رمز عبور</label>
                        <button type="button" onClick={() => setView("forgotPassword")} className="text-xs text-gray-500 hover:text-white transition-colors">فراموشی رمز؟</button>
                      </div>
                      <Input {...registerLogin("password")} type="password" placeholder="••••••••" className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30" dir="ltr" />
                      {loginErrors.password && <p className="text-red-500 text-xs mt-1">{loginErrors.password.message}</p>}
                    </div>
                    <Button disabled={isLoading} type="submit" className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-base font-bold transition-all mt-4">
                      {isLoading ? "در حال پردازش..." : "ورود به حساب"}
                    </Button>
                  </form>
                  <GoogleButton />
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register" className="mt-0">
                  <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">نام و نام خانوادگی</label>
                      <Input {...registerSignup("fullName")} placeholder="مثال: علی رضایی" className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30" />
                      {registerErrors.fullName && <p className="text-red-500 text-xs mt-1">{registerErrors.fullName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">ایمیل یا شماره موبایل</label>
                      <Input {...registerSignup("identifier")} placeholder="example@email.com" className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30" dir="ltr" />
                      {registerErrors.identifier && <p className="text-red-500 text-xs mt-1">{registerErrors.identifier.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">رمز عبور</label>
                      <Input {...registerSignup("password")} type="password" placeholder="••••••••" className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30" dir="ltr" />
                      {registerErrors.password && <p className="text-red-500 text-xs mt-1">{registerErrors.password.message}</p>}
                    </div>
                    <Button disabled={isLoading} type="submit" className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-base font-bold transition-all mt-4">
                      {isLoading ? "در حال پردازش..." : "ایجاد حساب کاربری"}
                    </Button>
                  </form>
                  <GoogleButton />
                </TabsContent>
              </Tabs>
            </>
          ) : (
            // Forgot Password View
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">بازیابی رمز عبور</h2>
                <p className="text-gray-400 text-sm">ایمیل یا شماره موبایل خود را وارد کنید</p>
              </div>
              <form onSubmit={handleForgotSubmit(onForgotPassword)} className="space-y-5">
                <div className="space-y-2">
                  <Input {...registerForgot("identifier")} placeholder="example@email.com" className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30" dir="ltr" />
                  {forgotErrors.identifier && <p className="text-red-500 text-xs mt-1">{forgotErrors.identifier.message}</p>}
                </div>
                <div className="flex flex-col gap-3 mt-6">
                  <Button disabled={isLoading} type="submit" className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-base font-bold transition-all">
                    {isLoading ? "در حال پردازش..." : "ارسال لینک بازیابی"}
                  </Button>
                  <Button type="button" onClick={() => setView("auth")} variant="ghost" className="w-full h-14 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">
                    بازگشت به صفحه ورود
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

        </div>
      </motion.div>
    </main>
  );
}