"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_PRODUCTS } from "@/lib/mock-data";
import { ArrowRight, SlidersHorizontal, Filter, X } from "lucide-react";

export default function WomenCategoryPage() {
  const [sortBy, setSortBy] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filter logic
  let filteredProducts = ALL_PRODUCTS.filter((p) => {
    return selectedCategory === "all" || p.categoryId === selectedCategory;
  });

  // Sort logic
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

  const categories = [
    { id: "all", label: "همه محصولات" },
    { id: "manteau", label: "مانتو" },
    { id: "tshirt", label: "تی‌شرت و کراپ" },
    { id: "pants", label: "شلوار" },
    { id: "scarf", label: "شال و روسری" },
  ];

  return (
    <main className="min-h-screen pt-24 md:pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto relative">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-8 md:mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-2 md:mb-4 text-xs md:text-sm">
            <ArrowRight className="w-4 h-4" />
            بازگشت به خانه
          </Link>
          <h1 className="text-3xl md:text-5xl font-black text-white">فروشگاه</h1>
          <p className="text-gray-400 mt-2 md:mt-3 text-sm md:text-base">نمایش {filteredProducts.length} محصول</p>
        </motion.div>

        {/* Mobile Filter & Sorting Controls */}
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto hide-scrollbar pb-2 md:pb-0">
          {/* Mobile Filter Button */}
          <button 
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white text-sm shrink-0"
          >
            <Filter className="w-4 h-4 text-gray-400" />
            فیلترها
          </button>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#111111] border border-white/10 rounded-xl px-4 py-3 shrink-0">
            <SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-white outline-none text-xs md:text-sm font-medium cursor-pointer"
            >
              <option value="newest" className="bg-[#111111]">جدیدترین‌ها</option>
              <option value="price-low" className="bg-[#111111]">ارزان‌ترین</option>
              <option value="price-high" className="bg-[#111111]">گران‌ترین</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Desktop Sidebar Filters */}
        <motion.aside 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block w-64 shrink-0 space-y-8"
        >
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
              <Filter className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">فیلترها</h2>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-400">دسته‌بندی</h3>
              <div className="flex flex-col gap-2">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="category"
                      value={cat.id}
                      checked={selectedCategory === cat.id}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-4 h-4 accent-white bg-[#0a0a0a] border-white/20 cursor-pointer"
                    />
                    <span className={`text-sm transition-colors ${selectedCategory === cat.id ? 'text-white font-bold' : 'text-gray-400 group-hover:text-white'}`}>
                      {cat.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Mobile Fullscreen Filter Overlay */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[60] bg-[#0a0a0a] p-6 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-white" />
                  <h2 className="text-xl font-bold text-white">فیلترها</h2>
                </div>
                <button onClick={() => setIsMobileFilterOpen(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-4">دسته‌بندی</h3>
                  <div className="flex flex-col gap-4">
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="radio" 
                          name="mobile-category"
                          value={cat.id}
                          checked={selectedCategory === cat.id}
                          onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            // Optional: auto-close after selection
                            // setIsMobileFilterOpen(false); 
                          }}
                          className="w-5 h-5 accent-white bg-[#111111] border-white/20 cursor-pointer"
                        />
                        <span className={`text-base transition-colors ${selectedCategory === cat.id ? 'text-white font-bold' : 'text-gray-400'}`}>
                          {cat.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-white/10 mt-auto">
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full h-14 bg-white text-black rounded-2xl font-bold text-lg"
                >
                  اعمال فیلتر ({filteredProducts.length} محصول)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid - Forced 2 columns on mobile */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <p className="text-gray-500 text-lg">محصولی در این فیلتر یافت نشد.</p>
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
                <Link href={`/products/${product.id}`} className="block relative aspect-[3/4] overflow-hidden rounded-2xl md:rounded-3xl bg-[#111111] border border-white/5 mb-2 md:mb-4">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-white text-black px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-[10px] md:text-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      مشاهده
                    </span>
                  </div>
                </Link>
                <div className="flex flex-col px-1 md:px-2">
                  <h3 className="text-xs md:text-lg font-bold text-white mb-0.5 md:mb-1 line-clamp-1">{product.name}</h3>
                  <span className="text-[10px] md:text-sm text-gray-500 mb-1 md:mb-2">{categories.find(c => c.id === product.categoryId)?.label || product.category}</span>
                  <span className="text-white font-medium text-xs md:text-base">
                    {product.price} تومان
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}