"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Zap, Scissors } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pt-24 md:pt-32 pb-32 md:pb-24 px-4 md:px-6 max-w-7xl mx-auto" dir="rtl">
      
      <div className="flex flex-col items-center text-center space-y-4 md:space-y-6 mb-12 md:mb-20">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-6xl font-black text-slate-900"
        >
          درباره فشن استور
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 max-w-2xl text-sm md:text-lg leading-relaxed"
        >
          ما معتقدیم استایل شما بازتابی از هویت شماست. فشن استور با هدف ارائه پوشاک با کیفیت پریمیوم و طراحی‌های مینیمال برای نسل جدید خلق شده است.
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full h-[300px] md:h-[500px] rounded-2xl md:rounded-3xl overflow-hidden mb-12 md:mb-20 relative shadow-xl shadow-sky-950/5 border border-sky-100"
      >
        <img 
          src="https://images.unsplash.com/photo-1550614000-4b95d466f128?q=80&w=1920&auto=format&fit=crop" 
          alt="About Fashion Store" 
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white border border-sky-100 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-3 md:space-y-4 shadow-xl shadow-sky-950/5"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-50 border border-sky-100 rounded-xl md:rounded-2xl flex items-center justify-center text-[#0082CA] shadow-sm">
            <Scissors className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900">دوخت و متریال پریمیوم</h3>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
            تمامی محصولات ما با استفاده از بهترین پارچه‌ها و با دقت بالا در جزئیات دوخته می‌شوند تا طول عمر بالایی داشته باشند.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-sky-100 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-3 md:space-y-4 shadow-xl shadow-sky-950/5"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-50 border border-sky-100 rounded-xl md:rounded-2xl flex items-center justify-center text-[#0082CA] shadow-sm">
            <Zap className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900">طراحی مدرن و مینیمال</h3>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
            تمرکز ما بر روی خلق استایل‌های خیابانی و روزمره است که هرگز از مد نمی‌افتند و همیشه متمایز هستند.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-sky-100 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-3 md:space-y-4 shadow-xl shadow-sky-950/5"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-50 border border-sky-100 rounded-xl md:rounded-2xl flex items-center justify-center text-[#0082CA] shadow-sm">
            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900">تضمین کیفیت و اصالت</h3>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
            ما کیفیت تک تک محصولاتی که به دست شما می‌رسد را تضمین می‌کنیم. رضایت شما هدف نهایی ماست.
          </p>
        </motion.div>
      </div>

    </main>
  );
}