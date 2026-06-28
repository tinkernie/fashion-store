"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Zap, Scissors } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-6 max-w-7xl mx-auto">
      
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-6 mb-20">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black text-white"
        >
          درباره فشن استور
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 max-w-2xl text-base md:text-lg leading-relaxed"
        >
          ما معتقدیم استایل شما بازتابی از هویت شماست. فشن استور با هدف ارائه پوشاک با کیفیت پریمیوم و طراحی‌های مینیمال برای نسل جدید خلق شده است.
        </motion.p>
      </div>

      {/* Image Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden mb-20 relative"
      >
        <img 
          src="https://images.unsplash.com/photo-1550614000-4b95d466f128?q=80&w=1920&auto=format&fit=crop" 
          alt="About Fashion Store" 
          className="w-full h-full object-cover grayscale opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#111111] border border-white/5 p-8 rounded-3xl space-y-4"
        >
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
            <Scissors className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">دوخت و متریال پریمیوم</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            تمامی محصولات ما با استفاده از بهترین پارچه‌ها و با دقت بالا در جزئیات دوخته می‌شوند تا طول عمر بالایی داشته باشند.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-[#111111] border border-white/5 p-8 rounded-3xl space-y-4"
        >
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">طراحی مدرن و مینیمال</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            تمرکز ما بر روی خلق استایل‌های خیابانی و روزمره است که هرگز از مد نمی‌افتند و همیشه متمایز هستند.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-[#111111] border border-white/5 p-8 rounded-3xl space-y-4"
        >
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">تضمین کیفیت و اصالت</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            ما کیفیت تک تک محصولاتی که به دست شما می‌رسد را تضمین می‌کنیم. رضایت شما هدف نهایی ماست.
          </p>
        </motion.div>
      </div>

    </main>
  );
}