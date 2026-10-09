"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatPrice, parsePrice, getDiscountInfo } from "@/lib/price-utils";
import { ArrowUpDown, SlidersHorizontal, Tag, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CategoryProductsClientProps {
  initialProducts: any[];
  category: any;
}

export default function CategoryProductsClient({
  initialProducts,
  category,
}: CategoryProductsClientProps) {
  const [sortBy, setSortBy] = useState<string>("newest");
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  const sortedProducts = useMemo(() => {
    let list = [...initialProducts];

    if (onlyInStock) {
      list = list.filter((p) => {
        const stock = p.stock_quantity ?? p.inventory_count ?? 1;
        return stock > 0 && p.status !== "out_of_stock";
      });
    }

    if (sortBy === "price_asc") {
      list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    } else if (sortBy === "popular") {
      list.sort(
        (a, b) =>
          Number(b.reviews_count || b.review_count || 0) -
          Number(a.reviews_count || a.review_count || 0)
      );
    }
    return list;
  }, [initialProducts, sortBy, onlyInStock]);

  return (
    <div className="space-y-6">
      {/* Filter and Sorting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-sky-100 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">مرتب‌سازی:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "newest", label: "جدیدترین" },
              { id: "popular", label: "محبوب‌ترین" },
              { id: "price_asc", label: "ارزان‌ترین" },
              { id: "price_desc", label: "گران‌ترین" },
            ].map((sortOption) => (
              <button
                key={sortOption.id}
                onClick={() => setSortBy(sortOption.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sortBy === sortOption.id
                    ? "bg-[#0082CA] text-white shadow-md shadow-[#0082CA]/25"
                    : "bg-sky-50 text-slate-600 hover:bg-sky-100 hover:text-[#0082CA]"
                }`}
              >
                {sortOption.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="w-4 h-4 rounded text-[#0082CA] accent-[#0082CA] focus:ring-[#0082CA]"
            />
            <span>فقط کالاهای موجود</span>
          </label>
          <span className="text-xs text-slate-400">
            {sortedProducts.length.toLocaleString("fa-IR")} کالا
          </span>
        </div>
      </div>

      {/* Products Grid */}
      {sortedProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-sky-100 p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 text-[#0082CA] flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black text-[#0B192C]">
            هیچ محصولی در این دسته‌بندی یافت نشد
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            محصولات این دسته به زودی شارژ خواهند شد. می‌توانید از سایر دسته‌بندی‌های ماوی دیدن کنید.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0082CA] text-white text-xs font-bold hover:bg-[#006CA8] transition-colors shadow-md shadow-[#0082CA]/25"
          >
            مشاهده تمام محصولات
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {sortedProducts.map((prod) => {
            const disc = getDiscountInfo(prod);
            const imageSrc =
              prod.imageUrl ||
              prod.image_url ||
              (Array.isArray(prod.images) && prod.images[0]?.url) ||
              (Array.isArray(prod.images) && typeof prod.images[0] === "string" ? prod.images[0] : null) ||
              "/placeholder-product.svg";

            return (
              <Link
                key={prod.id || prod.slug}
                href={`/products/${prod.slug || prod.id}`}
                className="group flex flex-col bg-white rounded-2xl border border-sky-100 hover:border-sky-300 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-sky-950/5"
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] bg-sky-50/50 overflow-hidden">
                  <img
                    src={imageSrc}
                    alt={prod.title || prod.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/placeholder-product.svg";
                    }}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  {disc.hasDiscount && (
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-md">
                        ٪{disc.discountPercent} تخفیف
                      </span>
                    </div>
                  )}
                  {prod.category && (
                    <div className="absolute bottom-2.5 right-2.5 z-10">
                      <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-[10px] font-bold text-slate-700 shadow-sm border border-white/50">
                        {prod.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between space-y-3">
                  <h3 className="text-xs sm:text-sm font-bold text-[#0B192C] group-hover:text-[#0082CA] transition-colors line-clamp-2 leading-snug">
                    {prod.title || prod.name}
                  </h3>

                  <div className="space-y-1">
                    {disc.hasDiscount ? (
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-400 line-through">
                          {formatPrice(prod.price)}
                        </span>
                        <div className="flex items-baseline gap-1 text-sm sm:text-base font-black text-[#0082CA]">
                          <span>{formatPrice(disc.discountPrice)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm sm:text-base font-black text-[#0B192C]">
                        {formatPrice(prod.price)}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
