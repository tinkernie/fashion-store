"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ALL_PRODUCTS } from "@/lib/mock-data";
import { ArrowRight, SlidersHorizontal } from "lucide-react";

export default function MenCategoryPage() {
  const [sortBy, setSortBy] = useState("newest");

  let filteredProducts = ALL_PRODUCTS.filter(
    (p) => p.category.includes("مرد") || p.category.includes("آقایان")
  );

  if (sortBy === "price-low") {
    filteredProducts.sort((a, b) => {
      const priceA = typeof a.price === 'number' ? a.price : Number(String(a.price).replace(/\D/g, ''));
      const priceB = typeof b.price === 'number' ? b.price : Number(String(b.price).replace(/\D/g, ''));
      return priceA - priceB;
    });
  } else if (sortBy === "price-high") {
    filteredProducts.sort((a, b) => {
      const priceA = typeof a.price === 'number' ? a.price : Number(String(a.price).replace(/\D/g, ''));
      const priceB = typeof b.price === 'number' ? b.price : Number(String(b.price).replace(/\D/g, ''));
      return priceB - priceA;
    });
  }

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-4">
            <ArrowRight className="w-4 h-4" />
            بازگشت به خانه
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-white">کالکشن آقایان</h1>
          <p className="text-gray-400 mt-3">نمایش {filteredProducts.length} محصول</p>
        </motion.div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-3 bg-[#111111] border border-white/10 rounded-2xl px-4 py-2 w-fit">
          <SlidersHorizontal className="w-5 h-5 text-gray-400" />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent border-none text-white outline-none text-sm font-medium cursor-pointer"
          >
            <option value="newest" className="bg-[#111111]">جدیدترین‌ها</option>
            <option value="price-low" className="bg-[#111111]">ارزان‌ترین</option>
            <option value="price-high" className="bg-[#111111]">گران‌ترین</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <p className="text-gray-500 text-lg">محصولی در این دسته‌بندی یافت نشد.</p>
          </div>
        ) : (
          filteredProducts.map((product, index) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group flex flex-col"
            >
              <Link href={`/products/${product.id}`} className="block relative aspect-[3/4] overflow-hidden rounded-3xl bg-[#111111] border border-white/5 mb-4">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    مشاهده محصول
                  </span>
                </div>
              </Link>
              <div className="flex flex-col px-2">
                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{product.name}</h3>
                <span className="text-sm text-gray-500 mb-2">{product.category}</span>
                <span className="text-white font-medium">
                  {product.price} تومان
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </main>
  );
}