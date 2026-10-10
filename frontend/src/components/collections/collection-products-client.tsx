"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ArrowUpDown,
  Tag,
  CheckCircle2,
  ShoppingBag,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { formatPrice, getDiscountInfo } from "@/lib/price-utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface CollectionProductItem {
  id: string;
  title?: string;
  name?: string;
  slug?: string;
  price?: string | number;
  image_url?: string;
  imageUrl?: string;
  images?: any[];
  position?: number;
  discount_price?: string | number | null;
  discount_percent?: number | null;
  category?: string | { id?: string; name?: string; slug?: string };
  is_in_stock?: boolean;
  stock?: number;
  created_at?: string;
}

interface CollectionProductsClientProps {
  initialProducts: CollectionProductItem[];
  collectionName: string;
}

type SortOption = "featured" | "newest" | "price_asc" | "price_desc";

const SORT_LABELS: Record<SortOption, string> = {
  featured: "پیش‌فرض کالکشن",
  newest: "جدیدترین‌ها",
  price_asc: "ارزان‌ترین",
  price_desc: "گران‌ترین",
};

export default function CollectionProductsClient({
  initialProducts,
  collectionName,
}: CollectionProductsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Extract available categories if present in items
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    initialProducts.forEach((p) => {
      if (typeof p.category === "string" && p.category.trim()) {
        cats.add(p.category.trim());
      } else if (p.category && typeof p.category === "object" && p.category.name) {
        cats.add(p.category.name.trim());
      }
    });
    return Array.from(cats);
  }, [initialProducts]);

  // Compute filtered & sorted products
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Search query filter (Persian-friendly)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) => {
        const title = (p.title || p.name || "").toLowerCase();
        return title.includes(q);
      });
    }

    // Discount filter
    if (onlyDiscounted) {
      result = result.filter((p) => {
        const disc = getDiscountInfo(p);
        return disc.hasDiscount;
      });
    }

    // In-stock filter
    if (onlyInStock) {
      result = result.filter((p) => {
        if (typeof p.is_in_stock === "boolean") return p.is_in_stock;
        if (typeof p.stock === "number") return p.stock > 0;
        return true;
      });
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((p) => {
        const catName =
          typeof p.category === "string"
            ? p.category
            : p.category?.name;
        return catName === selectedCategory;
      });
    }

    // Sort order
    result.sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;

      switch (sortBy) {
        case "price_asc":
          return priceA - priceB;
        case "price_desc":
          return priceB - priceA;
        case "newest":
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return (b.position ?? 0) - (a.position ?? 0);
        case "featured":
        default:
          return (a.position ?? 0) - (b.position ?? 0);
      }
    });

    return result;
  }, [initialProducts, searchQuery, sortBy, onlyDiscounted, onlyInStock, selectedCategory]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    onlyDiscounted ||
    onlyInStock ||
    selectedCategory !== "all" ||
    sortBy !== "featured";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSortBy("featured");
    setOnlyDiscounted(false);
    setOnlyInStock(false);
    setSelectedCategory("all");
  };

  if (initialProducts.length === 0) {
    return (
      <div className="text-center text-slate-500 py-16 bg-white rounded-3xl border border-sky-100 p-8 shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 text-[#0082CA] flex items-center justify-center mb-4">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <p className="font-bold text-base text-[#0B192C] mb-1">
          محصولی در این کالکشن قرار ندارد.
        </p>
        <p className="text-xs text-slate-400">
          به زودی جدیدترین آیتم‌های کالکشن «{collectionName}» اضافه خواهند شد.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Toolbar */}
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Row 1: Search Input & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در بین محصولات این کالکشن..."
              className="w-full h-11 pr-10 pl-10 rounded-xl bg-slate-50/70 border border-slate-200/80 focus:border-[#0082CA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0082CA]/20 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                title="پاک کردن جستجو"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Menu */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 hidden sm:inline-block">مرتب‌سازی:</span>
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 px-4 rounded-xl border-sky-200/80 bg-white hover:bg-sky-50 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm w-full sm:w-auto justify-between"
                >
                  <span className="flex items-center gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#0082CA]" />
                    <span>{SORT_LABELS[sortBy]}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-sky-100 text-slate-800 rounded-xl shadow-xl z-50 min-w-[160px]">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={`text-xs cursor-pointer py-2.5 px-3.5 rounded-lg flex items-center justify-between ${
                      sortBy === key
                        ? "bg-sky-50 font-bold text-[#0082CA]"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span>{SORT_LABELS[key]}</span>
                    {sortBy === key && <span className="w-1.5 h-1.5 rounded-full bg-[#0082CA]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Row 2: Filter Chips & Count Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-sky-100/70">
          <div className="flex items-center gap-2 flex-wrap">
            {/* All items chip */}
            <button
              type="button"
              onClick={() => {
                setOnlyDiscounted(false);
                setOnlyInStock(false);
                setSelectedCategory("all");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !onlyDiscounted && !onlyInStock && selectedCategory === "all"
                  ? "bg-[#0082CA] text-white shadow-md shadow-[#0082CA]/25"
                  : "bg-slate-100/80 text-slate-600 hover:bg-sky-50 hover:text-[#0082CA]"
              }`}
            >
              همه کالاها
            </button>

            {/* Discounts only chip */}
            <button
              type="button"
              onClick={() => setOnlyDiscounted(!onlyDiscounted)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                onlyDiscounted
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                  : "bg-slate-100/80 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>تخفیف‌دارها</span>
            </button>

            {/* In-stock only chip */}
            <button
              type="button"
              onClick={() => setOnlyInStock(!onlyInStock)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                onlyInStock
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                  : "bg-slate-100/80 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>فقط کالاهای موجود</span>
            </button>

            {/* Dynamic category chips (if available) */}
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === cat ? "all" : cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#0082CA] text-white shadow-md shadow-[#0082CA]/25"
                    : "bg-slate-100/80 text-slate-600 hover:bg-sky-50 hover:text-[#0082CA]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Result Count and Clear Filters */}
          <div className="flex items-center gap-3 mr-auto sm:mr-0">
            <span className="text-xs text-slate-500 font-medium">
              نمایش <span className="font-bold text-[#0082CA]">{filteredProducts.length.toLocaleString("fa-IR")}</span> کالا از مجموع{" "}
              <span className="font-bold text-slate-700">{initialProducts.length.toLocaleString("fa-IR")}</span>
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                title="پاک کردن تمام فیلترها"
              >
                <RotateCcw className="w-3 h-3" />
                <span>حذف فیلترها</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid or Empty Match State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-sky-100 p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 text-[#0082CA] flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black text-[#0B192C]">
            محصولی مطابق با فیلترها یا جستجوی شما یافت نشد
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            لطفاً عبارت دیگری را جستجو کنید یا فیلترهای فعال را بازنشانی نمایید.
          </p>
          <Button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0082CA] hover:bg-[#0072B3] text-white text-xs font-bold transition-all shadow-md shadow-[#0082CA]/25 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>حذف تمام فیلترها و نمایش همه</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((product) => {
            const disc = getDiscountInfo(product);
            const imgUrl =
              product.imageUrl ||
              product.image_url ||
              (Array.isArray(product.images) && product.images[0]?.url) ||
              (Array.isArray(product.images) && typeof product.images[0] === "string"
                ? product.images[0]
                : null) ||
              "/placeholder-product.svg";

            const productCategory =
              typeof product.category === "string"
                ? product.category
                : product.category?.name;

            return (
              <Link
                key={product.id || product.slug}
                href={`/products/${product.slug || product.id}`}
                className="group flex flex-col bg-white rounded-2xl border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-xl hover:shadow-sky-950/5 transition-all overflow-hidden"
              >
                <div className="relative aspect-[3/4] bg-sky-50/50 overflow-hidden">
                  <img
                    src={imgUrl}
                    alt={product.title || product.name || "محصول"}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/placeholder-product.svg";
                    }}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  {disc.hasDiscount && (
                    <div className="absolute top-2.5 right-2.5 z-20">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-md">
                        ٪{disc.discountPercent} تخفیف
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between space-y-2">
                  <div className="space-y-1">
                    {productCategory && (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-sky-50 text-[#0072B3] text-[10px] font-bold">
                        {productCategory}
                      </span>
                    )}
                    <h3 className="text-xs sm:text-sm font-bold text-[#0B192C] group-hover:text-[#0082CA] transition-colors line-clamp-2">
                      {product.name || product.title}
                    </h3>
                  </div>

                  <div className="flex flex-col pt-1">
                    {disc.hasDiscount ? (
                      <>
                        <span className="text-[11px] text-slate-400 line-through">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-[#0082CA]">
                          {formatPrice(disc.discountPrice)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs sm:text-sm font-black text-[#0B192C]">
                        {formatPrice(product.price)}
                      </span>
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
