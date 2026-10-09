"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  TrendingUp,
  Sparkles,
  Truck,
  ShieldCheck,
  RefreshCw,
  Headphones,
  ArrowRight,
  Clock,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { getCategories, CategoryItem, DEFAULT_CATEGORIES } from "@/lib/categories";
import { formatPrice, parsePrice, getDiscountInfo } from "@/lib/price-utils";

import { MOCK_PRODUCTS } from "@/lib/mock-data";

interface HeroSlide {
  id: string | number;
  title: string;
  subtitle: string;
  badge?: string;
  cta_label?: string;
  cta_link?: string;
  image_url: string;
}

const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    title: "کالکشن جدید پاییز و زمستان ۲۰۲۶ ماوی",
    subtitle: "تلفیق اصالت طراحی مدیترانه‌ای با مرغوب‌ترین الیاف کشمیر، ابریشم و چرم طبیعی ایتالیا",
    badge: "کالکشن جدید ۲۰۲۶",
    cta_label: "مشاهده کالکشن",
    cta_link: "/products?sort=newest",
    image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1920&auto=format&fit=crop",
  },
  {
    id: "slide-2",
    title: "حراج بزرگ میان‌فصل ماوی — تا ۵۰٪ تخفیف",
    subtitle: "فرصت استثنایی خرید شیک‌ترین استایل‌های زنانه و مردانه با تخفیف‌های ویژه و محدود",
    badge: "فروش شگفت‌انگیز",
    cta_label: "مشاهده حراج فصل",
    cta_link: "/products?has_discount=true",
    image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1920&auto=format&fit=crop",
  },
  {
    id: "slide-3",
    title: "کیف و اکسسوری‌های چرم دست‌دوز ایتالیایی",
    subtitle: "طراحی مینیمال، یراق‌آلات آبکاری طلای ۲۴ عیار و ساختار دقیق برای استایل‌های فاخر",
    badge: "دست‌ساز لوکس",
    cta_label: "خرید اکسسوری‌ها",
    cta_link: "/products?category=accessories",
    image_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1920&auto=format&fit=crop",
  },
];

const DEFAULT_ANNOUNCEMENT = {
  text: "ارسال رایگان برای خریدهای بالای ۲,۰۰۰,۰۰۰ تومان به سراسر کشور با کد MAVI2026",
  badge: "پیشنهاد ماوی",
  link: "/products?has_discount=true",
  enabled: true,
};

interface HomeClientProps {
  initialHero?: any;
  initialAnnouncement?: any;
  initialDiscountSection?: any;
  initialCategories?: any[];
  initialPopular?: any[];
  initialDiscounted?: any[];
  initialProducts?: any[];
}

export default function HomeClient({
  initialHero,
  initialAnnouncement,
  initialDiscountSection,
  initialCategories,
  initialPopular,
  initialDiscounted,
  initialProducts,
}: HomeClientProps) {
  // Discount Campaign State
  const [discountSection, setDiscountSection] = useState<any>(() => {
    return initialDiscountSection?.discount_section || initialDiscountSection || null;
  });
  // 1. Hero Content & Slides State
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => {
    const unwrapped = initialHero?.hero || initialHero;
    if (unwrapped?.slides && Array.isArray(unwrapped.slides) && unwrapped.slides.length > 0) {
      return unwrapped.slides;
    }
    if (unwrapped?.image_url) {
      return [
        {
          id: "custom-slide-1",
          title: unwrapped.headline || DEFAULT_HERO_SLIDES[0].title,
          subtitle: unwrapped.subtitle || DEFAULT_HERO_SLIDES[0].subtitle,
          badge: unwrapped.badge || DEFAULT_HERO_SLIDES[0].badge,
          cta_label: unwrapped.cta_label || DEFAULT_HERO_SLIDES[0].cta_label,
          cta_link: unwrapped.cta_link || DEFAULT_HERO_SLIDES[0].cta_link,
          image_url: unwrapped.image_url,
        },
        ...DEFAULT_HERO_SLIDES.slice(1),
      ];
    }
    return DEFAULT_HERO_SLIDES;
  });

  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // 2. Announcement State
  const [announcement, setAnnouncement] = useState<any>(() => {
    const unwrapped = initialAnnouncement?.announcement || initialAnnouncement;
    if (unwrapped && unwrapped.text) {
      return { ...DEFAULT_ANNOUNCEMENT, ...unwrapped };
    }
    return DEFAULT_ANNOUNCEMENT;
  });

  // 3. Categories State (Curated full set of categories without test names)
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    let source = DEFAULT_CATEGORIES;
    if (initialCategories && initialCategories.length > 0) {
      const cleanList = initialCategories
        .filter((c: any) => !c.name?.toLowerCase().includes("test") && c.name?.length > 1 && !c.parent_id)
        .map((c: any) => ({
          id: String(c.id),
          name: c.name || c.title,
          slug: c.slug || String(c.id),
        }));
      if (cleanList.length >= 4) {
        const existingNames = new Set(cleanList.map((c: any) => c.name));
        const missingDefaults = DEFAULT_CATEGORIES.filter((d) => !existingNames.has(d.name));
        source = [...cleanList, ...missingDefaults];
      }
    }
    return source;
  });

  const categoriesRef = useRef<HTMLDivElement>(null);
  const [canScrollCategoriesPrev, setCanScrollCategoriesPrev] = useState(false);
  const [canScrollCategoriesNext, setCanScrollCategoriesNext] = useState(true);

  const checkCategoriesScroll = useCallback(() => {
    const el = categoriesRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 5) {
      setCanScrollCategoriesPrev(false);
      setCanScrollCategoriesNext(false);
      return;
    }
    const currentAbs = Math.abs(scrollLeft);
    setCanScrollCategoriesPrev(currentAbs > 10);
    setCanScrollCategoriesNext(currentAbs < maxScroll - 10);
  }, []);

  useEffect(() => {
    checkCategoriesScroll();
    window.addEventListener("resize", checkCategoriesScroll);
    return () => window.removeEventListener("resize", checkCategoriesScroll);
  }, [checkCategoriesScroll, categories]);

  const handleCategoriesScroll = (direction: "prev" | "next") => {
    const el = categoriesRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.65;
    // In RTL, "next" moves leftwards (-), "prev" moves rightwards (+)
    const delta = direction === "next" ? -scrollAmount : scrollAmount;
    el.scrollBy({ left: delta, behavior: "smooth" });
    setTimeout(checkCategoriesScroll, 350);
  };

  // 4. Products States with reliable fallback to MOCK_PRODUCTS
  const [catalogProducts, setCatalogProducts] = useState<any[]>(() => {
    const list = Array.isArray(initialProducts)
      ? initialProducts
      : (initialProducts as any)?.results || [];
    if (list.length > 0) return list;
    return MOCK_PRODUCTS;
  });

  // Newest Products (sorted newest to oldest, 24 products for 6 cards/row x 4 rows)
  const newestProducts = useMemo(() => {
    const cleanCatalog = catalogProducts.filter((p) => {
      const name = (p.name || p.title || "").toLowerCase();
      return !name.includes("test") && !name.includes("related a") && !name.includes("related b") && !name.includes("related c") && !name.includes("related d") && !name.includes("related e");
    });
    const pool = [...cleanCatalog];
    const seen = new Set(pool.map((p) => String(p.id)));
    for (const mock of MOCK_PRODUCTS) {
      if (!seen.has(String(mock.id))) {
        seen.add(String(mock.id));
        pool.push(mock);
      }
    }

    return pool
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeA && timeB && timeA !== timeB) {
          return timeB - timeA;
        }
        if (timeA && !timeB) return -1;
        if (!timeA && timeB) return 1;
        const numA = Number(a.id);
        const numB = Number(b.id);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numB - numA;
        }
        return String(b.id || "").localeCompare(String(a.id || ""));
      })
      .slice(0, 24);
  }, [catalogProducts]);

  // Client-side background sync for fresh data from backend
  useEffect(() => {
    const syncData = async () => {
      try {
        const [cats, heroRes, announceRes, catRes] = await Promise.allSettled([
          getCategories(),
          api.get("/api/site-content/hero/"),
          api.get("/api/site-content/announcement/"),
          api.get("/api/products/?ordering=newest&page_size=32"),
        ]);

        if (cats.status === "fulfilled" && cats.value?.length > 0) {
          const clean = cats.value
            .filter((c: any) => !c.name?.toLowerCase().includes("test") && c.name?.length > 1 && !c.parent_id)
            .map((c: any) => ({
              id: String(c.id),
              name: c.name || c.title,
              slug: c.slug || String(c.id),
            }));
          const list = clean.length >= 4 ? clean : cats.value
            .filter((c: any) => !c.name?.toLowerCase().includes("test") && c.name?.length > 1)
            .map((c: any) => ({
              id: String(c.id),
              name: c.name || c.title,
              slug: c.slug || String(c.id),
            }));
          if (list.length > 0) {
            const existingNames = new Set(list.map((c: any) => c.name));
            const missingDefaults = DEFAULT_CATEGORIES.filter((d) => !existingNames.has(d.name));
            setCategories([...list, ...missingDefaults]);
          }
        }

        if (heroRes.status === "fulfilled" && heroRes.value?.data) {
          const heroData = heroRes.value.data.hero || heroRes.value.data;
          if (heroData?.slides && heroData.slides.length > 0) {
            setHeroSlides(heroData.slides);
          } else if (heroData?.image_url) {
            setHeroSlides((prev) => [
              {
                id: "custom-slide-1",
                title: heroData.headline || prev[0].title,
                subtitle: heroData.subtitle || prev[0].subtitle,
                badge: heroData.badge || prev[0].badge,
                cta_label: heroData.cta_label || prev[0].cta_label,
                cta_link: heroData.cta_link || prev[0].cta_link,
                image_url: heroData.image_url,
              },
              ...prev.slice(1),
            ]);
          }
        }

        if (announceRes.status === "fulfilled" && announceRes.value?.data) {
          const annData = announceRes.value.data.announcement || announceRes.value.data;
          if (annData && annData.enabled !== false && annData.text) {
            setAnnouncement((prev: any) => ({ ...prev, ...annData }));
          }
        }

        if (catRes.status === "fulfilled" && catRes.value?.data) {
          const res = Array.isArray(catRes.value.data) ? catRes.value.data : catRes.value.data.results || [];
          if (res.length > 0) setCatalogProducts(res);
        }
      } catch (err) {
        console.warn("Background data sync notice:", err);
      }
    };

    syncData();
  }, []);

  // Hero Banner 10-second Auto Rotation Timer
  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % heroSlides.length);
  }, [heroSlides.length]);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, [heroSlides.length]);

  useEffect(() => {
    if (isPaused || heroSlides.length <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 10000); // 10 seconds auto-advance per brief specification
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, heroSlides.length]);

  // Fallback image healer for missing/broken product images
  useEffect(() => {
    const handleBrokenImages = () => {
      const images = document.querySelectorAll<HTMLImageElement>("img[data-product-img]");
      images.forEach((img) => {
        if (img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
          img.src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop";
        }
      });
    };
    handleBrokenImages();
    const timer = setTimeout(handleBrokenImages, 800);
    return () => clearTimeout(timer);
  }, [newestProducts]);

  // Safe bounded slide reference
  const currentSlideIndex = ((activeSlide % (heroSlides.length || 1)) + (heroSlides.length || 1)) % (heroSlides.length || 1);
  const currentSlide = heroSlides[currentSlideIndex] || heroSlides[0] || DEFAULT_HERO_SLIDES[0];

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    // In RTL: positive diff means swipe right-to-left (next slide)
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    setTouchStart(null);
  };

  return (
    <main className="min-h-screen bg-[#FAFCFE] pb-24 overflow-x-clip" dir="rtl">
      {/* ----------------------------------------------------------------- */}
      {/* TOP ANNOUNCEMENT RIBBON (If enabled)                              */}
      {/* ----------------------------------------------------------------- */}
      {announcement && announcement.enabled !== false ? (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-20 sm:pt-22 pb-1.5">
          <Banner
            id="top-mavi-announcement"
            variant="rainbow"
            className="rounded-xl sm:rounded-2xl border border-sky-200/80 bg-sky-50/90 shadow-sm shadow-[#0082CA]/10 backdrop-blur-xl w-full py-2 px-3 sm:px-6"
          >
            <div className="flex items-center justify-center gap-2.5 flex-wrap sm:flex-nowrap text-center max-w-full">
              <span className="bg-[#0082CA] text-white font-bold text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 shadow-sm shadow-[#0082CA]/25">
                {announcement.badge || "پیشنهاد ماوی"}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#006CA8] truncate max-w-[280px] sm:max-w-md md:max-w-xl">
                {announcement.text}
              </span>
            </div>
          </Banner>
        </div>
      ) : (
        <div className="pt-20 sm:pt-22" />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 1. MAIN HERO BANNER / SLIDER (Full-bleed edge-to-edge comp)       */}
      {/* ----------------------------------------------------------------- */}
      <section
        className="w-full px-0 pt-0 pb-4 sm:pb-6"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full h-[260px] sm:h-[340px] md:h-[450px] lg:h-[520px] overflow-hidden shadow-xl shadow-sky-950/10 border-y border-sky-100/80 bg-[#0B192C]">
          <AnimatePresence>
            <motion.div
              key={currentSlide.id || currentSlideIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 w-full h-full"
            >
              <Link
                href={currentSlide.cta_link || "/products"}
                className="block relative w-full h-full group cursor-pointer"
              >
                {/* Background Photography with Rich Gradient Scrim */}
                <img
                  src={currentSlide.image_url}
                  alt={currentSlide.title}
                  className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C]/85 via-[#0B192C]/30 to-transparent md:bg-gradient-to-r md:from-[#0B192C]/85 md:via-[#0B192C]/35 md:to-transparent" />

                {/* Banner Editorial Typography & Actions */}
                <div className="absolute inset-0 flex flex-col justify-end md:justify-center max-w-7xl mx-auto px-6 sm:px-10 md:px-16 text-right z-10 pointer-events-none">
                  <div className="max-w-2xl space-y-2 md:space-y-4 pointer-events-auto">
                    {currentSlide.badge && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white backdrop-blur-md w-fit shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                        <span className="text-[11px] sm:text-xs font-bold text-white tracking-wide">
                          {currentSlide.badge}
                        </span>
                      </div>
                    )}

                    <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight md:leading-[1.2] drop-shadow-md">
                      {currentSlide.title}
                    </h1>

                    <p className="text-xs sm:text-sm md:text-base text-sky-100/90 font-medium line-clamp-2 md:line-clamp-3 leading-relaxed max-w-xl drop-shadow">
                      {currentSlide.subtitle}
                    </p>

                    <div className="pt-2 md:pt-4">
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-[#0082CA] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#0082CA]/30 group-hover:bg-[#006CA8] transition-all transform group-hover:scale-105 active:scale-[0.98]">
                        {currentSlide.cta_label || "مشاهده و خرید"}
                        <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows (Glass Pills) */}
          {heroSlides.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  prevSlide();
                }}
                aria-label="اسلاید قبلی"
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/35 hover:bg-black/60 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  nextSlide();
                }}
                aria-label="اسلاید بعدی"
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/35 hover:bg-black/60 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Slider Dots / Progress Track */}
              <div className="absolute bottom-3 sm:bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    aria-label={`انتقال به اسلاید ${index + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      currentSlideIndex === index
                        ? "w-7 sm:w-8 bg-[#0082CA] shadow-md shadow-[#0082CA]/50"
                        : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 2. CATEGORIES SECTION (Smooth Horizontal Slider with Navigation)   */}
      {/* ----------------------------------------------------------------- */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-sky-100/70">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0082CA]" />
            <h2 className="text-sm md:text-base font-extrabold text-[#0B192C]">
              دسته‌بندی‌ها
            </h2>
          </div>
        </div>

        {/* Categories Horizontal Slider Track */}
        <div className="relative group/cats px-11 sm:px-14">
          <button
            type="button"
            onClick={() => handleCategoriesScroll("prev")}
            disabled={!canScrollCategoriesPrev}
            aria-label="دسته‌بندی‌های قبلی"
            className={cn(
              "flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full border shadow-sm backdrop-blur-sm items-center justify-center transition-all cursor-pointer",
              canScrollCategoriesPrev
                ? "bg-white/95 hover:bg-[#0082CA] text-slate-700 hover:text-white border-sky-200 shadow-md hover:shadow-lg active:scale-95"
                : "bg-white/50 text-slate-300 border-slate-200/50 opacity-40 cursor-not-allowed pointer-events-none"
            )}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div
            ref={categoriesRef}
            onScroll={checkCategoriesScroll}
            className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto pb-3 pt-1 hide-scrollbar scroll-smooth snap-x snap-mandatory flex-nowrap"
          >
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${encodeURIComponent(cat.slug || cat.name)}`}
                className="inline-flex items-center justify-center shrink-0 snap-start px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white hover:bg-sky-50 text-slate-700 hover:text-[#0082CA] border border-sky-100 shadow-sm hover:shadow-md hover:border-[#0082CA]/40 text-xs sm:text-sm font-bold transition-all active:scale-[0.97] cursor-pointer"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleCategoriesScroll("next")}
            disabled={!canScrollCategoriesNext}
            aria-label="دسته‌بندی‌های بعدی"
            className={cn(
              "flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full border shadow-sm backdrop-blur-sm items-center justify-center transition-all cursor-pointer",
              canScrollCategoriesNext
                ? "bg-white/95 hover:bg-[#0082CA] text-slate-700 hover:text-white border-sky-200 shadow-md hover:shadow-lg active:scale-95"
                : "bg-white/50 text-slate-300 border-slate-200/50 opacity-40 cursor-not-allowed pointer-events-none"
            )}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 3. NEWEST PRODUCTS GRID (6 per row, 4 rows = 24 items)            */}
      {/* ----------------------------------------------------------------- */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 sm:py-16">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8 border-b border-sky-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-[#0082CA] text-white flex items-center justify-center shadow-md shadow-[#0082CA]/25">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0B192C]">
                جدیدترین محصولات
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              جدیدترین استایل‌ها و کالکشن‌های مد روز اضافه شده به فروشگاه ماوی
            </p>
          </div>

          <Link
            href="/products"
            className="hidden sm:inline-flex items-center gap-1 text-xs md:text-sm font-bold text-[#0082CA] hover:text-[#006CA8] transition-colors"
          >
            مشاهده همه
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Responsive Grid: 2 cols on mobile, 3 on sm, 4 on md, 6 on desktop (4 rows x 6 cols = 24 cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-4.5">
          {newestProducts.map((product, index) => {
            const disc = getDiscountInfo(product);
            return (
              <div
                key={`newest-${product.id || index}`}
                className="group flex flex-col bg-white rounded-2xl md:rounded-3xl border border-sky-100/80 p-2 sm:p-2.5 shadow-sm hover:shadow-xl hover:border-sky-300 hover:-translate-y-1 transition-all duration-300"
              >
                <Link
                  href={`/products/${product.id}`}
                  className="block relative aspect-[3/4] overflow-hidden rounded-xl md:rounded-2xl bg-slate-50 mb-2 sm:mb-2.5"
                >
                  {disc.hasDiscount && (
                    <div className="absolute top-2 right-2 z-20">
                      <span className="px-2 py-0.5 rounded-full bg-[#0082CA] text-white text-[10px] font-bold shadow-md shadow-[#0082CA]/30">
                        ٪{disc.discountPercent} تخفیف
                      </span>
                    </div>
                  )}

                  <img
                    src={product.imageUrl || product.image_url || product.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop"}
                    alt={product.name || product.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                    loading="lazy"
                    data-product-img="true"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop";
                    }}
                  />

                  <div className="absolute inset-0 bg-[#0B192C]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-white text-[#0082CA] px-3.5 py-1.5 rounded-full font-bold text-xs shadow-lg flex items-center gap-1.5 transform translate-y-3 group-hover:translate-y-0 transition-all duration-300">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      مشاهده جزئیات
                    </span>
                  </div>
                </Link>

                <div className="flex flex-col px-1 pb-1 flex-1 justify-between">
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-[#0082CA] mb-0.5 block truncate">
                      {(product.category || "").split("-")[1]?.trim() || product.category || "ماوی"}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0B192C] line-clamp-1 mb-1.5">
                      {product.name || product.title}
                    </h3>
                  </div>

                  <div className="pt-1 border-t border-sky-50">
                    {disc.hasDiscount ? (
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-[#0082CA] font-black text-xs sm:text-sm">
                          {formatPrice(disc.discountPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatPrice(disc.basePrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#0B192C] font-black text-xs sm:text-sm block text-left">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prominent Bottom CTA to browse all products */}
        <div className="mt-10 sm:mt-14 flex justify-center">
          <Button
            asChild
            size="lg"
            className="rounded-full px-8 sm:px-12 py-3.5 sm:py-4 bg-[#0082CA] hover:bg-[#0072B3] text-white font-bold shadow-lg shadow-[#0082CA]/25 hover:shadow-xl hover:shadow-[#0082CA]/35 active:scale-[0.98] transition-all text-xs sm:text-sm cursor-pointer"
          >
            <Link href="/products" className="flex items-center gap-2">
              <span>مشاهده همه محصولات</span>
              <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 5.5 CMS DISCOUNT CAMPAIGN PROMOTIONAL BANNER (Above Footer)      */}
      {/* ----------------------------------------------------------------- */}
      {discountSection?.enabled && (
        <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 sm:py-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#004870] to-[#0082CA] text-white p-6 sm:p-10 md:p-12 shadow-2xl border border-sky-400/20">
            {/* Background image overlay if provided */}
            {discountSection.background_image && (
              <div className="absolute inset-0 z-0">
                <img
                  src={discountSection.background_image}
                  alt={discountSection.title || "کمپین تخفیفات ماوی"}
                  className="w-full h-full object-cover opacity-25 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B192C]/90 via-[#0B192C]/70 to-[#0082CA]/80" />
              </div>
            )}

            {/* Glowing Accent Orbs */}
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#0091DF]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              {/* Left Column: Campaign Copy */}
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-sm">
                  <Percent className="w-3.5 h-3.5 text-sky-200" />
                  <span>فروش فوق‌العاده و محدود</span>
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                  {discountSection.title || "جشنواره تخفیفات استثنایی ماوی"}
                </h2>

                <p className="text-sm sm:text-base text-sky-100/90 leading-relaxed font-normal">
                  {discountSection.subtitle ||
                    "فرصت ویژه خرید شیک‌ترین استایل‌ها و کالکشن‌های مد و پوشاک با تخفیف‌های شگفت‌انگیز"}
                </p>

                {/* Expiration Note / Badge if deadline is present */}
                {discountSection.expires_at && (
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-sky-200/90 pt-1">
                    <Clock className="w-4 h-4 text-sky-300" />
                    <span>مهلت استفاده از تخفیف‌های این کمپین محدود است.</span>
                  </div>
                )}
              </div>

              {/* Right Column: CTA Button */}
              <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-8 sm:px-10 py-4 bg-white text-[#0082CA] font-black hover:bg-sky-50 shadow-xl shadow-black/20 hover:shadow-2xl active:scale-[0.98] transition-all text-sm cursor-pointer"
                >
                  <Link
                    href={discountSection.cta_link || "/products?has_discount=true"}
                    className="flex items-center justify-center gap-2.5"
                  >
                    <span>{discountSection.cta_text || "مشاهده محصولات جشنواره"}</span>
                    <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 6. TRUST & BRAND VALUES BAR                                       */}
      {/* ----------------------------------------------------------------- */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-4 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-center">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-sky-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0082CA] flex items-center justify-center shrink-0 shadow-sm">
              <Truck className="w-5 h-5 text-[#0082CA]" />
            </div>
            <div className="text-right">
              <span className="text-xs md:text-sm font-bold text-[#0B192C] block">ارسال اکسپرس</span>
              <span className="text-[10px] md:text-xs text-slate-500 block">ارسال سریع به تمام کشور</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-sky-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0082CA] flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#0082CA]" />
            </div>
            <div className="text-right">
              <span className="text-xs md:text-sm font-bold text-[#0B192C] block">اصالت تضمینی</span>
              <span className="text-[10px] md:text-xs text-slate-500 block">متریال وارداتی درجه یک</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-sky-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0082CA] flex items-center justify-center shrink-0 shadow-sm">
              <RefreshCw className="w-5 h-5 text-[#0082CA]" />
            </div>
            <div className="text-right">
              <span className="text-xs md:text-sm font-bold text-[#0B192C] block">ضمانت تعویض</span>
              <span className="text-[10px] md:text-xs text-slate-500 block">۷ روز تعویض سایز آسان</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-sky-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0082CA] flex items-center justify-center shrink-0 shadow-sm">
              <Headphones className="w-5 h-5 text-[#0082CA]" />
            </div>
            <div className="text-right">
              <span className="text-xs md:text-sm font-bold text-[#0B192C] block">پشتیبانی ماوی</span>
              <span className="text-[10px] md:text-xs text-slate-500 block">پاسخگویی سریع ۲۴ ساعته</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
