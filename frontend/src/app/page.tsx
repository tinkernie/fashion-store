"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ALL_PRODUCTS } from "@/lib/mock-data";
import { ArrowLeft, ShoppingBag, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Banner Slider Component ---
const BannerSlider = ({ title, subtitle, href, images }: { title: string, subtitle: string, href: string, images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [images.length]);

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="group relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden bg-[#111111]">
      {/* Images with CSS Crossfade & Zoom */}
      {images.map((img, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            idx === currentIndex ? "opacity-60 z-0" : "opacity-0 -z-10"
          }`}
        >
          <img 
            src={img} 
            alt={title} 
            className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${
              idx === currentIndex ? "scale-105" : "scale-100"
            }`}
          />
        </div>
      ))}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 pointer-events-none"></div>
      
      {/* Invisible clickable layer for the whole banner */}
      <Link href={href} className="absolute inset-0 z-20" aria-label={title}></Link>

      {/* Text Content */}
      <div className="absolute bottom-0 left-0 right-0 p-10 md:p-16 flex items-end justify-between z-30 pointer-events-none">
        <div>
          <h3 className="text-4xl md:text-5xl font-black text-white mb-4">{title}</h3>
          <p className="text-gray-300 font-medium text-lg md:text-xl">{subtitle}</p>
        </div>
        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white group-hover:text-black transition-all">
          <ArrowLeft className="w-6 h-6" />
        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide} 
        className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-40 outline-none backdrop-blur-md border border-white/10"
      >
        <ChevronLeft className="w-6 h-6 pr-1" />
      </button>
      <button 
        onClick={nextSlide} 
        className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-40 outline-none backdrop-blur-md border border-white/10"
      >
        <ChevronRight className="w-6 h-6 pl-1" />
      </button>

      {/* Slider Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 pointer-events-none">
        {images.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-1.5 rounded-full transition-all duration-500 ${
              idx === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default function HomePage() {
  const bestsellers = ALL_PRODUCTS.slice(0, 4);

  const newProductsImages = [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1920&auto=format&fit=crop"
  ];

  const specialSaleImages = [
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1485230895905-ef350c3d9a74?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1434389678232-04ce6c41b80a?q=80&w=1920&auto=format&fit=crop"
  ];

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
            <Button asChild className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-[#111111] border border-white/20 text-white hover:bg-white hover:text-black text-lg font-bold transition-all backdrop-blur-md">
              <Link href="/women">فروش ویژه</Link>
            </Button>
            <Button asChild className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-[#111111] border border-white/20 text-white hover:bg-white hover:text-black text-lg font-bold transition-all backdrop-blur-md">
              <Link href="/women">جدیدترین محصولات</Link>
            </Button>
            <Button asChild className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-[#111111] border border-white/20 text-white hover:bg-white hover:text-black text-lg font-bold transition-all backdrop-blur-md">
              <Link href="/women">پرفروش ترین محصولات</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Dynamic Sliders Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 gap-8">
          <BannerSlider 
            title="جدیدترین محصولات" 
            subtitle="مشاهده کالکشن جدید" 
            href="/women" 
            images={newProductsImages} 
          />
          <BannerSlider 
            title="فروش ویژه" 
            subtitle="تخفیف‌های استثنایی" 
            href="/women" 
            images={specialSaleImages} 
          />
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[1000px] h-[600px] md:h-[1000px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none -z-10"></div>
        
        <div className="flex items-end justify-between mb-12 relative z-10">
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
          <Button asChild variant="outline" className="w-full h-12 rounded-xl border-white/20 text-white hover:bg-white hover:text-black transition-colors">
            <Link href="/women">مشاهده همه محصولات</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}