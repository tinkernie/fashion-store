"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("لطفاً فیلدهای ضروری را پر کنید.");
      return;
    }
    toast.success("پیام شما با موفقیت ارسال شد. به زودی با شما تماس خواهیم گرفت.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 md:pt-32 pb-32 md:pb-24 px-4 md:px-6 max-w-7xl mx-auto" dir="rtl">
      
      <div className="text-center mb-12 md:mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-black text-slate-900 mb-3 md:mb-4"
        >
          تماس با ما
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-slate-500 text-sm md:text-base"
        >
          نظرات، پیشنهادات و سوالات خود را با ما در میان بگذارید.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-24">
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8 md:space-y-10"
        >
          <div className="space-y-6 md:space-y-8">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">اطلاعات ارتباطی</h2>
            
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-50 border border-sky-100 rounded-xl md:rounded-2xl flex items-center justify-center text-[#0082CA] shrink-0 shadow-sm">
                <MapPin className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold mb-1 text-sm md:text-base">آدرس دفتر مرکزی</h3>
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                  تهران، خیابان ولیعصر، بالاتر از میدان ونک، مجتمع تجاری فشن استور، طبقه پنجم، واحد ۵۰۲
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-50 border border-sky-100 rounded-xl md:rounded-2xl flex items-center justify-center text-[#0082CA] shrink-0 shadow-sm">
                <Phone className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold mb-1 text-sm md:text-base">شماره تماس</h3>
                <p className="text-slate-700 text-xs md:text-sm dir-ltr text-right font-sans font-bold">
                  021 - 8888 8888
                </p>
                <p className="text-slate-400 text-[10px] md:text-xs mt-1">پاسخگویی: شنبه تا چهارشنبه، ۹ صبح تا ۱۷ عصر</p>
              </div>
            </div>

            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-50 border border-sky-100 rounded-xl md:rounded-2xl flex items-center justify-center text-[#0082CA] shrink-0 shadow-sm">
                <Mail className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold mb-1 text-sm md:text-base">پست الکترونیک</h3>
                <p className="text-slate-600 text-xs md:text-sm font-sans">
                  support@fashionstore.com
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <form onSubmit={handleSubmit} className="bg-white border border-sky-100 rounded-2xl md:rounded-3xl p-6 md:p-8 space-y-4 md:space-y-6 shadow-xl shadow-sky-950/5">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">ارسال پیام</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium text-slate-700">نام و نام خانوادگی <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-sky-50/50 border border-sky-200 rounded-xl p-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0082CA] transition-all"
                  placeholder="علی محمدی"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium text-slate-700">ایمیل <span className="text-rose-500">*</span></label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-sky-50/50 border border-sky-200 rounded-xl p-3 text-slate-900 text-sm font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0082CA] transition-all text-left"
                  placeholder="example@mail.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium text-slate-700">موضوع پیام</label>
              <input 
                type="text" 
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full bg-sky-50/50 border border-sky-200 rounded-xl p-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0082CA] transition-all"
                placeholder="پیگیری سفارش، پیشنهاد همکاری و..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium text-slate-700">متن پیام <span className="text-rose-500">*</span></label>
              <textarea 
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full bg-sky-50/50 border border-sky-200 rounded-xl p-3 md:p-4 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0082CA] min-h-[120px] md:min-h-[150px] resize-none transition-all"
                placeholder="پیام خود را اینجا بنویسید..."
              />
            </div>

            <Button type="submit" className="w-full h-12 md:h-14 rounded-xl bg-[#0082CA] text-white hover:bg-[#0072B5] font-bold shadow-md shadow-[#0082CA]/20 transition-all gap-2 text-sm md:text-base">
              <Send className="w-4 h-4 md:w-5 md:h-5" />
              ارسال پیام
            </Button>
          </form>
        </motion.div>

      </div>
    </main>
  );
}