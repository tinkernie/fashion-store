"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden flex flex-col justify-between">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop" 
          alt="Fashion Background" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-[#0a0a0a]/50" />
      </div>

      {/* Main Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 mt-20">
        
        {/* Small Top Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-reverse space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm"
        >
          <span className="text-[10px] tracking-[0.2em] uppercase text-gray-300 font-medium font-sans">We Make More Shine</span>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        </motion.div>

        {/* Massive Typography */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center flex flex-col items-center leading-none"
        >
          <h1 className="text-[80px] md:text-[140px] font-black tracking-tighter text-white uppercase font-sans drop-shadow-2xl">
            A-A
          </h1>
          <h1 className="text-[60px] md:text-[120px] font-black tracking-tighter text-white uppercase font-sans -mt-4 md:-mt-8 drop-shadow-2xl">
            STUDIOS
          </h1>
        </motion.div>

        {/* Dual Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-12"
        >
          <Button asChild className="w-48 h-14 rounded-2xl bg-[#f4f4f4] text-black hover:bg-white text-base font-bold transition-all">
            <Link href="/women">کالکشن بانوان</Link>
          </Button>
          <Button asChild className="w-48 h-14 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 text-base font-bold transition-all">
            <Link href="/men">کالکشن آقایان</Link>
          </Button>
        </motion.div>
      </main>

      {/* Bottom Glassmorphism Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-12 pt-20"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center justify-center py-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
            <span className="text-3xl md:text-4xl font-bold text-white font-sans">%99</span>
            <span className="text-xs md:text-sm text-gray-400 mt-2">رضایت مشتریان</span>
          </div>
          <div className="flex flex-col items-center justify-center py-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
            <span className="text-3xl md:text-4xl font-bold text-white font-sans">+120</span>
            <span className="text-xs md:text-sm text-gray-400 mt-2">محصول</span>
          </div>
          <div className="flex flex-col items-center justify-center py-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
            <span className="text-3xl md:text-4xl font-bold text-white font-sans">+5</span>
            <span className="text-xs md:text-sm text-gray-400 mt-2">شعبه فعال</span>
          </div>
          <div className="flex flex-col items-center justify-center py-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
            <span className="text-3xl md:text-4xl font-bold text-white font-sans">+20K</span>
            <span className="text-xs md:text-sm text-gray-400 mt-2">مشتری</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}