"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { formatPrice, parsePrice, getDiscountInfo } from "@/lib/price-utils";
import { ArrowRight, SlidersHorizontal, Filter, X, ShoppingBag } from "lucide-react";

export default function WomenCategoryPage() {
  const [sortBy, setSortBy] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([{ id: "all", label: "همه محصولات" }]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/api/products/'),
          api.get('/api/categories/flat/')
        ]);
        
        const productsList = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.results || [];
        setProducts(productsList);

        const catList = Array.isArray(catRes.data) ? catRes.data : catRes.data.results || [];
        const mappedCats = catList.map((c: any) => ({
          id: c.slug || c.id,
          slug: c.slug,
          name: c.name || c.title,
          label: c.name || c.title,
        }));
        setCategories([{ id: "all", label: "همه محصولات" }, ...mappedCats]);
      } catch (error) {
        console.error("Error fetching shop data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Robust Filter & Sort
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      if (selectedCategory === "all") return true;

      const selected = selectedCategory.toLowerCase().trim();
      const pSlug = (p.category_slug || "").toLowerCase().trim();
      const pName = (p.category_name || p.category || "").toLowerCase().trim();
      const pId = String(p.category_id || "");

      return (
        pSlug === selected ||
        pName === selected ||
        pId === selected ||
        pSlug.includes(selected) ||
        selected.includes(pSlug) ||
        pName.includes(selected) ||
        selected.includes(pName)
      );
    });

    if (sortBy === "price-low") {
      result.sort((a, b) => {
        const priceA = parsePrice(a.price);
        const priceB = parsePrice(b.price);
        return priceA - priceB;
      });
    } else if (sortBy === "price-high") {
      result.sort((a, b) => {
        const priceA = parsePrice(a.price);
        const priceB = parsePrice(b.price);
        return priceB - priceA;
      });
    }

    return result;
  }, [products, selectedCategory, sortBy]);

  return (
    <main className="min-h-screen pt-24 md:pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto relative text-white" dir="rtl">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-8 md:mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-2 md:mb-4 text-xs md:text-sm">
            <ArrowRight className="w-4 h-4 rotate-180" />
            بازگشت به صفحه اصلی
          </Link>
          <h1 className="text-3xl md:text-5xl font-black text-white">فروشگاه و محصولات</h1>
          <p className="text-gray-400 mt-2 md:mt-3 text-sm md:text-base">
            نمایش {filteredProducts.length.toLocaleString("fa-IR")} محصول
          </p>
        </motion.div>

        {/* Mobile Filter & Sorting Controls */}
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto hide-scrollbar pb-2 md:pb-0">
          {/* Mobile Filter Button */}
          <button 
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white text-sm shrink-0"
          >
            <Filter className="w-4 h-4 text-amber-400" />
            فیلترها {selectedCategory !== "all" && "(۱)"}
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

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Desktop Sidebar Filters */}
        <motion.aside 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block w-64 shrink-0 space-y-8"
        >
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 sticky top-28 shadow-xl">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-black text-white">فیلترها</h2>
              </div>
              {selectedCategory !== "all" && (
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                >
                  پاک کردن
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400">دسته‌بندی</h3>
              <div className="flex flex-col gap-2">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-xl hover:bg-white/5 transition-colors">
                    <input 
                      type="radio" 
                      name="category"
                      value={cat.id}
                      checked={selectedCategory === cat.id}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-4 h-4 accent-amber-400 bg-[#0a0a0a] border-white/20 cursor-pointer"
                    />
                    <span className={`text-xs transition-colors ${selectedCategory === cat.id ? 'text-amber-400 font-black' : 'text-gray-400 group-hover:text-white'}`}>
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
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl font-bold text-white">فیلترها</h2>
                </div>
                <button onClick={() => setIsMobileFilterOpen(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-4">دسته‌بندی</h3>
                  <div className="flex flex-col gap-3">
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-xl bg-white/5">
                        <input 
                          type="radio" 
                          name="mobile-category"
                          value={cat.id}
                          checked={selectedCategory === cat.id}
                          onChange={(e) => {
                            setSelectedCategory(e.target.value);
                          }}
                          className="w-5 h-5 accent-amber-400 bg-[#111111] border-white/20 cursor-pointer"
                        />
                        <span className={`text-sm transition-colors ${selectedCategory === cat.id ? 'text-amber-400 font-bold' : 'text-gray-300'}`}>
                          {cat.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-white/10 mt-auto flex gap-3">
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 h-14 bg-white text-black rounded-2xl font-bold text-sm"
                >
                  اعمال فیلتر ({filteredProducts.length.toLocaleString("fa-IR")} محصول)
                </button>
                {selectedCategory !== "all" && (
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setIsMobileFilterOpen(false);
                    }}
                    className="px-5 h-14 bg-white/10 text-white rounded-2xl font-bold text-sm hover:bg-white/20"
                  >
                    پاک کردن
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div className="flex-1 w-full">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="aspect-[3/4] bg-[#111111] rounded-3xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-[#111111] border border-white/10 rounded-3xl p-16 text-center space-y-4">
              <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="text-gray-400 text-sm md:text-base font-bold">
                محصولی در این دسته‌بندی یافت نشد.
              </p>
              <button
                onClick={() => setSelectedCategory("all")}
                className="px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-gray-200"
              >
                مشاهده تمام محصولات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {filteredProducts.map((product, index) => {
                const img = product.imageUrl || product.image || product.image_url || "/globe.svg";
                const catLabel = product.category_name || product.category || "فشن استور";
                const disc = getDiscountInfo(product);

                return (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="group flex flex-col bg-[#111111] border border-white/5 hover:border-white/20 rounded-3xl p-3 md:p-4 transition-all shadow-xl"
                  >
                    <Link href={`/products/${product.slug || product.id}`} className="block relative aspect-[3/4] overflow-hidden rounded-2xl bg-black/40 mb-3">
                      {disc.hasDiscount && (
                        <div className="absolute top-2.5 right-2.5 z-20">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-black shadow-[0_2px_10px_rgba(16,185,129,0.5)]">
                            ٪{disc.discountPercent} تخفیف
                          </span>
                        </div>
                      )}
                      <img 
                        src={img} 
                        alt={product.name || product.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="bg-white text-black px-4 py-2 rounded-full font-black text-xs transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          مشاهده و خرید
                        </span>
                      </div>
                    </Link>
                    <div className="flex flex-col space-y-1">
                      <span className="text-[10px] text-gray-500 font-medium">{catLabel}</span>
                      <h3 className="text-xs md:text-sm font-black text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                        {product.name || product.title}
                      </h3>
                      {disc.hasDiscount ? (
                        <div className="flex flex-col pt-1">
                          <span className="text-[10px] text-gray-500 line-through">
                            {formatPrice(disc.basePrice)}
                          </span>
                          <span className="text-emerald-400 font-black text-xs md:text-sm">
                            {formatPrice(disc.discountPrice)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-black text-xs md:text-sm pt-1">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}