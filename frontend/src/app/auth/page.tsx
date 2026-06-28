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
const loginSchema = z.object({
  identifier: z.string().min(3, "ایمیل یا شماره موبایل الزامی است"),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
});

const registerSchema = z.object({
  fullName: z.string().min(3, "نام باید حداقل ۳ کاراکتر باشد"),
  identifier: z.string().min(3, "ایمیل یا شماره موبایل الزامی است"),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Login Form Hook
  const { register: registerLogin, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Register Form Hook
  const { register: registerSignup, handleSubmit: handleRegisterSubmit, formState: { errors: registerErrors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

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

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl">
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
                  <Input 
                    {...registerLogin("identifier")}
                    placeholder="example@email.com" 
                    className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30" 
                    dir="ltr" 
                  />
                  {loginErrors.identifier && <p className="text-red-500 text-xs mt-1">{loginErrors.identifier.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">رمز عبور</label>
                  <Input 
                    {...registerLogin("password")}
                    type="password" 
                    placeholder="••••••••" 
                    className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30" 
                    dir="ltr" 
                  />
                  {loginErrors.password && <p className="text-red-500 text-xs mt-1">{loginErrors.password.message}</p>}
                </div>
                <Button disabled={isLoading} type="submit" className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-base font-bold transition-all mt-4">
                  {isLoading ? "در حال پردازش..." : "ورود به حساب"}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">نام و نام خانوادگی</label>
                  <Input 
                    {...registerSignup("fullName")}
                    placeholder="مثال: علی رضایی" 
                    className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30" 
                  />
                  {registerErrors.fullName && <p className="text-red-500 text-xs mt-1">{registerErrors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">ایمیل یا شماره موبایل</label>
                  <Input 
                    {...registerSignup("identifier")}
                    placeholder="example@email.com" 
                    className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30" 
                    dir="ltr" 
                  />
                  {registerErrors.identifier && <p className="text-red-500 text-xs mt-1">{registerErrors.identifier.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">رمز عبور</label>
                  <Input 
                    {...registerSignup("password")}
                    type="password" 
                    placeholder="••••••••" 
                    className="bg-[#0a0a0a] border-white/10 h-12 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-white/30" 
                    dir="ltr" 
                  />
                  {registerErrors.password && <p className="text-red-500 text-xs mt-1">{registerErrors.password.message}</p>}
                </div>
                <Button disabled={isLoading} type="submit" className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-base font-bold transition-all mt-4">
                  {isLoading ? "در حال پردازش..." : "ایجاد حساب کاربری"}
                </Button>
              </form>
            </TabsContent>

          </Tabs>
        </div>
      </motion.div>
    </main>
  );
}