"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Eye,
  EyeOff,
  Phone,
  ShieldCheck,
  RotateCw,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageSlider } from "@/components/ui/image-slider";
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

const passwordValidator = z
  .string()
  .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
  .max(128, "رمز عبور نباید بیشتر از ۱۲۸ کاراکتر باشد");

// 1. Login Schema
const loginSchema = z.object({
  phone: phoneValidator,
  password: z.string().min(1, "رمز عبور را وارد کنید"),
});

// 2. Signup Step 1: Phone Request
const signupStep1Schema = z.object({
  phone: phoneValidator,
});

// 3. Signup Step 2: OTP Verification
const signupStep2Schema = z.object({
  code: z
    .string()
    .transform(normalizePersianDigits)
    .pipe(z.string().min(4, "کد تایید حداقل ۴ رقم است").max(8, "کد تایید نامعتبر است")),
});

// 4. Signup Step 3: Complete Profile (First name, Last name, Password, Confirm Password)
const signupStep3Schema = z
  .object({
    firstName: z
      .string()
      .min(2, "نام باید حداقل ۲ حرف باشد")
      .max(50, "نام نباید بیشتر از ۵۰ حرف باشد"),
    lastName: z
      .string()
      .min(2, "نام خانوادگی باید حداقل ۲ حرف باشد")
      .max(50, "نام خانوادگی نباید بیشتر از ۵۰ حرف باشد"),
    password: passwordValidator,
    confirmPassword: z.string().min(1, "تکرار رمز عبور را وارد کنید"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "تکرار رمز عبور با رمز عبور مطابقت ندارد",
    path: ["confirmPassword"],
  });

// 5. Reset Step 1: Phone Request
const resetStep1Schema = z.object({
  phone: phoneValidator,
});

// 6. Reset Step 2: OTP + New Password + Confirm Password
const resetStep2Schema = z
  .object({
    code: z
      .string()
      .transform(normalizePersianDigits)
      .pipe(z.string().min(4, "کد تایید حداقل ۴ رقم است").max(8, "کد تایید نامعتبر است")),
    newPassword: passwordValidator,
    confirmNewPassword: z.string().min(1, "تکرار رمز عبور جدید را وارد کنید"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "تکرار رمز عبور جدید مطابقت ندارد",
    path: ["confirmNewPassword"],
  });

type LoginForm = z.infer<typeof loginSchema>;
type SignupStep1Form = z.infer<typeof signupStep1Schema>;
type SignupStep2Form = z.infer<typeof signupStep2Schema>;
type SignupStep3Form = z.infer<typeof signupStep3Schema>;
type ResetStep1Form = z.infer<typeof resetStep1Schema>;
type ResetStep2Form = z.infer<typeof resetStep2Schema>;

type ViewState =
  | "login"
  | "signup-step1"
  | "signup-step2"
  | "signup-step3"
  | "reset-step1"
  | "reset-step2";

const SLIDER_IMAGES = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop",
];

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewState>("login");
  const [isLoading, setIsLoading] = useState(false);

  // Stored state between steps
  const [signupPhone, setSignupPhone] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [resetPhone, setResetPhone] = useState("");

  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mergeCart } = useCart();

  // Form Hooks
  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const signupStep1Form = useForm<SignupStep1Form>({ resolver: zodResolver(signupStep1Schema) });
  const signupStep2Form = useForm<SignupStep2Form>({ resolver: zodResolver(signupStep2Schema) });
  const signupStep3Form = useForm<SignupStep3Form>({ resolver: zodResolver(signupStep3Schema) });
  const resetStep1Form = useForm<ResetStep1Form>({ resolver: zodResolver(resetStep1Schema) });
  const resetStep2Form = useForm<ResetStep2Form>({ resolver: zodResolver(resetStep2Schema) });

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Session Finish & Navigation
  const finishLogin = async (data: { access: string; refresh?: string; user?: any }) => {
    setAuthSession(data);
    try {
      await mergeCart();
      await useWishlist.getState().fetchWishlist();
    } catch {}

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

  // 1. Returning User: Phone + Password Login
  const onLoginSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    const normalizedPhone = normalizePersianDigits(data.phone);
    try {
      const res = await api.post("/api/auth/login/", {
        phone_number: normalizedPhone,
        password: data.password,
      });
      await finishLogin(res.data);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "شماره موبایل یا رمز عبور اشتباه است"));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Signup Step 1: Request OTP
  const onSignupStep1Submit = async (data: SignupStep1Form) => {
    setIsLoading(true);
    const normalized = normalizePersianDigits(data.phone);
    try {
      await api.post("/api/auth/otp/request/", {
        phone_number: normalized,
        purpose: "signup",
      });
      setSignupPhone(normalized);
      setCooldown(60);
      setView("signup-step2");
      toast.success("کد تایید ۵ رقمی پیامک شد", {
        description: `کد تایید به شماره ${normalized} ارسال گردید.`,
      });
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "خطا در ارسال پیامک کد تایید"));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Signup Step 2: Verify OTP
  const onSignupStep2Submit = async (data: SignupStep2Form) => {
    setIsLoading(true);
    const code = normalizePersianDigits(data.code);
    try {
      const res = await api.post("/api/auth/otp/verify/", {
        phone_number: signupPhone,
        code: code,
        purpose: "signup",
      });
      setSignupToken(res.data?.signup_token || "");
      setView("signup-step3");
      toast.success("شماره موبایل با موفقیت تایید شد", {
        description: "اکنون نام و رمز عبور دلخواه خود را تعیین نمایید.",
      });
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "کد تایید نامعتبر یا منقضی شده است"));
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Signup Step 3: Complete Registration & Auto-login
  const onSignupStep3Submit = async (data: SignupStep3Form) => {
    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/signup/complete/", {
        phone_number: signupPhone,
        signup_token: signupToken,
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        password: data.password,
        password_confirm: data.confirmPassword,
      });
      toast.success("ثبت‌نام با موفقیت انجام شد", {
        description: "حساب کاربری شما ایجاد گردید و وارد شدید.",
      });
      await finishLogin(res.data);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "خطا در تکمیل ثبت‌نام"));
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Reset Step 1: Request Password Reset OTP
  const onResetStep1Submit = async (data: ResetStep1Form) => {
    setIsLoading(true);
    const normalized = normalizePersianDigits(data.phone);
    try {
      await api.post("/api/auth/otp/request/", {
        phone_number: normalized,
        purpose: "reset",
      });
      setResetPhone(normalized);
      setCooldown(60);
      setView("reset-step2");
      toast.success("کد تایید بازیابی پیامک شد");
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "خطا در ارسال کد تایید بازیابی"));
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Reset Step 2: Set New Password via OTP
  const onResetStep2Submit = async (data: ResetStep2Form) => {
    setIsLoading(true);
    const code = normalizePersianDigits(data.code);
    try {
      await api.post("/api/auth/password-reset-otp/", {
        phone_number: resetPhone,
        code: code,
        new_password: data.newPassword,
        new_password_confirm: data.confirmNewPassword,
      });
      toast.success("رمز عبور با موفقیت تغییر کرد", {
        description: "اکنون می‌توانید با رمز عبور جدید وارد شوید.",
      });
      loginForm.setValue("phone", resetPhone);
      setView("login");
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "کد تایید اشتباه است یا منقضی شده"));
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP for either signup or reset
  const onResendOtp = async (purpose: "signup" | "reset") => {
    const targetPhone = purpose === "signup" ? signupPhone : resetPhone;
    if (cooldown > 0 || !targetPhone) return;
    setIsLoading(true);
    try {
      await api.post("/api/auth/otp/request/", {
        phone_number: targetPhone,
        purpose,
      });
      setCooldown(60);
      toast.success("کد تایید مجدداً ارسال گردید");
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, "خطا در ارسال مجدد کد تایید"));
    } finally {
      setIsLoading(false);
    }
  };

  const formVariants: Variants = {
    hidden: { opacity: 0, x: -16 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
    exit: { opacity: 0, x: 16, transition: { duration: 0.2, ease: "easeIn" } },
  };

  return (
    <div
      className="w-full min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 sm:p-6 md:p-8"
      dir="rtl"
    >
      {/* Background Subtle Gradient Blobs */}
      <div className="fixed top-12 right-12 w-96 h-96 bg-[#0082CA]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-12 left-12 w-96 h-96 bg-[#0091DF]/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        className="w-full max-w-5xl min-h-[660px] grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl shadow-sky-950/10 border border-sky-100 bg-white relative z-10"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {/* Right side (Column 1 in RTL): Luxury Image Slider */}
        <div className="hidden lg:block relative h-full min-h-[660px] bg-slate-950 overflow-hidden">
          <ImageSlider images={SLIDER_IMAGES} interval={4500}>
            {/* Elegant Dark Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 pointer-events-none" />

            {/* Editorial Brand Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-8 sm:p-10 text-white z-10 space-y-3 pointer-events-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-medium tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>کالکشن تخصصی مد و پوشاک فاخر ماوی</span>
              </div>
              <h2 className="text-2xl xl:text-3xl font-black leading-tight tracking-tight text-white drop-shadow-sm">
                اصالت مدیترانه‌ای، کیفیت ماندگار
              </h2>
              <p className="text-sm text-white/80 leading-relaxed font-light">
                از طراحی مدرن تا دوخت اختصاصی؛ تجربه‌ای متمایز از انتخاب استایل و پوشاک خاص برای شما.
              </p>
            </div>
          </ImageSlider>
        </div>

        {/* Left side (Column 2 in RTL): Interactive Authentication Flow Card */}
        <div className="w-full h-full bg-white flex flex-col justify-between p-6 sm:p-10 md:p-12">
          {/* Header Brand Badge */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#0082CA] text-white flex items-center justify-center shadow-md shadow-[#0082CA]/25">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-black text-[#0B192C] tracking-wide block">
                  ماوی • MAVI
                </span>
                <span className="text-[11px] text-slate-400 block">فروشگاه پوشاک و مد فاخر</span>
              </div>
            </div>

            {/* Top Navigation Hints */}
            {view !== "login" && (
              <button
                type="button"
                onClick={() => setView("login")}
                className="text-xs font-bold text-[#0082CA] hover:text-[#006CA8] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>بازگشت به ورود</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dynamic Form Area with Framer Motion AnimatePresence */}
          <div className="flex-1 flex flex-col justify-center my-auto">
            <AnimatePresence mode="wait">
              {/* ------------------------------------------------------------- */}
              {/* VIEW: LOGIN (Phone + Password for Returning Users)             */}
              {/* ------------------------------------------------------------- */}
              {view === "login" && (
                <motion.div
                  key="login"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="space-y-1.5">
                    <h1 className="text-2xl font-black text-[#0B192C]">ورود به حساب کاربری</h1>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      شماره موبایل و رمز عبور خود را برای ورود به حساب ماوی وارد نمایید.
                    </p>
                  </div>

                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    noValidate
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="login-phone" className="text-xs font-bold text-[#0B192C]">
                        شماره موبایل
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-phone"
                          {...loginForm.register("phone")}
                          placeholder="09123456789"
                          dir="ltr"
                          className="font-sans pl-10 h-12 rounded-xl border-sky-100 bg-sky-50/20 focus-visible:ring-[#0082CA] text-sm"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {loginForm.formState.errors.phone && (
                        <p className="text-[11px] text-rose-500">
                          {loginForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="login-password"
                          className="text-xs font-bold text-[#0B192C]"
                        >
                          رمز عبور
                        </Label>
                        <button
                          type="button"
                          onClick={() => {
                            const curPhone = loginForm.getValues("phone");
                            if (curPhone) resetStep1Form.setValue("phone", curPhone);
                            setView("reset-step1");
                          }}
                          className="text-xs font-bold text-[#0082CA] hover:underline cursor-pointer"
                        >
                          فراموشی رمز عبور؟
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          {...loginForm.register("password")}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          dir="ltr"
                          className="font-sans pl-10 h-12 rounded-xl border-sky-100 bg-sky-50/20 focus-visible:ring-[#0082CA] text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-[11px] text-rose-500">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-[#0082CA] hover:bg-[#0091DF] text-white font-bold text-sm shadow-md shadow-[#0082CA]/20 transition-all cursor-pointer"
                    >
                      {isLoading ? "در حال بررسی..." : "ورود به حساب کاربری"}
                    </Button>
                  </form>

                  <div className="pt-2 text-center text-xs text-slate-500">
                    <span>حساب کاربری ندارید؟ </span>
                    <button
                      type="button"
                      onClick={() => setView("signup-step1")}
                      className="font-bold text-[#0082CA] hover:underline cursor-pointer mr-1"
                    >
                      ثبت‌نام جدید در ماوی
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* VIEW: SIGNUP STEP 1 (Enter Phone Number)                      */}
              {/* ------------------------------------------------------------- */}
              {view === "signup-step1" && (
                <motion.div
                  key="signup-step1"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-[#0082CA] text-[11px] font-bold border border-sky-100 mb-1">
                      <span>مرحله ۱ از ۳: تایید شماره موبایل</span>
                    </div>
                    <h1 className="text-2xl font-black text-[#0B192C]">ثبت‌نام در ماوی</h1>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      شماره موبایل خود را وارد کنید تا کد تایید یک‌بار مصرف برایتان پیامک شود.
                    </p>
                  </div>

                  <form
                    onSubmit={signupStep1Form.handleSubmit(onSignupStep1Submit)}
                    noValidate
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-phone" className="text-xs font-bold text-[#0B192C]">
                        شماره موبایل
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-phone"
                          {...signupStep1Form.register("phone")}
                          placeholder="09123456789"
                          dir="ltr"
                          className="font-sans pl-10 h-12 rounded-xl border-sky-100 bg-sky-50/20 focus-visible:ring-[#0082CA] text-sm"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {signupStep1Form.formState.errors.phone && (
                        <p className="text-[11px] text-rose-500">
                          {signupStep1Form.formState.errors.phone.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-[#0082CA] hover:bg-[#0091DF] text-white font-bold text-sm shadow-md shadow-[#0082CA]/20 transition-all cursor-pointer"
                    >
                      {isLoading ? "در حال ارسال کد..." : "دریافت کد تایید"}
                    </Button>
                  </form>

                  <div className="pt-2 text-center text-xs text-slate-500">
                    <span>قبلاً حساب کاربری داشته‌اید؟ </span>
                    <button
                      type="button"
                      onClick={() => setView("login")}
                      className="font-bold text-[#0082CA] hover:underline cursor-pointer mr-1"
                    >
                      ورود به حساب
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* VIEW: SIGNUP STEP 2 (Verify OTP)                              */}
              {/* ------------------------------------------------------------- */}
              {view === "signup-step2" && (
                <motion.div
                  key="signup-step2"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-[#0082CA] text-[11px] font-bold border border-sky-100 mb-1">
                      <span>مرحله ۲ از ۳: تایید کد پیامکی</span>
                    </div>
                    <h1 className="text-2xl font-black text-[#0B192C]">کد تایید را وارد نمایید</h1>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      کد ۵ رقمی ارسال‌شده به شماره <strong className="font-sans text-[#0B192C]">{signupPhone}</strong> را وارد فرمایید.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 text-xs text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-[#0082CA]" />
                      شماره: <strong className="font-sans text-[#0B192C]">{signupPhone}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setView("signup-step1")}
                      className="text-xs font-bold text-[#0082CA] hover:underline cursor-pointer"
                    >
                      ویرایش شماره
                    </button>
                  </div>

                  <form
                    onSubmit={signupStep2Form.handleSubmit(onSignupStep2Submit)}
                    noValidate
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-otp" className="text-xs font-bold text-[#0B192C]">
                        کد تایید ۵ رقمی
                      </Label>
                      <Input
                        id="signup-otp"
                        {...signupStep2Form.register("code")}
                        placeholder="• • • • •"
                        dir="ltr"
                        autoFocus
                        maxLength={8}
                        className="font-sans text-center tracking-widest text-xl font-black h-14 rounded-xl border-sky-100 bg-sky-50/20 focus-visible:ring-[#0082CA]"
                      />
                      {signupStep2Form.formState.errors.code && (
                        <p className="text-[11px] text-rose-500">
                          {signupStep2Form.formState.errors.code.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      {cooldown > 0 ? (
                        <span className="text-slate-400 font-sans text-xs">
                          ارسال مجدد تا {cooldown} ثانیه دیگر
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onResendOtp("signup")}
                          className="text-[#0082CA] font-bold hover:underline cursor-pointer text-xs flex items-center gap-1"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>ارسال مجدد کد تایید</span>
                        </button>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-[#0082CA] hover:bg-[#0091DF] text-white font-bold text-sm shadow-md shadow-[#0082CA]/20 transition-all cursor-pointer"
                    >
                      {isLoading ? "در حال بررسی..." : "تایید و مرحله بعد"}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* VIEW: SIGNUP STEP 3 (Name + Password + Auto Login)             */}
              {/* ------------------------------------------------------------- */}
              {view === "signup-step3" && (
                <motion.div
                  key="signup-step3"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-5"
                >
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>شماره موبایل تایید شد • مرحله پایانی</span>
                    </div>
                    <h1 className="text-2xl font-black text-[#0B192C]">تکمیل مشخصات حساب</h1>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      نام، نام خانوادگی و رمز عبور دلخواه خود را برای ورود به سیستم ثبت فرمایید.
                    </p>
                  </div>

                  <form
                    onSubmit={signupStep3Form.handleSubmit(onSignupStep3Submit)}
                    noValidate
                    className="space-y-3.5"
                  >
                    {/* First Name & Last Name in Two Separate Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-first-name" className="text-xs font-bold text-[#0B192C]">
                          نام
                        </Label>
                        <div className="relative">
                          <Input
                            id="signup-first-name"
                            {...signupStep3Form.register("firstName")}
                            placeholder="مثال: سارا"
                            className="h-11 rounded-xl border-sky-100 bg-sky-50/20 focus-visible:ring-[#0082CA] text-sm"
                          />
                        </div>
                        {signupStep3Form.formState.errors.firstName && (
                          <p className="text-[11px] text-rose-500">
                            {signupStep3Form.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-last-name" className="text-xs font-bold text-[#0B192C]">
                          نام خانوادگی
                        </Label>
                        <div className="relative">
                          <Input
                            id="signup-last-name"
                            {...signupStep3Form.register("lastName")}
                            placeholder="مثال: محمدی"
                            className="h-11 rounded-xl border-sky-100 bg-sky-50/20 focus-visible:ring-[#0082CA] text-sm"
                          />
                        </div>
                        {signupStep3Form.formState.errors.lastName && (
                          <p className="text-[11px] text-rose-500">
                            {signupStep3Form.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-xs font-bold text-[#0B192C]">
                        رمز عبور (حداقل ۸ کاراکتر)
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          {...signupStep3Form.register("password")}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          dir="ltr"
                          className="font-sans pl-10 h-11 rounded-xl border-sky-100 bg-sky-50/20 focus-visible:ring-[#0082CA] text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {signupStep3Form.formState.errors.password && (
                        <p className="text-[11px] text-rose-500">
                          {signupStep3Form.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="signup-confirm-password"
                        className="text-xs font-bold text-[#0B192C]"
                      >
                        تکرار رمز عبور
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-confirm-password"
                          {...signupStep3Form.register("confirmPassword")}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          dir="ltr"
                          className="font-sans pl-10 h-11 rounded-xl border-sky-100 bg-sky-50/20 focus-visible:ring-[#0082CA] text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label={showConfirmPassword ? "مخفی کردن تکرار رمز عبور" : "نمایش تکرار رمز عبور"}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {signupStep3Form.formState.errors.confirmPassword && (
                        <p className="text-[11px] text-rose-500">
                          {signupStep3Form.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-[#0082CA] hover:bg-[#0091DF] text-white font-bold text-sm shadow-md shadow-[#0082CA]/20 transition-all cursor-pointer mt-2"
                    >
                      {isLoading ? "در حال ایجاد حساب..." : "تکمیل ثبت‌نام و ورود به ماوی"}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* VIEW: RESET STEP 1 (Request Password Reset OTP)               */}
              {/* ------------------------------------------------------------- */}
              {view === "reset-step1" && (
                <motion.div
                  key="reset-step1"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 mb-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>بازیابی رمز عبور</span>
                    </div>
                    <h1 className="text-2xl font-black text-[#0B192C]">فراموشی رمز عبور</h1>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      شماره موبایل حسابتان را وارد فرمایید تا کد تایید بازیابی برایتان پیامک شود.
                    </p>
                  </div>

                  <form
                    onSubmit={resetStep1Form.handleSubmit(onResetStep1Submit)}
                    noValidate
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="reset-phone" className="text-xs font-bold text-[#0B192C]">
                        شماره موبایل
                      </Label>
                      <div className="relative">
                        <Input
                          id="reset-phone"
                          {...resetStep1Form.register("phone")}
                          placeholder="09123456789"
                          dir="ltr"
                          className="font-sans pl-10 h-12 rounded-xl border-sky-100 bg-sky-50/20 focus-visible:ring-[#0082CA] text-sm"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {resetStep1Form.formState.errors.phone && (
                        <p className="text-[11px] text-rose-500">
                          {resetStep1Form.formState.errors.phone.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-[#0082CA] hover:bg-[#0091DF] text-white font-bold text-sm shadow-md shadow-[#0082CA]/20 transition-all cursor-pointer"
                    >
                      {isLoading ? "در حال ارسال..." : "ارسال کد بازیابی"}
                    </Button>
                  </form>

                  <div className="pt-2 text-center text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => setView("login")}
                      className="font-bold text-[#0082CA] hover:underline cursor-pointer"
                    >
                      بازگشت به صفحه ورود
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* VIEW: RESET STEP 2 (Enter OTP + New Password)                 */}
              {/* ------------------------------------------------------------- */}
              {view === "reset-step2" && (
                <motion.div
                  key="reset-step2"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-5"
                >
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 mb-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>تغییر رمز عبور</span>
                    </div>
                    <h1 className="text-2xl font-black text-[#0B192C]">تعیین رمز عبور جدید</h1>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      کد تایید ارسال‌شده به شماره <strong className="font-sans text-[#0B192C]">{resetPhone}</strong> و رمز جدید خود را وارد کنید.
                    </p>
                  </div>

                  <form
                    onSubmit={resetStep2Form.handleSubmit(onResetStep2Submit)}
                    noValidate
                    className="space-y-3.5"
                  >
                    {/* OTP Code */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="reset-otp" className="text-xs font-bold text-[#0B192C]">
                          کد تایید ۵ رقمی
                        </Label>
                        {cooldown > 0 ? (
                          <span className="text-[11px] text-slate-400 font-sans">
                            ارسال مجدد تا {cooldown} ثانیه
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onResendOtp("reset")}
                            className="text-[11px] font-bold text-[#0082CA] hover:underline cursor-pointer"
                          >
                            ارسال مجدد کد
                          </button>
                        )}
                      </div>
                      <Input
                        id="reset-otp"
                        {...resetStep2Form.register("code")}
                        placeholder="• • • • •"
                        dir="ltr"
                        autoFocus
                        maxLength={8}
                        className="font-sans text-center tracking-widest text-lg font-black h-12 rounded-xl border-sky-100 bg-sky-50/20 focus-visible:ring-[#0082CA]"
                      />
                      {resetStep2Form.formState.errors.code && (
                        <p className="text-[11px] text-rose-500">
                          {resetStep2Form.formState.errors.code.message}
                        </p>
                      )}
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="reset-new-password" className="text-xs font-bold text-[#0B192C]">
                        رمز عبور جدید (حداقل ۸ کاراکتر)
                      </Label>
                      <div className="relative">
                        <Input
                          id="reset-new-password"
                          {...resetStep2Form.register("newPassword")}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          dir="ltr"
                          className="font-sans pl-10 h-11 rounded-xl border-sky-100 bg-sky-50/20 focus-visible:ring-[#0082CA] text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {resetStep2Form.formState.errors.newPassword && (
                        <p className="text-[11px] text-rose-500">
                          {resetStep2Form.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="reset-confirm-password"
                        className="text-xs font-bold text-[#0B192C]"
                      >
                        تکرار رمز عبور جدید
                      </Label>
                      <div className="relative">
                        <Input
                          id="reset-confirm-password"
                          {...resetStep2Form.register("confirmNewPassword")}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          dir="ltr"
                          className="font-sans pl-10 h-11 rounded-xl border-sky-100 bg-sky-50/20 focus-visible:ring-[#0082CA] text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label={showConfirmPassword ? "مخفی کردن تکرار رمز عبور" : "نمایش تکرار رمز عبور"}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {resetStep2Form.formState.errors.confirmNewPassword && (
                        <p className="text-[11px] text-rose-500">
                          {resetStep2Form.formState.errors.confirmNewPassword.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-[#0082CA] hover:bg-[#0091DF] text-white font-bold text-sm shadow-md shadow-[#0082CA]/20 transition-all cursor-pointer mt-2"
                    >
                      {isLoading ? "در حال تغییر رمز..." : "ذخیره رمز عبور و بازگشت به ورود"}
                    </Button>
                  </form>

                  <div className="pt-2 text-center text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => setView("login")}
                      className="font-bold text-[#0082CA] hover:underline cursor-pointer"
                    >
                      انصراف و بازگشت به ورود
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Terms */}
          <div className="pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ورود یا ثبت‌نام شما به منزله پذیرش{" "}
              <a href="/pages/terms" className="text-[#0082CA] font-semibold hover:underline">
                قوانین و حریم خصوصی
              </a>{" "}
              فروشگاه ماوی است.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}