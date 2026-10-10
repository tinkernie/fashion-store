"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Phone,
  ShieldCheck,
  CheckCircle2,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Lock,
  User,
  KeyRound,
  Sparkles,
} from "lucide-react";
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
import { setAuthSession, parseJwtPayload } from "@/lib/auth";

// Persian to English digit normalizer
function normalizePersianDigits(str: string): string {
  if (!str) return "";
  return str
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .trim();
}

// Validation Schemas
const phoneValidator = z
  .string()
  .transform(normalizePersianDigits)
  .pipe(
    z
      .string()
      .regex(/^09\d{9}$/, "شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد (مثال: 09123456789)")
  );

const passwordSchema = z
  .string()
  .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
  .max(128, "رمز عبور نباید بیشتر از ۱۲۸ کاراکتر باشد");

const otpRequestSchema = z.object({
  phone: phoneValidator,
});

const otpVerifySchema = z.object({
  code: z
    .string()
    .transform(normalizePersianDigits)
    .pipe(z.string().min(4, "کد تایید حداقل ۴ رقم است").max(8, "کد تایید نامعتبر است")),
});

const passwordLoginSchema = z.object({
  phone: phoneValidator,
  password: z.string().min(1, "رمز عبور را وارد کنید"),
});

const passwordRegisterSchema = z.object({
  fullName: z.string().min(3, "نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد"),
  phone: phoneValidator,
  password: passwordSchema,
});

const resetPasswordOtpSchema = z.object({
  phone: phoneValidator,
  code: z
    .string()
    .transform(normalizePersianDigits)
    .pipe(z.string().min(4, "کد تایید حداقل ۴ رقم است").max(8, "کد تایید نامعتبر است")),
  newPassword: passwordSchema,
});

type OtpRequestForm = z.infer<typeof otpRequestSchema>;
type OtpVerifyForm = z.infer<typeof otpVerifySchema>;
type PasswordLoginForm = z.infer<typeof passwordLoginSchema>;
type PasswordRegisterForm = z.infer<typeof passwordRegisterSchema>;
type ResetPasswordOtpForm = z.infer<typeof resetPasswordOtpSchema>;

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [view, setView] = useState<"login" | "resetPassword">("login");
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [otpPhone, setOtpPhone] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const { mergeCart } = useCart();

  // React Hook Form instances
  const {
    register: regOtpReq,
    handleSubmit: handleOtpReqSubmit,
    setValue: setOtpReqValue,
    formState: { errors: otpReqErrors },
  } = useForm<OtpRequestForm>({ resolver: zodResolver(otpRequestSchema) });

  const {
    register: regOtpVer,
    handleSubmit: handleOtpVerSubmit,
    formState: { errors: otpVerErrors },
    reset: resetOtpVer,
  } = useForm<OtpVerifyForm>({ resolver: zodResolver(otpVerifySchema) });

  const {
    register: regPassLogin,
    handleSubmit: handlePassLoginSubmit,
    formState: { errors: passLoginErrors },
  } = useForm<PasswordLoginForm>({ resolver: zodResolver(passwordLoginSchema) });

  const {
    register: regPassReg,
    handleSubmit: handlePassRegSubmit,
    formState: { errors: passRegErrors },
  } = useForm<PasswordRegisterForm>({ resolver: zodResolver(passwordRegisterSchema) });

  const {
    register: regReset,
    handleSubmit: handleResetSubmit,
    setValue: setResetValue,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordOtpForm>({ resolver: zodResolver(resetPasswordOtpSchema) });

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const finishLogin = async (data: { access: string; refresh?: string; user?: any }) => {
    setAuthSession(data);
    try {
      await mergeCart();
      await useWishlist.getState().fetchWishlist();
    } catch {}

    // Task 4: Superuser redirection check
    let isSuper = Boolean(data?.user?.is_superuser || data?.user?.is_staff);
    if (!isSuper && data?.access) {
      const payload = parseJwtPayload(data.access);
      if (payload?.is_superuser || payload?.is_staff) {
        isSuper = true;
      }
    }

    if (!isSuper && data?.access) {
      try {
        const meRes = await api.get("/api/users/me/");
        if (meRes.data?.is_superuser || meRes.data?.is_staff) {
          isSuper = true;
          setAuthSession({ ...data, user: meRes.data });
        }
      } catch {}
    }

    toast.success("ورود با موفقیت انجام شد", {
      description: isSuper ? "به پنل مدیریت فروشگاه ماوی خوش آمدید." : "به فروشگاه پوشاک ماوی خوش آمدید.",
    });

    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const redirectParam = searchParams?.get("redirect");

    if (isSuper) {
      router.push("/admin");
      return;
    }

    const redirectPath = redirectParam || "/profile";
    router.push(redirectPath);
  };

  // 1. Request OTP for Login
  const onRequestOtp = async (data: OtpRequestForm) => {
    setIsLoading(true);
    const normalized = normalizePersianDigits(data.phone);
    try {
      await api.post("/api/auth/otp/request/", {
        phone_number: normalized,
        purpose: "login",
      });
      setOtpPhone(normalized);
      setOtpStep("verify");
      setCooldown(60);
      toast.success("کد تایید ارسال شد", {
        description: `کد تایید ۵ رقمی به شماره ${normalized} پیامک گردید.`,
      });
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "خطا در ارسال پیامک کد تایید"));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify OTP for Login
  const onVerifyOtp = async (data: OtpVerifyForm) => {
    setIsLoading(true);
    const code = normalizePersianDigits(data.code);
    try {
      const res = await api.post("/api/auth/otp/verify/", {
        phone_number: otpPhone,
        code: code,
        purpose: "login",
      });
      await finishLogin(res.data);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "کد تایید نامعتبر یا منقضی شده است"));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Resend OTP
  const onResendOtp = async () => {
    if (cooldown > 0 || !otpPhone) return;
    setIsLoading(true);
    try {
      await api.post("/api/auth/otp/request/", {
        phone_number: otpPhone,
        purpose: view === "resetPassword" ? "reset" : "login",
      });
      setCooldown(60);
      toast.success("کد تایید مجدداً ارسال گردید");
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "خطا در ارسال مجدد کد تایید"));
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Password Login
  const onPasswordLogin = async (data: PasswordLoginForm) => {
    setIsLoading(true);
    const normalized = normalizePersianDigits(data.phone);
    try {
      const res = await api.post("/api/auth/login/", {
        phone_number: normalized,
        password: data.password,
      });
      await finishLogin(res.data);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "شماره موبایل یا رمز عبور اشتباه است"));
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Password Register
  const onPasswordRegister = async (data: PasswordRegisterForm) => {
    setIsLoading(true);
    const normalized = normalizePersianDigits(data.phone);
    const [firstName, ...lastNames] = data.fullName.trim().split(" ");
    const fName = (firstName || "").trim();
    const lName = (lastNames.join(" ") || "").trim() || fName;

    try {
      await api.post("/api/auth/register/", {
        phone_number: normalized,
        password: data.password,
        first_name: fName,
        last_name: lName,
      });

      // Automatically login with password
      const loginRes = await api.post("/api/auth/login/", {
        phone_number: normalized,
        password: data.password,
      });
      await finishLogin(loginRes.data);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "خطا در ثبت‌نام کاربر"));
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Reset Password via OTP
  const onResetPassword = async (data: ResetPasswordOtpForm) => {
    setIsLoading(true);
    const phone = normalizePersianDigits(data.phone);
    const code = normalizePersianDigits(data.code);
    try {
      await api.post("/api/auth/password-reset-otp/", {
        phone_number: phone,
        code: code,
        new_password: data.newPassword,
      });
      toast.success("رمز عبور با موفقیت تغییر کرد", {
        description: "اکنون می‌توانید با رمز عبور جدید وارد شوید.",
      });
      setView("login");
      setActiveTab("login");
      setLoginMethod("password");
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "کد تایید اشتباه است یا منقضی شده"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartResetPassword = async (phoneInput: string) => {
    const normalized = normalizePersianDigits(phoneInput);
    if (!/^09\d{9}$/.test(normalized)) {
      toast.error("لطفاً ابتدا یک شماره موبایل معتبر (مثال: 09123456789) وارد کنید");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/api/auth/otp/request/", {
        phone_number: normalized,
        purpose: "reset",
      });
      setOtpPhone(normalized);
      setResetValue("phone", normalized);
      setCooldown(60);
      setView("resetPassword");
      toast.success("کد تایید بازیابی پیامک شد");
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "خطا در ارسال کد بازیابی"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#FAFCFE] flex items-center justify-center py-20 px-4 sm:px-6 relative overflow-hidden"
      dir="rtl"
    >
      {/* Decorative Brand Background Aura */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#0082CA]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#0091DF]/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white border border-sky-100/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-950/5 relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0082CA] text-white shadow-lg shadow-[#0082CA]/25 mb-4">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#0B192C]">
            {view === "resetPassword"
              ? "بازیابی رمز عبور"
              : activeTab === "register"
              ? "ثبت‌نام جدید در ماوی"
              : "ورود به حساب کاربری"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            {view === "resetPassword"
              ? "کد پیامک‌شده و رمز عبور جدید خود را وارد نمایید."
              : activeTab === "register"
              ? "ایجاد حساب کاربری با پیامک تایید (OTP)"
              : "مدیریت سفارش‌ها و دسترسی به اطلاعات کاربری ماوی"}
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW: RESET PASSWORD VIA OTP                                   */}
        {/* ------------------------------------------------------------- */}
        {view === "resetPassword" && (
          <form onSubmit={handleResetSubmit(onResetPassword)} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#0B192C] block mb-1.5">شماره موبایل</label>
              <div className="relative">
                <Input
                  {...regReset("phone")}
                  placeholder="09123456789"
                  dir="ltr"
                  className="font-sans pl-10 h-12 rounded-2xl border-sky-100 focus-visible:ring-[#0082CA]"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {resetErrors.phone && (
                <p className="text-[11px] text-rose-500 mt-1">{resetErrors.phone.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#0B192C]">کد تایید پیامک‌شده</label>
                {cooldown > 0 ? (
                  <span className="text-[11px] text-slate-400 font-sans">
                    ارسال مجدد تا {cooldown} ثانیه
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onResendOtp}
                    className="text-[11px] font-bold text-[#0082CA] hover:underline cursor-pointer"
                  >
                    ارسال مجدد کد
                  </button>
                )}
              </div>
              <Input
                {...regReset("code")}
                placeholder="کد ۵ رقمی"
                dir="ltr"
                className="font-sans text-center tracking-widest text-base font-bold h-12 rounded-2xl border-sky-100 focus-visible:ring-[#0082CA]"
              />
              {resetErrors.code && (
                <p className="text-[11px] text-rose-500 mt-1">{resetErrors.code.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-[#0B192C] block mb-1.5">رمز عبور جدید</label>
              <div className="relative">
                <Input
                  {...regReset("newPassword")}
                  type={showPassword ? "text" : "password"}
                  placeholder="حداقل ۸ کاراکتر"
                  dir="ltr"
                  className="font-sans pl-10 h-12 rounded-2xl border-sky-100 focus-visible:ring-[#0082CA]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {resetErrors.newPassword && (
                <p className="text-[11px] text-rose-500 mt-1">{resetErrors.newPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-2xl bg-[#0082CA] hover:bg-[#006CA8] text-white font-bold shadow-lg shadow-[#0082CA]/25 mt-4"
            >
              {isLoading ? "در حال تغییر رمز..." : "ذخیره رمز عبور جدید"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setView("login");
                setActiveTab("login");
                setLoginMethod("password");
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-[#0082CA] mt-2 block"
            >
              بازگشت به صفحه ورود
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW: MAIN LOGIN & REGISTRATION                                */}
        {/* ------------------------------------------------------------- */}
        {view === "login" && (
          <div>
            {/* Primary Tabs: ورود vs ثبت‌نام جدید (Task 2: Emboldened Tabs) */}
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val as "login" | "register");
                setOtpStep("request");
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-6 bg-sky-50/90 p-1.5 rounded-2xl border border-sky-100/80">
                <TabsTrigger
                  value="login"
                  className="rounded-xl text-xs sm:text-sm font-extrabold py-2.5 transition-all data-[state=active]:bg-white data-[state=active]:text-[#0082CA] data-[state=active]:shadow-sm text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  ورود
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-xl text-xs sm:text-sm font-extrabold py-2.5 transition-all data-[state=active]:bg-white data-[state=active]:text-[#0082CA] data-[state=active]:shadow-sm text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  ثبت‌نام جدید
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: LOGIN (Password or OTP) */}
              <TabsContent value="login">
                {/* Method Switch: Password vs OTP */}
                <div className="flex items-center justify-center gap-2 mb-5">
                  <button
                    type="button"
                    onClick={() => setLoginMethod("password")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      loginMethod === "password"
                        ? "bg-[#0082CA] text-white shadow-sm shadow-[#0082CA]/25"
                        : "bg-sky-50/70 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ورود با رمز عبور
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod("otp");
                      setOtpStep("request");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      loginMethod === "otp"
                        ? "bg-[#0082CA] text-white shadow-sm shadow-[#0082CA]/25"
                        : "bg-sky-50/70 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ورود با پیامک (OTP)
                  </button>
                </div>

                {loginMethod === "password" ? (
                  <form onSubmit={handlePassLoginSubmit(onPasswordLogin)} noValidate className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-[#0B192C] block mb-1.5">
                        شماره موبایل
                      </label>
                      <div className="relative">
                        <Input
                          {...regPassLogin("phone")}
                          placeholder="09123456789"
                          dir="ltr"
                          className="font-sans pl-10 h-12 rounded-2xl border-sky-100 focus-visible:ring-[#0082CA]"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {passLoginErrors.phone && (
                        <p className="text-[11px] text-rose-500 mt-1">
                          {passLoginErrors.phone.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#0B192C]">رمز عبور</label>
                        <button
                          type="button"
                          onClick={() => {
                            const curPhone = (document.querySelector('input[name="phone"]') as HTMLInputElement)?.value || "";
                            handleStartResetPassword(curPhone);
                          }}
                          className="text-[11px] font-bold text-[#0082CA] hover:underline cursor-pointer"
                        >
                          فراموشی رمز عبور؟
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          {...regPassLogin("password")}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          dir="ltr"
                          className="font-sans pl-10 h-12 rounded-2xl border-sky-100 focus-visible:ring-[#0082CA]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passLoginErrors.password && (
                        <p className="text-[11px] text-rose-500 mt-1">
                          {passLoginErrors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-2xl bg-[#0082CA] hover:bg-[#006CA8] text-white font-bold shadow-lg shadow-[#0082CA]/25 text-sm cursor-pointer"
                    >
                      {isLoading ? "در حال ورود..." : "ورود به حساب کاربری"}
                    </Button>
                  </form>
                ) : (
                  /* OTP Login */
                  otpStep === "request" ? (
                    <form onSubmit={handleOtpReqSubmit(onRequestOtp)} noValidate className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-[#0B192C] block mb-1.5">
                          شماره موبایل
                        </label>
                        <div className="relative">
                          <Input
                            {...regOtpReq("phone")}
                            placeholder="09123456789"
                            dir="ltr"
                            className="font-sans pl-10 h-12 rounded-2xl border-sky-100 focus-visible:ring-[#0082CA] text-sm"
                          />
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        {otpReqErrors.phone && (
                          <p className="text-[11px] text-rose-500 mt-1">{otpReqErrors.phone.message}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 rounded-2xl bg-[#0082CA] hover:bg-[#006CA8] text-white font-bold shadow-lg shadow-[#0082CA]/25 text-sm cursor-pointer"
                      >
                        {isLoading ? "در حال ارسال..." : "دریافت کد تایید یک‌بار مصرف"}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleOtpVerSubmit(onVerifyOtp)} noValidate className="space-y-4">
                      <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-100 text-xs text-[#0B192C] flex items-center justify-between">
                        <span>
                          کد تایید به شماره <strong className="font-sans">{otpPhone}</strong> پیامک شد.
                        </span>
                        <button
                          type="button"
                          onClick={() => setOtpStep("request")}
                          className="text-[11px] font-bold text-[#0082CA] hover:underline cursor-pointer"
                        >
                          ویرایش شماره
                        </button>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#0B192C] block mb-1.5">
                          کد تایید ۵ رقمی
                        </label>
                        <Input
                          {...regOtpVer("code")}
                          placeholder="• • • • •"
                          dir="ltr"
                          autoFocus
                          maxLength={8}
                          className="font-sans text-center tracking-widest text-lg font-black h-12 rounded-2xl border-sky-100 focus-visible:ring-[#0082CA]"
                        />
                        {otpVerErrors.code && (
                          <p className="text-[11px] text-rose-500 mt-1">{otpVerErrors.code.message}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        {cooldown > 0 ? (
                          <span className="text-slate-400 font-sans text-[11px]">
                            ارسال مجدد تا {cooldown} ثانیه دیگر
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={onResendOtp}
                            className="text-[#0082CA] font-bold hover:underline cursor-pointer text-xs"
                          >
                            ارسال مجدد کد تایید
                          </button>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 rounded-2xl bg-[#0082CA] hover:bg-[#006CA8] text-white font-bold shadow-lg shadow-[#0082CA]/25 text-sm cursor-pointer"
                      >
                        {isLoading ? "در حال بررسی..." : "تایید و ورود"}
                      </Button>
                    </form>
                  )
                )}
              </TabsContent>

              {/* TAB 2: REGISTER (Task 3: Strictly via OTP) */}
              <TabsContent value="register">
                {otpStep === "request" ? (
                  <form onSubmit={handleOtpReqSubmit(onRequestOtp)} noValidate className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-100 text-xs text-slate-700 space-y-1">
                      <p className="font-bold text-[#0082CA] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#0082CA]" />
                        ثبت‌نام سریع با شماره موبایل
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        ثبت‌نام در فروشگاه ماوی با پیامک تایید (OTP) انجام می‌شود. پس از ورود، می‌توانید رمز عبور و اطلاعات پروفایل خود را تکمیل نمایید.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#0B192C] block mb-1.5">
                        شماره موبایل
                      </label>
                      <div className="relative">
                        <Input
                          {...regOtpReq("phone")}
                          placeholder="09123456789"
                          dir="ltr"
                          className="font-sans pl-10 h-12 rounded-2xl border-sky-100 focus-visible:ring-[#0082CA] text-sm"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {otpReqErrors.phone && (
                        <p className="text-[11px] text-rose-500 mt-1">{otpReqErrors.phone.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-2xl bg-[#0082CA] hover:bg-[#006CA8] text-white font-bold shadow-lg shadow-[#0082CA]/25 text-sm cursor-pointer"
                    >
                      {isLoading ? "در حال ارسال..." : "دریافت کد تایید ثبت‌نام"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleOtpVerSubmit(onVerifyOtp)} noValidate className="space-y-4">
                    <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-100 text-xs text-[#0B192C] flex items-center justify-between">
                      <span>
                        کد تایید به شماره <strong className="font-sans">{otpPhone}</strong> پیامک شد.
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtpStep("request")}
                        className="text-[11px] font-bold text-[#0082CA] hover:underline cursor-pointer"
                      >
                        ویرایش شماره
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#0B192C] block mb-1.5">
                        کد تایید ۵ رقمی
                      </label>
                      <Input
                        {...regOtpVer("code")}
                        placeholder="• • • • •"
                        dir="ltr"
                        autoFocus
                        maxLength={8}
                        className="font-sans text-center tracking-widest text-lg font-black h-12 rounded-2xl border-sky-100 focus-visible:ring-[#0082CA]"
                      />
                      {otpVerErrors.code && (
                        <p className="text-[11px] text-rose-500 mt-1">{otpVerErrors.code.message}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      {cooldown > 0 ? (
                        <span className="text-slate-400 font-sans text-[11px]">
                          ارسال مجدد تا {cooldown} ثانیه دیگر
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={onResendOtp}
                          className="text-[#0082CA] font-bold hover:underline cursor-pointer text-xs"
                        >
                          ارسال مجدد کد تایید
                        </button>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-2xl bg-[#0082CA] hover:bg-[#006CA8] text-white font-bold shadow-lg shadow-[#0082CA]/25 text-sm cursor-pointer"
                    >
                      {isLoading ? "در حال بررسی..." : "تایید و تکمیل ثبت‌نام"}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Brand Guarantee Note */}
        <div className="mt-8 pt-6 border-t border-sky-50 text-center">
          <p className="text-[11px] text-slate-400">
            ورود شما به منزله پذیرش{" "}
            <a href="/pages/terms" className="text-[#0082CA] font-semibold hover:underline">
              قوانین و مقررات
            </a>{" "}
            فروشگاه ماوی است.
          </p>
        </div>
      </motion.div>
    </div>
  );
}