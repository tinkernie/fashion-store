"use client";

import { motion } from "framer-motion";
import ProductCard from "@/components/product-card";

const MEN_PRODUCTS = [
  {
    id: "m1",
    name: "ژاکت بامبر چرم",
    price: "۷,۸۰۰,۰۰۰ تومان",
    category: "Outerwear",
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "m2",
    name: "تی‌شرت اورسایز دارک",
    price: "۱,۲۰۰,۰۰۰ تومان",
    category: "Streetwear",
    imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "m3",
    name: "شلوار جین راسته مشکی",
    price: "۲,۹۰۰,۰۰۰ تومان",
    category: "Pants",
    imageUrl: "https://images.unsplash.com/photo-1517423568366-8b83523034fd?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "m4",
    name: "هودی ضخیم مینیمال",
    price: "۲,۶۰۰,۰۰۰ تومان",
    category: "Tops",
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop",
  },
];

export default function MenCollection() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4 mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black text-white"
        >
          کالکشن آقایان
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 max-w-xl text-sm md:text-base"
        >
          طراحی‌های جسورانه و ساختاریافته. ترکیبی از استایل خیابانی مدرن و کلاسیک‌های بازطراحی شده برای کمد لباس شما.
        </motion.p>
      </div>

      {/* Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12"
      >
        {MEN_PRODUCTS.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </motion.div>
    </main>
  );
}