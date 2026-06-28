"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ALL_PRODUCTS } from "@/lib/mock-data";
import { ArrowLeft, ShoppingBag, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  // Get a few items for the bestsellers section
  const bestsellers = ALL_PRODUCTS.slice(0, 4);

  return (
    <main className="min-h-screen pb-24">
      
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1920&auto=format&fit=crop" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/50 via-transparent to-[#0a0a0a]"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center max-w-4xl mx-auto space-y-8 mt-16"
        >
          <span className="bg-white/10 text-white px-4 py-2 rounded-full text-sm font-bold tracking-widest uppercase backdrop-blur-md border border-white/10">
            کالکشن جدید تابستانه
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tight">
            استایل خود را <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-600">بازتعریف کنید</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            جدیدترین طراحی‌های استایل خیابانی و مینیمال. تولید شده با بهترین متریال برای استفاده روزمره.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-white text-black hover:bg-gray-200 text-lg font-bold transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]">
              <Link href="/men">
                کالکشن آقایان
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-2xl border-white/20 text-white hover:bg-white/10 text-lg font-bold transition-all backdrop-blur-md">
              <Link href="/women">
                کالکشن بانوان
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/women" className="group relative h-[400px] rounded-3xl overflow-hidden bg-[#111111]">
            <img 
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop" 
              alt="Women Category" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end justify-between">
              <div>
                <h3 className="text-3xl font-black text-white mb-2">بانوان</h3>
                <p className="text-gray-300 font-medium">مشاهده جدیدترین مدل‌ها</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white group-hover:text-black transition-all">
                <ArrowLeft className="w-5 h-5" />
              </div>
            </div>
          </Link>

          <Link href="/men" className="group relative h-[400px] rounded-3xl overflow-hidden bg-[#111111]">
            <img 
              src="https://images.unsplash.com/photo-1517423568366-8b83523034fd?q=80&w=800&auto=format&fit=crop" 
              alt="Men Category" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end justify-between">
              <div>
                <h3 className="text-3xl font-black text-white mb-2">آقایان</h3>
                <p className="text-gray-300 font-medium">استایل‌های کلاسیک و مدرن</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white group-hover:text-black transition-all">
                <ArrowLeft className="w-5 h-5" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
              <h2 className="text-3xl md:text-4xl font-black text-white">پرفروش‌ترین‌ها</h2>
            </div>
            <p className="text-gray-400">محصولاتی که بیشترین توجه را جلب کرده‌اند</p>
          </div>
          <Link href="/women" className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium">
            مشاهده همه
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestsellers.map((product, index) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group flex flex-col"
            >
              <Link href={`/products/${product.id}`} className="block relative aspect-[3/4] overflow-hidden rounded-3xl bg-[#111111] border border-white/5 mb-4">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    مشاهده محصول
                  </span>
                </div>
              </Link>
              <div className="flex flex-col px-2">
                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{product.name}</h3>
                <span className="text-sm text-gray-500 mb-2">{product.category.split('-')[1]?.trim() || product.category}</span>
                <span className="text-white font-medium">
                  {product.price} تومان
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <Button asChild variant="outline" className="w-full h-12 rounded-xl border-white/20 text-white">
            <Link href="/women">مشاهده همه محصولات</Link>
          </Button>
        </div>
      </section>

    </main>
  );
}