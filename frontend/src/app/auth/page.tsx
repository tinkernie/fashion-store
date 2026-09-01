"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, CheckCircle2, RotateCw, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import * as z from "zod";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { getApiErrorMessage } from "@/lib/error-utils";

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

const resendVerificationSchema = z.object({
  email: z.string().email("لطفاً یک ایمیل معتبر وارد کنید"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
type ResendVerificationForm = z.infer<typeof resendVerificationSchema>;

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [view, setView] = useState<"auth" | "forgotPassword" | "verifyPending" | "resendVerification">("auth");
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const { mergeCart } = useCart();

  // Form Hooks
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    setValue: setLoginValue,
    formState: { errors: loginErrors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const {
    register: registerSignup,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors },
    reset: resetForgot,
  } = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema) });

  const {
    register: registerResend,
    handleSubmit: handleResendSubmit,
    formState: { errors: resendErrors },
    setValue: setResendValue,
  } = useForm<ResendVerificationForm>({ resolver: zodResolver(resendVerificationSchema) });

  // Cooldown countdown timer & URL email prefill
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const emailParam = sp.get("email");
      if (emailParam) {
        setLoginValue("identifier", emailParam);
      }
    }
  }, [setLoginValue]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    const normalizedEmail = data.identifier.trim().toLowerCase();
    try {
      const response = await api.post("/api/auth/login/", {
        email: normalizedEmail,
        password: data.password,
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", response.data.access);
        localStorage.setItem("refresh_token", response.data.refresh);
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }
        window.dispatchEvent(new Event("auth-change"));
      }

      // Sync backend cart & wishlist on login
      try {
        await mergeCart();
        await useWishlist.getState().fetchWishlist();
      } catch {
        // Silent sync failure
      }

      toast.success("با موفقیت وارد حساب خود شدید");
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const redirectPath = searchParams?.get("redirect") || "/profile";
      router.push(redirectPath);
    } catch (error: any) {
      const errCode = error?.response?.data?.code || error?.response?.data?.error?.code;
      const errMsg = error?.response?.data?.error || error?.response?.data?.detail || "";

      // Inactive account check
      if (errCode === "inactive_account" || String(errMsg).includes("not activated") || String(errMsg).includes("verify your email")) {
        setPendingEmail(normalizedEmail);
        setResendValue("email", normalizedEmail);
        setView("verifyPending");
        toast.error("حساب کاربری شما هنوز فعال نشده است. لطفاً ایمیل خود را تایید کنید.");
        return;
      }

      toast.error(getApiErrorMessage(error, "ورود ناموفق بود. اطلاعات ورود را بررسی نمایید."));
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    const normalizedEmail = data.identifier.trim().toLowerCase();
    try {
      const [firstName, ...lastNames] = data.fullName.trim().split(" ");
      const fName = (firstName || "").trim();
      const lName = (lastNames.join(" ") || "").trim() || fName;

      await api.post("/api/auth/register/", {
        email: normalizedEmail,
        password: data.password,
        first_name: fName,
        last_name: lName,
      });

      // Email verification is mandatory (is_active=False on backend)
      setPendingEmail(normalizedEmail);
      setResendValue("email", normalizedEmail);
      setView("verifyPending");
      setResendCooldown(60);
      toast.success("حساب شما با موفقیت ایجاد شد", {
        description: "لینک فعال‌سازی به ایمیل شما ارسال گردید.",
      });
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "ثبت‌نام با خطا مواجه شد."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerification = async (targetEmail: string) => {
    if (!targetEmail) return;
    if (resendCooldown > 0) {
      toast.info(`لطفاً ${resendCooldown} ثانیه دیگر مجدداً تلاش کنید.`);
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/auth/resend-verification/", { email: targetEmail });
      setResendCooldown(60);
      toast.success("ایمیل فعال‌سازی مجدداً ارسال شد", {
        description: "لطفاً صندوق ورودی و پوشه اسپم را بررسی کنید.",
      });
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "ارسال مجدد ایمیل فعال‌سازی با خطا مواجه شد."));
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await api.post("/api/auth/password-reset/", {
        email: data.identifier,
      });
      toast.success("لینک بازیابی ارسال شد", {
        description: "لطفاً صندوق ورودی ایمیل خود را بررسی کنید",
      });
      setView("auth");
      resetForgot();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "ارسال لینک بازیابی با خطا مواجه شد."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("ورود با گوگل با موفقیت انجام شد");
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
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
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
          {view === "auth" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-white mb-2">خوش آمدید</h1>
                <p className="text-gray-400 text-sm">برای ادامه وارد حساب کاربری خود شوید</p>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={(val) => setActiveTab(val as "login" | "register")}
                className="w-full"
                dir="rtl"
              >
                <TabsList className="grid w-full grid-cols-2 bg-[#0a0a0a] border border-white/5 p-1 rounded-xl mb-8">
                  <TabsTrigger
                    value="login"
                    className="rounded-lg data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white text-gray-500 transition-all"
                  >
                    ورود
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="rounded-lg data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white text-gray-500 transition-all"
                  >
                    ثبت نام
                  </TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">
                        ایمیل یا شماره موبایل
                      </label>
                      <Input
                        {...registerLogin("identifier")}
                        placeholder="example@email.com"
                        className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30"
                        dir="ltr"
                      />
                      {loginErrors.identifier && (
                        <p className="text-red-500 text-xs mt-1">
                          {loginErrors.identifier.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-300">رمز عبور</label>
                        <button
                          type="button"
                          onClick={() => setView("forgotPassword")}
                          className="text-xs text-gray-500 hover:text-white transition-colors"
                        >
                          فراموشی رمز؟
                        </button>
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
                      {loginErrors.password && (
                        <p className="text-red-500 text-xs mt-1">
                          {loginErrors.password.message}
                        </p>
                      )}
                    </div>
                    <Button
                      disabled={isLoading}
                      type="submit"
                      className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-base font-bold transition-all mt-4"
                    >
                      {isLoading ? "در حال ورود..." : "ورود به حساب"}
                    </Button>
                  </form>
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setView("resendVerification")}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      ایمیل فعال‌سازی را دریافت نکرده‌اید؟ ارسال مجدد
                    </button>
                  </div>
                  <GoogleButton />
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register" className="mt-0">
                  <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">
                        نام و نام خانوادگی
                      </label>
                      <Input
                        {...registerSignup("fullName")}
                        placeholder="مثال: علی رضایی"
                        className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30"
                      />
                      {registerErrors.fullName && (
                        <p className="text-red-500 text-xs mt-1">
                          {registerErrors.fullName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">ایمیل</label>
                      <Input
                        {...registerSignup("identifier")}
                        placeholder="example@email.com"
                        className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30"
                        dir="ltr"
                      />
                      {registerErrors.identifier && (
                        <p className="text-red-500 text-xs mt-1">
                          {registerErrors.identifier.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-300">رمز عبور</label>
                        <span className="text-[11px] text-gray-500">
                          حداقل ۱۰ کاراکتر + حروف بزرگ، عدد و نماد
                        </span>
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
                      {registerErrors.password && (
                        <p className="text-red-500 text-xs mt-1">
                          {registerErrors.password.message}
                        </p>
                      )}
                    </div>
                    <Button
                      disabled={isLoading}
                      type="submit"
                      className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-base font-bold transition-all mt-4"
                    >
                      {isLoading ? "در حال ایجاد حساب..." : "ایجاد حساب کاربری"}
                    </Button>
                  </form>
                  <GoogleButton />
                </TabsContent>
              </Tabs>
            </>
          )}

          {/* Verification Pending Screen */}
          {view === "verifyPending" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
              <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-400 shadow-lg shadow-blue-500/10">
                <Mail className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">تایید آدرس ایمیل</h2>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                  لینک فعال‌سازی حساب کاربری به آدرس زیر ارسال شد:
                </p>
                {pendingEmail && (
                  <div className="inline-block bg-[#1a1a1a] border border-white/10 px-4 py-1.5 rounded-full text-xs font-mono text-white mt-2" dir="ltr">
                    {pendingEmail}
                  </div>
                )}
              </div>

              <div className="bg-[#161616] border border-white/5 p-4 rounded-2xl text-xs text-gray-400 text-right leading-5">
                لطفاً صندوق ورودی (Inbox) یا پوشه هرزنامه (Spam) ایمیل خود را بررسی کنید و جهت تکمیل فرآیند روی لینک فعال‌سازی کلیک نمایید.
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  disabled={isLoading || resendCooldown > 0}
                  onClick={() => handleSendVerification(pendingEmail)}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium text-sm flex items-center justify-center gap-2"
                >
                  <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                  {resendCooldown > 0 ? `ارسال مجدد تا (${resendCooldown}) ثانیه` : "ارسال مجدد ایمیل فعال‌سازی"}
                </Button>

                <Button
                  onClick={() => {
                    setLoginValue("identifier", pendingEmail);
                    setActiveTab("login");
                    setView("auth");
                  }}
                  className="w-full h-12 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-sm"
                >
                  ورود به حساب کاربری
                </Button>
              </div>
            </motion.div>
          )}

          {/* Resend Verification Form */}
          {view === "resendVerification" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">ارسال مجدد لینک فعال‌سازی</h2>
                <p className="text-gray-400 text-sm">ایمیل ثبت‌نامی خود را وارد نمایید</p>
              </div>
              <form
                onSubmit={handleResendSubmit((data) => {
                  setPendingEmail(data.email);
                  handleSendVerification(data.email);
                  setView("verifyPending");
                })}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Input
                    {...registerResend("email")}
                    placeholder="example@email.com"
                    className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30"
                    dir="ltr"
                  />
                  {resendErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{resendErrors.email.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-3 mt-6">
                  <Button
                    disabled={isLoading}
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-base font-bold transition-all"
                  >
                    {isLoading ? "در حال ارسال..." : "ارسال لینک فعال‌سازی"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setView("auth")}
                    variant="ghost"
                    className="w-full h-14 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
                  >
                    بازگشت به صفحه ورود
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Forgot Password View */}
          {view === "forgotPassword" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">بازیابی رمز عبور</h2>
                <p className="text-gray-400 text-sm">ایمیل خود را وارد کنید</p>
              </div>
              <form onSubmit={handleForgotSubmit(onForgotPassword)} className="space-y-5">
                <div className="space-y-2">
                  <Input
                    {...registerForgot("identifier")}
                    placeholder="example@email.com"
                    className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30"
                    dir="ltr"
                  />
                  {forgotErrors.identifier && (
                    <p className="text-red-500 text-xs mt-1">
                      {forgotErrors.identifier.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-3 mt-6">
                  <Button
                    disabled={isLoading}
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-base font-bold transition-all"
                  >
                    {isLoading ? "در حال ارسال..." : "ارسال لینک بازیابی"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setView("auth")}
                    variant="ghost"
                    className="w-full h-14 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
                  >
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