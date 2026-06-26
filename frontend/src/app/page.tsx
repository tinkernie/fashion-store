"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product-card";

const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "لباس مجلسی ابریشم کلاسیک",
    price: "۲,۴۰۰,۰۰۰ تومان",
    category: "پیراهن",
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "بارانی پشمی مینیمال",
    price: "۴,۲۰۰,۰۰۰ تومان",
    category: "پوشاک زمستانه",
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "3",
    name: "شومیز کتان اورسایز",
    price: "۱,۱۰۰,۰۰۰ تومان",
    category: "شومیز",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "4",
    name: "شلوار فاق بلند کلاسیک",
    price: "۱,۸۰۰,۰۰۰ تومان",
    category: "شلوار",
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop",
  },
];

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#fcfcfc] px-6">
        <div className="max-w-4xl text-center space-y-8">
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.4em] text-gray-400 font-bold"
          >
            مجموعه تابستانه ۲۰۲۶
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extralight tracking-tight text-gray-900 uppercase leading-[1.3]"
          >
            اصالت در <span className="font-serif italic font-normal">سادگی‌ست</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-2xl mx-auto text-base md:text-xl text-gray-500 leading-relaxed font-light"
          >
            طراحی شده برای بانوی مدرن؛ کسانی که برای خطوط پاک، پارچه‌های پرمیوم و استایل ماندگار ارزش قائلند.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="pt-4"
          >
            <Button className="rounded-none bg-black text-white hover:bg-neutral-800 px-10 py-6 text-sm font-medium transition-all duration-300">
              مشاهده محصولات
            </Button>
          </motion.div>
        </div>
      </main>

      {/* Product Grid Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col space-y-2 mb-12">
          <h2 className="text-xl font-light uppercase tracking-widest text-neutral-900">قطعات برگزیده</h2>
          <div className="h-[1px] w-12 bg-neutral-900" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>
    </div>
  );
}