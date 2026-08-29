"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  Check,
  RotateCcw,
  ShoppingBag,
  Heart,
  Tag,
  Filter,
  Grid3X3,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { useWishlist } from "@/store/wishlist";
import { getColorBackground, isLightColor } from "@/lib/color-utils";




interface ProductItem {
  id: string;
  title: string;
  name?: string;
  slug: string;
  description?: string;
  category?: string;
  collections?: string[];
  price?: string | number;
  discount_price?: string | number;
  image?: string;
  imageUrl?: string;
  is_new?: boolean;
  rating?: number;
}

interface FilterFacet {
  categories: Array<{ id: string; name: string; slug: string }>;
  collections: Array<{ id: string; name: string; slug: string }>;
  price_range: { min: string | null; max: string | null };
  options: Array<{ name: string; values: string[] }>;
}

const SORT_OPTIONS = [
  { label: "جدیدترین‌ها", value: "newest" },
  { label: "ارزان‌ترین", value: "price_asc" },
  { label: "گران‌ترین", value: "price_desc" },
  { label: "پرفروش‌ترین‌ها", value: "popularity" },
];

const POPULAR_KEYWORDS = [
  "کت پاییزه",
  "هودی اورسایز",
  "شلوار کارگو",
  "پیراهن مجلسی",
  "پالتو چرم",
  "اکسسوری",
];

const PRESET_COLORS: Record<string, string> = {
  مشکی: "#000000",
  سفید: "#FFFFFF",
  طوسی: "#6B7280",
  کرم: "#E5D3B3",
  شتری: "#C19A6B",
  زیتونی: "#556B2F",
  سرمه‌ای: "#1E293B",
  آبی: "#3B82F6",
  قرمز: "#EF4444",
  سبز: "#10B981",
  خردلی: "#EAB308",
};

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const collectionParam = searchParams.get("collection") || "";
  const minPriceParam = searchParams.get("min_price") || "";
  const maxPriceParam = searchParams.get("max_price") || "";
  const sortParam = searchParams.get("sort") || "newest";
  const inStockParam = searchParams.get("in_stock") === "true";
  const selectedOptionsParam = searchParams.get("options")
    ? JSON.parse(searchParams.get("options") || "{}")
    : {};

  // Component states
  const [keyword, setKeyword] = useState(queryParam);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [facets, setFacets] = useState<FilterFacet>({
    categories: [],
    collections: [],
    price_range: { min: "0", max: "20000000" },
    options: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Local filter states for sidebar
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);
  const [selectedSort, setSelectedSort] = useState(sortParam);
  const [inStockOnly, setInStockOnly] = useState(inStockParam);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(selectedOptionsParam);

  const { items: wishlistItems, addItem: addWishlist, removeItem: removeWishlist } = useWishlist();

  // Sync with URL params
  useEffect(() => {
    setKeyword(queryParam);
    setSelectedCategory(categoryParam);
    setMinPrice(minPriceParam);
    setMaxPrice(maxPriceParam);
    setSelectedSort(sortParam);
    setInStockOnly(inStockParam);
    setSelectedOptions(
      searchParams.get("options")
        ? JSON.parse(searchParams.get("options") || "{}")
        : {}
    );
  }, [searchParams]);

  // Ensure category facets are always available
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/api/categories/flat/');
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        if (list.length > 0) {
          setFacets((prev) => ({
            ...prev,
            categories: list.map((c: any) => ({
              id: c.id,
              name: c.name || c.title,
              slug: c.slug || c.id,
            })),
          }));
        }
      } catch {
        // ignore
      }
    };
    loadCategories();
  }, []);


  // Execute API Search
  const fetchSearchResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set("q", keyword);
      if (selectedCategory) params.set("category", selectedCategory);
      if (collectionParam) params.set("collection", collectionParam);
      if (minPrice) params.set("min_price", minPrice);
      if (maxPrice) params.set("max_price", maxPrice);
      if (selectedSort) params.set("sort", selectedSort);
      if (Object.keys(selectedOptions).length > 0) {
        params.set("options", JSON.stringify(selectedOptions));
      }
      params.set("page", String(currentPage));

      // Attempt search endpoint first
      let res;
      try {
        res = await api.get(`/api/search/products/?${params.toString()}`);
      } catch (searchErr) {
        // Fallback to standard products endpoint
        res = await api.get(`/api/products/?${params.toString()}`);
      }

      if (res.data) {
        if (Array.isArray(res.data)) {
          setProducts(res.data);
          setTotalCount(res.data.length);
          setTotalPages(1);
        } else if (res.data.products) {
          setProducts(res.data.products);
          if (res.data.filters) {
            setFacets(res.data.filters);
          }
          if (res.data.pagination) {
            setTotalCount(res.data.pagination.total_count || res.data.products.length);
            setTotalPages(res.data.pagination.total_pages || 1);
          }
        } else if (res.data.results) {
          setProducts(res.data.results);
          setTotalCount(res.data.count || res.data.results.length);
          setTotalPages(Math.ceil((res.data.count || res.data.results.length) / 20) || 1);
        }
      }
    } catch (e) {
      console.error("Search fetch failed:", e);
      toast.error("خطا در بارگذاری محصولات");
    } finally {
      setIsLoading(false);
    }
  }, [
    keyword,
    selectedCategory,
    collectionParam,
    minPrice,
    maxPrice,
    selectedSort,
    selectedOptions,
    currentPage,
  ]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  // Push new state to URL
  const applyFiltersToUrl = (newParams: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (!v) {
        nextParams.delete(k);
      } else {
        nextParams.set(k, v);
      }
    });
    router.push(`/search?${nextParams.toString()}`);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    applyFiltersToUrl({ q: keyword || null, page: "1" });
  };

  const handleClearAll = () => {
    setKeyword("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedSort("newest");
    setSelectedOptions({});
    router.push("/search");
  };

  const handleOptionToggle = (optionName: string, value: string) => {
    const current = selectedOptions[optionName] || [];
    const exists = current.includes(value);
    const updated = exists
      ? current.filter((v) => v !== value)
      : [...current, value];

    const next = { ...selectedOptions };
    if (updated.length === 0) {
      delete next[optionName];
    } else {
      next[optionName] = updated;
    }
    setSelectedOptions(next);
    applyFiltersToUrl({
      options: Object.keys(next).length > 0 ? JSON.stringify(next) : null,
    });
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    Object.values(selectedOptions).reduce((acc, v) => acc + v.length, 0);

  const formatPrice = (val?: string | number) => {
    if (!val) return "تماس بگیرید";
    const num = typeof val === "string" ? parseFloat(val) : val;
    return num.toLocaleString("fa-IR") + " تومان";
  };

  // Reusable Filter Sidebar Content
  const FilterSidebar = () => (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Active Filter Clear Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <span className="text-sm font-bold text-white flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          فیلترهای اعمال شده ({activeFiltersCount})
        </span>
        {activeFiltersCount > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            حذف همه
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
          دسته‌بندی‌ها
        </h4>
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => {
              setSelectedCategory("");
              applyFiltersToUrl({ category: null });
            }}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              !selectedCategory
                ? "bg-white text-black font-bold shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>همه دسته‌بندی‌ها</span>
            {!selectedCategory && <Check className="w-3.5 h-3.5" />}
          </button>
          {facets.categories?.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  const nextVal = isSelected ? "" : cat.slug;
                  setSelectedCategory(nextVal);
                  applyFiltersToUrl({ category: nextVal || null });
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-white text-black font-bold shadow-md"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{cat.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
          محدوده قیمت (تومان)
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">از</label>
            <Input
              type="number"
              placeholder="۰"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-9 text-xs bg-white/5 border-white/10 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">تا</label>
            <Input
              type="number"
              placeholder="حداکثر"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-9 text-xs bg-white/5 border-white/10 rounded-xl text-white"
            />
          </div>
        </div>
        <Button
          onClick={() => applyFiltersToUrl({ min_price: minPrice || null, max_price: maxPrice || null })}
          variant="outline"
          className="w-full h-8 text-xs border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl"
        >
          اعمال فیلتر قیمت
        </Button>
      </div>

      {/* Dynamic Options Filters (Color / Size) */}
      {facets.options?.map((opt) => {
        const uniqueValues = Array.from(new Set(opt.values || []));
        const isColor = opt.name.toLowerCase().includes("color") || opt.name.includes("رنگ");

        // Custom sort for clothing/shoe sizes
        if (!isColor) {
          const sizeOrder: Record<string, number> = {
            "2XS": 1, "XS": 2, "S": 3, "M": 4, "L": 5, "XL": 6, "2XL": 7, "3XL": 8, "تک سایز": 9, "Free": 10
          };
          uniqueValues.sort((a, b) => {
            const orderA = sizeOrder[a] || (isNaN(Number(a)) ? 99 : Number(a));
            const orderB = sizeOrder[b] || (isNaN(Number(b)) ? 99 : Number(b));
            return orderA - orderB;
          });
        }

        return (
          <div key={opt.name} className="space-y-3 pt-4 border-t border-white/10">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
              {isColor ? "انتخاب رنگ" : opt.name}
            </h4>

            {isColor ? (
              <div className="flex flex-wrap gap-2">
                {uniqueValues.map((val) => {
                  const isSelected = (selectedOptions[opt.name] || []).includes(val);
                  const bg = getColorBackground(val);

                  return (
                    <button
                      key={val}
                      onClick={() => handleOptionToggle(opt.name, val)}
                      title={val}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "border-amber-400 bg-amber-400/10 text-white font-bold ring-1 ring-amber-400/50"
                          : "border-white/10 bg-white/5 text-gray-300 hover:border-white/30 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 shadow-inner"
                        style={{ background: bg }}
                      />
                      <span>{val}</span>
                      {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {uniqueValues.map((val) => {
                  const isSelected = (selectedOptions[opt.name] || []).includes(val);
                  return (
                    <button
                      key={val}
                      onClick={() => handleOptionToggle(opt.name, val)}
                      className={`h-8 px-3 rounded-lg text-xs font-bold transition-all border ${
                        isSelected
                          ? "bg-white text-black border-white shadow-sm font-black"
                          : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-28 pb-24 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Search Header Banner */}
        <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                  <Search className="w-7 h-7 text-amber-400" />
                  کاتالوگ و جستجوی محصولات
                </h1>
                <p className="text-xs md:text-sm text-gray-400 mt-1.5">
                  جستجوی هوشمند در بین کالاهای لوکس، جدیدترین استایل‌ها و کالکشن‌های فصلی
                </p>
              </div>

              {/* Keyword Badges */}
              <div className="hidden lg:flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  محبوب:
                </span>
                {POPULAR_KEYWORDS.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => {
                      setKeyword(kw);
                      applyFiltersToUrl({ q: kw, page: "1" });
                    }}
                    className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="نام کالا، دسته‌بندی، متریال یا استایل مورد نظر را بنویسید..."
                  className="w-full h-14 bg-[#181818] border border-white/10 rounded-2xl pr-12 pl-12 text-sm md:text-base text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 transition-all"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => {
                      setKeyword("");
                      applyFiltersToUrl({ q: null });
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button
                type="submit"
                className="h-14 px-8 rounded-2xl bg-white text-black font-black hover:bg-gray-200 transition-all shadow-lg shrink-0"
              >
                جستجو
              </Button>
            </form>
          </div>
        </div>

        {/* Catalog Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            {/* Mobile Filter Sheet Trigger */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 px-4 rounded-xl border-white/10 bg-white/5 text-white font-bold text-xs flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4 text-amber-400" />
                    فیلترها {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-[#0f0f0f] border-l border-white/10 text-white w-[300px] overflow-y-auto p-6" dir="rtl">
                  <SheetHeader className="text-right pb-4 border-b border-white/10 mb-6">
                    <SheetTitle className="text-white text-lg font-black">فیلترهای جستجو</SheetTitle>
                  </SheetHeader>
                  <FilterSidebar />
                </SheetContent>
              </Sheet>
            </div>

            <p className="text-xs md:text-sm text-gray-400">
              نمایش <span className="font-bold text-white">{products.length}</span> محصول از مجموع{" "}
              <span className="font-bold text-white">{totalCount}</span> کالا
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 shrink-0">مرتب‌سازی:</span>
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 px-4 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-xs flex items-center gap-2"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  {SORT_OPTIONS.find((s) => s.value === selectedSort)?.label || "جدیدترین‌ها"}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#181818] border-white/10 text-white rounded-xl shadow-2xl">
                {SORT_OPTIONS.map((sortItem) => (
                  <DropdownMenuItem
                    key={sortItem.value}
                    onClick={() => {
                      setSelectedSort(sortItem.value);
                      applyFiltersToUrl({ sort: sortItem.value });
                    }}
                    className={`text-xs cursor-pointer py-2.5 px-4 rounded-lg flex items-center justify-between ${
                      selectedSort === sortItem.value
                        ? "bg-white/10 font-bold text-amber-400"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    <span>{sortItem.label}</span>
                    {selectedSort === sortItem.value && <Check className="w-3.5 h-3.5" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Desktop Left Sticky Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-28 bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-xl">
            <FilterSidebar />
          </aside>

          {/* Right Product Grid */}
          <main className="lg:col-span-9 space-y-8">
            {isLoading ? (
              // Loading Skeletons
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-[#111111] border border-white/5 rounded-2xl p-3 space-y-4">
                    <div className="aspect-[3/4] bg-white/5 rounded-xl" />
                    <div className="space-y-2 px-1">
                      <div className="h-3 bg-white/5 rounded w-1/3" />
                      <div className="h-4 bg-white/5 rounded w-3/4" />
                      <div className="h-4 bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              // Empty State
              <div className="bg-[#111111] border border-white/10 rounded-3xl p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                  <Search className="w-8 h-8 text-gray-500" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-lg font-black text-white">کالایی یافت نشد</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    متأسفانه کالایی با مشخصات و فیلترهای انتخابی شما پیدا نشد. لطفاً کلمات کلیدی دیگری را امتحان کنید یا فیلترها را حذف کنید.
                  </p>
                </div>
                <Button
                  onClick={handleClearAll}
                  className="h-11 px-6 rounded-xl bg-white text-black font-bold hover:bg-gray-200"
                >
                  حذف تمام فیلترها
                </Button>
              </div>
            ) : (
              // Products Grid
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
                {products.map((product) => {
                  const isWishlisted = wishlistItems.some((w) => w.id === product.id);
                  const img = product.image || product.imageUrl || "/globe.svg";

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="group bg-[#111111] border border-white/10 hover:border-white/20 rounded-3xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-[3/4] overflow-hidden bg-black/40">
                        <Link href={`/products/${product.id}`} className="block h-full w-full">
                          <img
                            src={img}
                            alt={product.title || product.name || "محصول"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                            loading="lazy"
                          />
                        </Link>

                        {/* Wishlist Button */}
                        <button
                          onClick={() => {
                            if (isWishlisted) {
                              removeWishlist(product.id);
                              toast.info("از لیست علاقه‌مندی‌ها حذف شد");
                            } else {
                              addWishlist({
                                id: product.id,
                                name: product.title || product.name || "",
                                price: typeof product.price === "number" ? product.price : parseFloat(String(product.price || "0")),
                                imageUrl: img,
                                category: product.category || "فشن",
                              });
                              toast.success("به علاقه‌مندی‌ها افزوده شد");
                            }
                          }}
                          className={`absolute top-3 left-3 p-2.5 rounded-full backdrop-blur-md border transition-all z-20 cursor-pointer ${
                            isWishlisted
                              ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                              : "bg-black/40 border-white/10 text-white hover:bg-black/60"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500" : ""}`} />
                        </button>

                        {/* Badges */}
                        {product.is_new && (
                          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider z-20">
                            جدید
                          </span>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-gray-500">
                            {product.category || "پوشاک"}
                          </span>
                          <Link href={`/products/${product.id}`} className="block">
                            <h3 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors line-clamp-1">
                              {product.title || product.name}
                            </h3>
                          </Link>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <span className="text-sm font-black text-white">
                            {formatPrice(product.price)}
                          </span>
                          <Link
                            href={`/products/${product.id}`}
                            className="text-xs text-gray-400 hover:text-amber-400 transition-colors font-medium"
                          >
                            مشاهده
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="h-10 px-4 rounded-xl border-white/10 bg-white/5 text-white disabled:opacity-30"
                >
                  صفحه قبل
                </Button>
                <span className="text-xs text-gray-400 px-4 font-bold">
                  صفحه {currentPage} از {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="h-10 px-4 rounded-xl border-white/10 bg-white/5 text-white disabled:opacity-30"
                >
                  صفحه بعد
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
          <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
