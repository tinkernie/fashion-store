"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  TrendingUp,
  Sparkles,
  Flame,
  Tag,
  Truck,
  ShieldCheck,
  RefreshCw,
  Headphones,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
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
  initialCategories?: any[];
  initialPopular?: any[];
  initialDiscounted?: any[];
  initialProducts?: any[];
}

export default function HomeClient({
  initialHero,
  initialAnnouncement,
  initialCategories,
  initialPopular,
  initialDiscounted,
  initialProducts,
}: HomeClientProps) {
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

  // 3. Categories State (Curated top 8 clean items without cluttered test names)
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
      if (cleanList.length >= 4) source = cleanList;
    }
    return source.slice(0, 8);
  });

  // 4. Products States with reliable fallback to MOCK_PRODUCTS
  const [popularProducts, setPopularProducts] = useState<any[]>(() => {
    const list = Array.isArray(initialPopular)
      ? initialPopular
      : (initialPopular as any)?.results || [];
    if (list.length >= 6) return list.slice(0, 10);
    return MOCK_PRODUCTS.slice(0, 10);
  });

  const [discountedProducts, setDiscountedProducts] = useState<any[]>(() => {
    const list = Array.isArray(initialDiscounted)
      ? initialDiscounted
      : (initialDiscounted as any)?.results || [];
    const valid = list.filter((p: any) => getDiscountInfo(p).hasDiscount);
    if (valid.length >= 4) return valid.slice(0, 10);
    return MOCK_PRODUCTS.filter((p) => p.compare_at_price && p.compare_at_price > p.price).slice(0, 10);
  });

  const [catalogProducts, setCatalogProducts] = useState<any[]>(() => {
    const list = Array.isArray(initialProducts)
      ? initialProducts
      : (initialProducts as any)?.results || [];
    if (list.length > 0) return list;
    return MOCK_PRODUCTS;
  });

  // Random Discovery Products (Deduplicated against popular and discounted)
  const [discoveryProducts, setDiscoveryProducts] = useState<any[]>(() => {
    return MOCK_PRODUCTS.slice(0, 12);
  });

  // Calculate non-duplicate discovery products
  useEffect(() => {
    const popularIds = new Set(popularProducts.map((p) => String(p.id)));
    const discountIds = new Set(discountedProducts.map((p) => String(p.id)));

    // Filter out products already featured in marquees
    const nonFeatured = catalogProducts.filter(
      (p) => !popularIds.has(String(p.id)) && !discountIds.has(String(p.id))
    );

    // If we have enough non-featured, use them; otherwise fill from catalog and MOCK_PRODUCTS
    let pool = nonFeatured.length >= 8 ? nonFeatured : [...nonFeatured, ...catalogProducts, ...MOCK_PRODUCTS];

    // Deduplicate by ID
    const seen = new Set();
    const unique = pool.filter((p) => {
      const id = String(p.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    // Deterministic shuffle for variety
    const shuffled = [...unique].sort(() => 0.5 - Math.random());
    setDiscoveryProducts(shuffled.slice(0, 12));
  }, [catalogProducts, popularProducts, discountedProducts]);

  // Client-side background sync for fresh data from backend
  useEffect(() => {
    const syncData = async () => {
      try {
        const [cats, heroRes, announceRes, popRes, discRes, catRes] = await Promise.allSettled([
          getCategories(),
          api.get("/api/site-content/hero/"),
          api.get("/api/site-content/announcement/"),
          api.get("/api/products/?ordering=popularity&page_size=12"),
          api.get("/api/products/?has_discount=true&page_size=12"),
          api.get("/api/products/?page_size=32"),
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
            setCategories(list.slice(0, 8));
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

        if (popRes.status === "fulfilled" && popRes.value?.data) {
          const res = Array.isArray(popRes.value.data) ? popRes.value.data : popRes.value.data.results || [];
          if (res.length >= 4) setPopularProducts(res.slice(0, 10));
        }

        if (discRes.status === "fulfilled" && discRes.value?.data) {
          const res = Array.isArray(discRes.value.data) ? discRes.value.data : discRes.value.data.results || [];
          const validDiscounts = res.filter((p: any) => getDiscountInfo(p).hasDiscount);
          if (validDiscounts.length >= 4) setDiscountedProducts(validDiscounts.slice(0, 10));
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
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-2">
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
        <div className="pt-24 md:pt-28" />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 1. MAIN HERO BANNER / SLIDER (Digistyle-inspired Full-bleed comp) */}
      {/* ----------------------------------------------------------------- */}
      <section
        className="w-full max-w-7xl mx-auto px-4 md:px-6 py-3 sm:py-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full h-[230px] sm:h-[300px] md:h-[420px] lg:h-[460px] rounded-2xl md:rounded-3xl overflow-hidden shadow-xl shadow-sky-950/10 border border-sky-100/80 bg-[#0B192C]">
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
                <div className="absolute inset-0 flex flex-col justify-end md:justify-center p-6 sm:p-8 md:p-14 max-w-2xl text-right z-10 space-y-2 md:space-y-4">
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
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/35 hover:bg-black/60 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  nextSlide();
                }}
                aria-label="اسلاید بعدی"
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/35 hover:bg-black/60 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
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
      {/* 2. CATEGORIES SECTION (Clean Shaped Buttons with Titles Only)     */}
      {/* ----------------------------------------------------------------- */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-sky-100/70">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0082CA]" />
            <h2 className="text-sm md:text-base font-extrabold text-[#0B192C]">
              دسته‌بندی‌های برگزیده ماوی
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs md:text-sm font-bold text-[#0082CA] hover:text-[#006CA8] transition-colors flex items-center gap-1"
          >
            مشاهده همه
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Clean Shaped Pill Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto pb-3 pt-1 hide-scrollbar snap-x md:flex-wrap md:justify-center">
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
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 3. POPULAR PRODUCTS MARQUEE (Continuous Smooth Looping Marquee)    */}
      {/* ----------------------------------------------------------------- */}
      {popularProducts.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 sm:py-12">
          {/* Section Header */}
          <div className="flex items-end justify-between mb-6 border-b border-sky-100 pb-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-[#0082CA] text-white flex items-center justify-center shadow-md shadow-[#0082CA]/25">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0B192C]">
                  محبوب‌ترین‌های ماوی
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                پرفروش‌ترین و موردعلاقه‌ترین استایل‌های این فصل بر اساس انتخاب خریداران
              </p>
            </div>

            <Link
              href="/products?ordering=popularity"
              className="hidden sm:inline-flex items-center gap-1 text-xs md:text-sm font-bold text-[#0082CA] hover:text-[#006CA8] transition-colors"
            >
              مشاهده همه
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Marquee Track Container with Side Gradient Fade Masks */}
          <div className="relative overflow-hidden w-full marquee-fade-mask pause-on-hover py-2" dir="ltr">
            <div className="animate-marquee-track flex gap-4 sm:gap-6">
              {/* Repeated array rendering for seamless infinite looping */}
              {[...popularProducts, ...popularProducts, ...popularProducts].map((product, idx) => {
                const disc = getDiscountInfo(product);
                return (
                  <div
                    key={`popular-${product.id}-${idx}`}
                    className="w-[170px] sm:w-[210px] md:w-[240px] shrink-0 group flex flex-col"
                    dir="rtl"
                  >
                    <Link
                      href={`/products/${product.id}`}
                      className="block relative aspect-[3/4] overflow-hidden rounded-2xl bg-white border border-sky-100 shadow-sm hover:shadow-lg hover:border-sky-300 transition-all mb-2 sm:mb-3"
                    >
                      {disc.hasDiscount && (
                        <div className="absolute top-2.5 right-2.5 z-20">
                          <span className="px-2 py-0.5 rounded-full bg-[#0082CA] text-white text-[10px] font-bold shadow-md shadow-[#0082CA]/30">
                            ٪{disc.discountPercent} تخفیف
                          </span>
                        </div>
                      )}
                      <img
                        src={product.imageUrl || product.image_url || product.image}
                        alt={product.name || product.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-[#0B192C]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="bg-white text-[#0082CA] px-3.5 py-1.5 rounded-full font-bold text-xs shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          مشاهده
                        </span>
                      </div>
                    </Link>

                    <div className="flex flex-col px-1">
                      <span className="text-[11px] font-semibold text-[#0082CA] mb-0.5">
                        {(product.category || "").split("-")[1]?.trim() || product.category || "ماوی"}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#0B192C] line-clamp-1 mb-1">
                        {product.name || product.title}
                      </h3>
                      {disc.hasDiscount ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-[#0082CA] font-extrabold text-xs sm:text-sm">
                            {formatPrice(disc.discountPrice)}
                          </span>
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatPrice(disc.basePrice)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#0B192C] font-extrabold text-xs sm:text-sm">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 4. DISCOUNTED PRODUCTS MARQUEE (Continuous Loop for Active Deals) */}
      {/* ----------------------------------------------------------------- */}
      {discountedProducts.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 sm:py-12">
          {/* Section Header */}
          <div className="flex items-end justify-between mb-6 border-b border-sky-100 pb-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-[#0082CA] text-white flex items-center justify-center shadow-md shadow-[#0082CA]/25">
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0B192C]">
                  حراج و تخفیف‌های ویژه ماوی
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                فرصت طلایی خرید استایل‌های محبوب با تخفیف‌های استثنایی و محدود
              </p>
            </div>

            <Link
              href="/products?has_discount=true"
              className="hidden sm:inline-flex items-center gap-1 text-xs md:text-sm font-bold text-[#0082CA] hover:text-[#006CA8] transition-colors"
            >
              مشاهده همه حراج‌ها
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Marquee Track Container with Side Gradient Fade Masks */}
          <div className="relative overflow-hidden w-full marquee-fade-mask pause-on-hover py-2" dir="ltr">
            <div className="animate-marquee-track-fast flex gap-4 sm:gap-6">
              {/* Repeated array rendering for seamless infinite looping */}
              {[...discountedProducts, ...discountedProducts, ...discountedProducts].map((product, idx) => {
                const disc = getDiscountInfo(product);
                return (
                  <div
                    key={`discount-${product.id}-${idx}`}
                    className="w-[170px] sm:w-[210px] md:w-[240px] shrink-0 group flex flex-col"
                    dir="rtl"
                  >
                    <Link
                      href={`/products/${product.id}`}
                      className="block relative aspect-[3/4] overflow-hidden rounded-2xl bg-white border border-sky-100 shadow-sm hover:shadow-lg hover:border-sky-300 transition-all mb-2 sm:mb-3"
                    >
                      <div className="absolute top-2.5 right-2.5 z-20">
                        <span className="px-2 py-0.5 rounded-full bg-[#0082CA] text-white text-[10px] font-bold shadow-md shadow-[#0082CA]/30">
                          ٪{disc.discountPercent || 25} تخفیف
                        </span>
                      </div>
                      <img
                        src={product.imageUrl || product.image_url || product.image}
                        alt={product.name || product.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-[#0B192C]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="bg-white text-[#0082CA] px-3.5 py-1.5 rounded-full font-bold text-xs shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          مشاهده
                        </span>
                      </div>
                    </Link>

                    <div className="flex flex-col px-1">
                      <span className="text-[11px] font-semibold text-[#0082CA] mb-0.5">
                        {(product.category || "").split("-")[1]?.trim() || product.category || "حراج فصل"}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#0B192C] line-clamp-1 mb-1">
                        {product.name || product.title}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[#0082CA] font-extrabold text-xs sm:text-sm">
                          {formatPrice(disc.discountPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatPrice(disc.basePrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 5. RANDOM PRODUCTS DISCOVERY GRID (Main Discovery Catalog Area)   */}
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
                کشف استایل‌های متنوع ماوی
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              مجموعه‌ای متنوع از جدیدترین پوشاک، پیراهن، شومیز و استایل‌های روزمره و رسمی
            </p>
          </div>

          <Link
            href="/products"
            className="hidden sm:inline-flex items-center gap-1 text-xs md:text-sm font-bold text-[#0082CA] hover:text-[#006CA8] transition-colors"
          >
            مشاهده کاتالوگ کامل
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Responsive Grid: 2 cols on mobile, 3 cols on tablet, 4 cols on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 md:gap-6">
          {discoveryProducts.map((product, index) => {
            const disc = getDiscountInfo(product);
            return (
              <div
                key={`discovery-${product.id || index}`}
                className="group flex flex-col bg-white rounded-2xl md:rounded-3xl border border-sky-100/80 p-2 sm:p-2.5 shadow-sm hover:shadow-xl hover:border-sky-300 hover:-translate-y-1 transition-all duration-300"
              >
                <Link
                  href={`/products/${product.id}`}
                  className="block relative aspect-[3/4] overflow-hidden rounded-xl md:rounded-2xl bg-slate-50 mb-2 sm:mb-3"
                >
                  {disc.hasDiscount && (
                    <div className="absolute top-2 right-2 z-20">
                      <span className="px-2 py-0.5 rounded-full bg-[#0082CA] text-white text-[10px] font-bold shadow-md shadow-[#0082CA]/30">
                        ٪{disc.discountPercent} تخفیف
                      </span>
                    </div>
                  )}

                  <img
                    src={product.imageUrl || product.image_url || product.image}
                    alt={product.name || product.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 bg-[#0B192C]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-white text-[#0082CA] px-4 py-2 rounded-full font-bold text-xs shadow-lg flex items-center gap-1.5 transform translate-y-3 group-hover:translate-y-0 transition-all duration-300">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      مشاهده جزئیات
                    </span>
                  </div>
                </Link>

                <div className="flex flex-col px-1.5 pb-1 flex-1 justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-[#0082CA] mb-0.5 block truncate">
                      {(product.category || "").split("-")[1]?.trim() || product.category || "ماوی"}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0B192C] line-clamp-1 mb-1.5">
                      {product.name || product.title}
                    </h3>
                  </div>

                  <div className="pt-1 border-t border-sky-50">
                    {disc.hasDiscount ? (
                      <div className="flex items-baseline justify-between">
                        <span className="text-[#0082CA] font-black text-xs sm:text-base">
                          {formatPrice(disc.discountPrice)}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                          {formatPrice(disc.basePrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#0B192C] font-black text-xs sm:text-base block text-left">
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
            className="rounded-full px-8 sm:px-12 py-3.5 sm:py-4 bg-[#0082CA] text-white font-bold hover:bg-[#006CA8] shadow-lg shadow-[#0082CA]/25 hover:shadow-xl active:scale-[0.98] transition-all text-xs sm:text-sm cursor-pointer"
          >
            <Link href="/products" className="flex items-center gap-2">
              مشاهده همه محصولات کاتالوگ ماوی
              <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
            </Link>
          </Button>
        </div>
      </section>

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
