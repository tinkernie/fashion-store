"use client";

import { motion } from "framer-motion";
import ProductCard from "@/components/product-card";

// Mock Data for the Women's Collection
const WOMEN_PRODUCTS = [
  {
    id: "w1",
    name: "کت چرم اورسایز مشکی",
    price: "۶,۵۰۰,۰۰۰ تومان",
    category: "Outerwear",
    imageUrl: "https://images.unsplash.com/photo-1550614000-4b95d466f128?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "w2",
    name: "هودی کراپ دارک‌ساید",
    price: "۲,۲۰۰,۰۰۰ تومان",
    category: "Streetwear",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "w3",
    name: "شلوار کارگو جیب‌دار",
    price: "۳,۱۰۰,۰۰۰ تومان",
    category: "Pants",
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "w4",
    name: "تی‌شرت بیسیک پریمیوم",
    price: "۱,۴۰۰,۰۰۰ تومان",
    category: "Tops",
    imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop",
  },
];

export default function WomenCollection() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4 mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black text-white"
        >
          کالکشن بانوان
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 max-w-xl text-sm md:text-base"
        >
          جدیدترین طراحی‌های استایل خیابانی و دارک مینیمال، دوخته شده با بهترین متریال برای استایل روزمره شما.
        </motion.p>
      </div>

      {/* Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12"
      >
        {WOMEN_PRODUCTS.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </motion.div>
    </main>
  );
}