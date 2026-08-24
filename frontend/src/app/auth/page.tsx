"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import * as z from "zod";
import { useCart } from "@/store/cart";

// --- Validation Schemas ---
const phoneRegex = /^09\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const identifierValidator = z.string().refine(
  (value) => phoneRegex.test(value) || emailRegex.test(value),
  { message: "فرمت ایمیل یا شماره موبایل (مثال: 09123456789) نامعتبر است" }
);

const passwordRegisterSchema = z
  .string()
  .min(10, "رمز عبور باید حداقل ۱۰ کاراکتر باشد")
  .max(128, "رمز عبور نباید بیشتر از ۱۲۸ کاراکتر باشد")
  .regex(/[A-Z]/, "رمز عبور باید شامل حداقل یک حرف بزرگ انگلیسی (A-Z) باشد")
  .regex(/[a-z]/, "رمز عبور باید شامل حداقل یک حرف کوچک انگلیسی (a-z) باشد")
  .regex(/\d/, "رمز عبور باید شامل حداقل یک عدد (0-9) باشد")
  .regex(
    /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\/\\`~;]/,
    "رمز عبور باید شامل حداقل یک نماد خاص (مانند !@#$%) باشد"
  );

const loginSchema = z.object({
  identifier: identifierValidator,
  password: z.string().min(1, "رمز عبور را وارد کنید"),
});

const registerSchema = z.object({
  fullName: z.string().min(3, "نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد"),
  identifier: z
    .string()
    .email("لطفاً یک ایمیل معتبر وارد کنید (مثال: user@example.com)"),
  password: passwordRegisterSchema,
});

const forgotPasswordSchema = z.object({
  identifier: identifierValidator,
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const getApiErrorMessage = (error: any, defaultMsg: string): string => {
  const data = error?.response?.data;
  if (!data) return defaultMsg;
  if (typeof data === "string") return data;
  if (data.error?.message) return data.error.message;
  if (data.detail) return data.detail;
  if (data.message) return data.message;
  if (data.error?.errors && typeof data.error.errors === "object") {
    const firstKey = Object.keys(data.error.errors)[0];
    const val = data.error.errors[firstKey];
    return Array.isArray(val) ? val[0] : String(val);
  }
  if (typeof data === "object") {
    const firstKey = Object.keys(data)[0];
    const val = data[firstKey];
    return Array.isArray(val) ? val[0] : String(val);
  }
  return defaultMsg;
};

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [view, setView] = useState<"auth" | "forgotPassword">("auth");
  const { fetchCart, mergeCart } = useCart();

  // Form Hooks
  const { register: registerLogin, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const { register: registerSignup, handleSubmit: handleRegisterSubmit, formState: { errors: registerErrors } } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const { register: registerForgot, handleSubmit: handleForgotSubmit, formState: { errors: forgotErrors }, reset: resetForgot } = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema) });

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login/', {
        email: data.identifier,
        password: data.password
      });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Sync backend cart on login
      const localSession = localStorage.getItem('guest_session_key');
      if (localSession) {
        await mergeCart(localSession);
        localStorage.removeItem('guest_session_key');
      } else {
        await fetchCart();
      }

      toast.success("با موفقیت وارد شدید");
      router.push("/");
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "ورود ناموفق بود. اطلاعات را بررسی کنید."));
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const [firstName, ...lastNames] = data.fullName.split(' ');
      await api.post('/api/auth/register/', {
        email: data.identifier,
        password: data.password,
        first_name: firstName || '',
        last_name: lastNames.join(' ') || ''
      });
      toast.success("حساب کاربری با موفقیت ساخته شد. لطفا وارد شوید.");
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "ثبت‌نام ناموفق بود."));
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await api.post('/api/auth/password-reset/', {
        email: data.identifier
      });
      toast.success("لینک بازیابی ارسال شد", { description: "لطفاً ایمیل یا پیامک خود را بررسی کنید" });
      setView("auth");
      resetForgot();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "خطایی رخ داد. اطمینان حاصل کنید ایمیل صحیح است."));
    } finally {
      setIsLoading(false);
    }
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
                      <div className="relative">
                        <Input
                          {...registerLogin("password")}
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30 pr-4 pl-11"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none transition-colors p-1"
                          tabIndex={-1}
                          aria-label={showLoginPassword ? "پنهان کردن رمز" : "نمایش رمز"}
                        >
                          {showLoginPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
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
                      <label className="text-sm font-medium text-gray-300">ایمیل</label>
                      <Input {...registerSignup("identifier")} placeholder="example@email.com" className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30" dir="ltr" />
                      {registerErrors.identifier && <p className="text-red-500 text-xs mt-1">{registerErrors.identifier.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-300">رمز عبور</label>
                        <span className="text-[11px] text-gray-500">حداقل ۱۰ کاراکتر + حروف بزرگ، عدد و نماد</span>
                      </div>
                      <div className="relative">
                        <Input
                          {...registerSignup("password")}
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="••••••••••"
                          className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30 pr-4 pl-11"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword((prev) => !prev)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none transition-colors p-1"
                          tabIndex={-1}
                          aria-label={showRegisterPassword ? "پنهان کردن رمز" : "نمایش رمز"}
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
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