'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { cn, normalizePersianDigits } from "@/lib/utils";
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff,  
  Shield,
  AlertTriangle,
  KeyRound,
  Phone,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { AuthTabs } from "@/components/ui/auth-tabs";

// Types
export type AuthMode = 'login' | 'signup' | 'reset';
export type RegistrationStep = 'details' | 'verification' | 'complete';

export interface AuthFormProps {
  /**
   * Callback triggered when authentication is successful
   */
  onSuccess?: (userData: { phone: string; name?: string }) => void;
  /**
   * Callback triggered when the form should close
   */
  onClose?: () => void;
  /**
   * Initial authentication mode
   * @default 'login'
   */
  initialMode?: AuthMode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export interface FormData {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  rememberMe: boolean;
  verificationCode: string;
}

export interface FormErrors {
  name?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
  rememberMe?: string;
  verificationCode?: string;
  general?: string;
  [key: string]: string | undefined;
}

// Password strength utility
export interface PasswordStrength {
  score: number;
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export const calculatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const feedback: string[] = [];

  if (!requirements.length) feedback.push('حداقل ۸ کاراکتر');
  if (!requirements.uppercase) feedback.push('حداقل یک حرف بزرگ انگلیسی');
  if (!requirements.lowercase) feedback.push('حداقل یک حرف کوچک انگلیسی');
  if (!requirements.number) feedback.push('حداقل یک عدد');
  if (!requirements.special) feedback.push('حداقل یک نماد ویژه (@#$...)');

  return { score, feedback, requirements };
};

// Password Strength Indicator Component
export const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const strength = calculatePasswordStrength(password);
  
  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-rose-500';
    if (score <= 2) return 'bg-amber-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-sky-500';
    return 'bg-emerald-500';
  };

  const getStrengthText = (score: number) => {
    if (score <= 1) return 'بسیار ضعیف';
    if (score <= 2) return 'ضعیف';
    if (score <= 3) return 'متوسط';
    if (score <= 4) return 'خوب';
    return 'بسیار قوی';
  };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2 animate-in fade-in-50 slide-in-from-bottom-1" dir="rtl">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full ${getStrengthColor(strength.score)} transition-all duration-300 rounded-full`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <span className="text-[11px] font-bold text-slate-500 min-w-[65px] text-left">
          {getStrengthText(strength.score)}
        </span>
      </div>
      {strength.feedback.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {strength.feedback.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium"
            >
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * AuthForm - A comprehensive authentication form component for phone + password authentication
 */
export function AuthForm({
  onSuccess,
  onClose,
  initialMode = 'login',
  className,
}: AuthFormProps) {
  // State
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('details');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    rememberMe: false,
    verificationCode: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});

  // Load saved phone on mount
  React.useEffect(() => {
    const savedPhone = localStorage.getItem('userPhone');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    if (savedPhone && authMode === 'login') {
      setFormData(prev => ({ ...prev, phone: savedPhone, rememberMe }));
    }
  }, [authMode]);

  // Field validation
  const validateField = useCallback((field: keyof FormData, value: string | boolean) => {
    let error = '';
    
    switch (field) {
      case 'name':
        if (typeof value === 'string' && authMode === 'signup' && !value.trim()) {
          error = 'نام و نام خانوادگی الزامی است';
        }
        break;
        
      case 'phone':
        if (!value || (typeof value === 'string' && !value.trim())) {
          error = 'شماره موبایل الزامی است';
        } else if (typeof value === 'string') {
          const norm = normalizePersianDigits(value);
          if (!/^09\d{9}$/.test(norm)) {
            error = 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد (مثال: 09123456789)';
          }
        }
        break;
        
      case 'password':
        if (!value) {
          error = 'رمز عبور الزامی است';
        } else if (typeof value === 'string') {
          if (value.length < 8) {
            error = 'رمز عبور باید حداقل ۸ کاراکتر باشد';
          } else if (authMode === 'signup') {
            const strength = calculatePasswordStrength(value);
            if (strength.score < 2) {
              error = 'رمز عبور بسیار ضعیف است';
            }
          }
        }
        break;
        
      case 'confirmPassword':
        if (authMode === 'signup' && value !== formData.password) {
          error = 'تکرار رمز عبور با رمز عبور مطابقت ندارد';
        }
        break;
        
      case 'verificationCode':
        if (typeof value === 'string' && authMode === 'signup' && registrationStep === 'verification') {
          const norm = normalizePersianDigits(value);
          if (!/^\d{4,8}$/.test(norm)) {
            error = 'کد تایید پیامکی نامعتبر است';
          }
        }
        break;
        
      case 'agreeToTerms':
        if (authMode === 'signup' && !value) {
          error = 'پذیرش قوانین و شرایط الزامی است';
        }
        break;
    }
    
    return error;
  }, [formData.password, authMode, registrationStep]);

  // Handle input changes with real-time validation
  const handleInputChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (fieldTouched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }
  }, [fieldTouched, validateField]);

  // Handle field blur (mark as touched)
  const handleFieldBlur = useCallback((field: keyof FormData) => {
    setFieldTouched(prev => ({ ...prev, [field]: true }));
    const value = formData[field];
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  }, [formData, validateField]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    const fieldsToValidate: (keyof FormData)[] = ['phone', 'password'];
    
    if (authMode === 'signup') {
      fieldsToValidate.push('name', 'confirmPassword', 'agreeToTerms');
    }
    
    if (registrationStep === 'verification') {
      fieldsToValidate.push('verificationCode');
    }

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [authMode, registrationStep, formData, validateField]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulated processing

      if (authMode === 'login') {
        if (formData.rememberMe) {
          localStorage.setItem('userPhone', formData.phone);
          localStorage.setItem('rememberMe', 'true');
        }
        
        setSuccessMessage('ورود با موفقیت انجام شد');
        onSuccess?.({ phone: formData.phone });
        
      } else if (authMode === 'signup') {
        if (registrationStep === 'details') {
          setRegistrationStep('verification');
          setSuccessMessage('کد تایید پیامکی ارسال شد');
        } else if (registrationStep === 'verification') {
          setRegistrationStep('complete');
          setSuccessMessage('ثبت‌نام با موفقیت انجام شد');
          onSuccess?.({ phone: formData.phone, name: formData.name });
        }
        
      } else if (authMode === 'reset') {
        setSuccessMessage('کد بازیابی ارسال گردید');
        setTimeout(() => setAuthMode('login'), 2000);
      }
      
    } catch {
      setErrors({ 
        general: 'خطایی رخ داد. لطفاً دوباره تلاش نمایید.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render auth form content based on mode and step
  const renderAuthContent = () => {
    // Password reset form
    if (authMode === 'reset') {
      return (
        <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5" dir="rtl">
          <div className="text-center mb-6">
            <KeyRound className="h-12 w-12 text-[#0082CA] mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2 text-[#0B192C]">بازیابی رمز عبور</h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              شماره موبایل خود را وارد کنید تا کد تایید برایتان ارسال شود.
            </p>
          </div>

          <div>
            <div className="relative">
              <Phone className="absolute right-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="tel"
                placeholder="09123456789"
                dir="ltr"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={() => handleFieldBlur('phone')}
                className={cn(
                  "w-full pr-11 pl-4 py-3 bg-slate-50 border rounded-xl placeholder:text-slate-400 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#0082CA]/20 transition-all",
                  errors.phone ? "border-rose-500" : "border-slate-200"
                )}
                aria-label="شماره موبایل"
              />
              {errors.phone && (
                <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !formData.phone}
            className={cn(
              "w-full bg-[#0082CA] hover:bg-[#0091DF] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-[#0082CA]/20 cursor-pointer",
              "disabled:opacity-50"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <KeyRound className="h-5 w-5" />
                  ارسال کد بازیابی
                </>
              )}
            </span>
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className="text-[#0082CA] hover:underline text-xs font-bold transition-colors cursor-pointer"
            >
              بازگشت به ورود
            </button>
          </div>
        </div>
      );
    }

    // OTP verification step
    if (authMode === 'signup' && registrationStep === 'verification') {
      return (
        <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5" dir="rtl">
          <div className="text-center mb-6">
            <Phone className="h-12 w-12 text-[#0082CA] mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2 text-[#0B192C]">تایید شماره موبایل</h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              کد ارسال شده به شماره <span className="font-sans font-bold text-[#0B192C]">{formData.phone}</span> را وارد کنید
            </p>
          </div>

          <div>
            <div className="relative">
              <input
                type="text"
                placeholder="• • • • •"
                value={formData.verificationCode}
                onChange={(e) => {
                  const value = normalizePersianDigits(e.target.value).replace(/\D/g, '').slice(0, 8);
                  handleInputChange('verificationCode', value);
                }}
                onBlur={() => handleFieldBlur('verificationCode')}
                className={cn(
                  "w-full text-center py-3 px-4 bg-slate-50 border rounded-xl text-2xl font-sans tracking-widest placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0082CA]/20 transition-all",
                  errors.verificationCode ? "border-rose-500" : "border-slate-200"
                )}
                dir="ltr"
                maxLength={8}
                aria-label="کد تایید"
              />
              {errors.verificationCode && (
                <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1 justify-center">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.verificationCode}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || formData.verificationCode.length < 4}
            className={cn(
              "w-full bg-[#0082CA] hover:bg-[#0091DF] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-[#0082CA]/20 cursor-pointer",
              "disabled:opacity-50"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "تایید شماره موبایل"}
            </span>
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setRegistrationStep('details')}
              className="text-[#0082CA] hover:underline text-xs font-bold transition-colors cursor-pointer"
            >
              ویرایش شماره موبایل
            </button>
          </div>
        </div>
      );
    }

    // Complete step
    if (authMode === 'signup' && registrationStep === 'complete') {
      return (
        <div className="text-center space-y-6 animate-in fade-in-50 slide-in-from-right-5" dir="rtl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          
          <div>
            <h3 className="text-2xl font-black text-[#0B192C] mb-2">ثبت‌نام شما انجام شد!</h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              حساب کاربری شما در فروشگاه ماوی با موفقیت ایجاد گردید.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-[#0082CA] hover:bg-[#0091DF] text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-[#0082CA]/20 cursor-pointer transition-all"
          >
            ورود به فروشگاه
          </button>
        </div>
      );
    }

    // Default Login & Signup Details Form
    return (
      <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5" dir="rtl">
        {/* Full Name (Signup only) */}
        {authMode === 'signup' && (
          <div>
            <div className="relative">
              <User className="absolute right-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="نام و نام خانوادگی"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={() => handleFieldBlur('name')}
                className={cn(
                  "w-full pr-11 pl-4 py-3 bg-slate-50 border rounded-xl placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#0082CA]/20 transition-all",
                  errors.name ? "border-rose-500" : "border-slate-200"
                )}
                aria-label="نام و نام خانوادگی"
              />
              {errors.name && (
                <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Mobile Phone Number */}
        <div>
          <div className="relative">
            <Phone className="absolute right-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="tel"
              placeholder="09123456789"
              dir="ltr"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              onBlur={() => handleFieldBlur('phone')}
              className={cn(
                "w-full pr-11 pl-4 py-3 bg-slate-50 border rounded-xl placeholder:text-slate-400 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#0082CA]/20 transition-all",
                errors.phone ? "border-rose-500" : "border-slate-200"
              )}
              aria-label="شماره موبایل"
            />
            {errors.phone && (
              <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="relative">
            <Lock className="absolute right-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="رمز عبور"
              dir="ltr"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onBlur={() => handleFieldBlur('password')}
              className={cn(
                "w-full pr-11 pl-11 py-3 bg-slate-50 border rounded-xl placeholder:text-slate-400 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#0082CA]/20 transition-all",
                errors.password ? "border-rose-500" : "border-slate-200"
              )}
              aria-label="رمز عبور"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.password}
            </p>
          )}
          {authMode === 'signup' && (
            <PasswordStrengthIndicator password={formData.password} />
          )}
        </div>

        {/* Confirm Password (Signup only) */}
        {authMode === 'signup' && (
          <div>
            <div className="relative">
              <Shield className="absolute right-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="تکرار رمز عبور"
                dir="ltr"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onBlur={() => handleFieldBlur('confirmPassword')}
                className={cn(
                  "w-full pr-11 pl-11 py-3 bg-slate-50 border rounded-xl placeholder:text-slate-400 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#0082CA]/20 transition-all",
                  errors.confirmPassword ? "border-rose-500" : "border-slate-200"
                )}
                aria-label="تکرار رمز عبور"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? "مخفی کردن تکرار رمز عبور" : "نمایش تکرار رمز عبور"}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.confirmPassword}
              </p>
            )}
          </div>
        )}

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          {authMode === 'login' ? (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#0082CA] focus:ring-[#0082CA]"
                />
                <span className="text-slate-600 font-medium">مرا به خاطر بسپار</span>
              </label>
              <button
                type="button"
                onClick={() => setAuthMode('reset')}
                className="text-[#0082CA] hover:underline font-bold transition-colors cursor-pointer"
              >
                فراموشی رمز عبور؟
              </button>
            </>
          ) : (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#0082CA] focus:ring-[#0082CA]"
              />
              <span className="text-slate-600 text-xs leading-relaxed">
                شرایط و قوانین فروشگاه ماوی را می‌پذیرم
              </span>
            </label>
          )}
        </div>

        {errors.agreeToTerms && (
          <p className="text-rose-500 text-xs flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {errors.agreeToTerms}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full bg-[#0082CA] hover:bg-[#0091DF] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md shadow-[#0082CA]/20 cursor-pointer mt-2",
            "disabled:opacity-50"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              authMode === 'login' ? 'ورود به حساب کاربری' : 'ایجاد حساب کاربری'
            )}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div 
      className={cn("p-6 max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-sky-100", className)}
      role="region"
      aria-label="احراز هویت"
      dir="rtl"
    >
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2 animate-in fade-in-0 text-xs font-bold">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errors.general && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 animate-in fade-in-0 text-xs font-bold">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Top Segmented Tabs (ورود / ثبت‌نام) */}
      {authMode !== 'reset' && (
        <div className="mb-6">
          <AuthTabs
            activeTab={authMode}
            onTabChange={(tab) => {
              setAuthMode(tab);
              if (tab === 'signup') setRegistrationStep('details');
            }}
          />
        </div>
      )}

      {/* Form Area */}
      <form onSubmit={handleSubmit}>
        {renderAuthContent()}
      </form>
    </div>
  );
}

export default AuthForm;
