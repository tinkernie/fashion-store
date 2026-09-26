"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Star,
  ArrowLeft,
  ShoppingBag,
  Layers,
} from "lucide-react";
import { formatPrice, getDiscountInfo } from "@/lib/price-utils";

export interface RelatedProductItem {
  id: string;
  title: string;
  slug: string;
  price: number | string;
  discount_price?: number | string | null;
  discount_percent?: number | null;
  discount_expires_at?: string | null;
  is_discount_active?: boolean;
  imageUrl?: string;
  image_url?: string;
  category?: string;
  category_slug?: string;
  average_rating?: number | null;
  reviews_count?: number;
  is_manual_pin?: boolean;
}

interface RelatedProductsSliderProps {
  products: RelatedProductItem[];
  isLoading?: boolean;
  currentProductId?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  icon?: React.ReactNode;
  headingId?: string;
}

export default function RelatedProductsSlider({
  products,
  isLoading = false,
  currentProductId,
  className = "",
  title = "محصولات مرتبط و مشابه",
  subtitle = "پیشنهادات هماهنگ بر اساس سبک، کالکشن و علایق خریداران این محصول",
  badgeLabel = "مدل",
  icon,
  headingId = "related-products-heading",
}: RelatedProductsSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Drag-to-scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Filter out current product if present in related list
  const validProducts = products.filter(
    (p) => p.id !== currentProductId && p.slug !== currentProductId
  );

  const updateScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;

    if (maxScroll <= 5) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const currentAbs = Math.abs(scrollLeft);
    // In RTL, scrollLeft starts at 0 (rightmost) and decreases (negative) as we scroll forward (leftwards).
    setCanScrollPrev(currentAbs > 10);
    setCanScrollNext(currentAbs < maxScroll - 10);

    const firstCard = container.querySelector<HTMLElement>("[data-related-card]");
    const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 280;
    const idx = Math.min(
      Math.max(0, Math.round(currentAbs / cardWidth)),
      Math.max(0, validProducts.length - 1)
    );
    setActiveIndex(idx);
  }, [validProducts.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateScrollState();
    const handleResize = () => updateScrollState();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollState, validProducts.length, isLoading]);

  const handleScroll = (direction: "prev" | "next") => {
    const container = containerRef.current;
    if (!container) return;

    const firstCard = container.querySelector<HTMLElement>("[data-related-card]");
    const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 280;
    const scrollAmount = cardWidth * 1.5;

    // In RTL, 'next' moves leftwards (negative delta), 'prev' moves rightwards (positive delta).
    const delta = direction === "next" ? -scrollAmount : scrollAmount;
    container.scrollBy({ left: delta, behavior: "smooth" });
  };

  const scrollToDot = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const cards = container.querySelectorAll<HTMLElement>("[data-related-card]");
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }
  };

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    const x = e.pageX - container.offsetLeft;
    const walk = x - startXRef.current;
    dragDistanceRef.current = Math.abs(walk);
    container.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If user dragged more than 8px, suppress navigation to avoid accidental clicks
    if (dragDistanceRef.current > 8) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <section
        className={`border-t border-white/10 pt-12 pb-6 space-y-6 ${className}`}
        aria-label="در حال بارگذاری محصولات مرتبط"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-white/5 rounded-lg animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
            <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden py-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-[260px] md:w-[280px] shrink-0 bg-[#111111] border border-white/5 rounded-2xl p-3 space-y-3"
            >
              <div className="aspect-[3/4] w-full rounded-xl bg-white/5 animate-pulse" />
              <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Graceful empty state: return null if no related products
  if (validProducts.length === 0) {
    return null;
  }

  return (
    <section
      className={`border-t border-white/10 pt-12 pb-4 space-y-6 scroll-mt-24 ${className}`}
      aria-labelledby={headingId}
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
              {icon || <Layers className="w-4 h-4" />}
            </span>
            <h2
              id={headingId}
              className="text-xl md:text-2xl font-black text-white tracking-normal"
            >
              {title}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300">
              {validProducts.length.toLocaleString("fa-IR")} {badgeLabel}
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-400 font-normal">
            {subtitle}
          </p>
        </div>

        {/* Carousel Navigation Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => handleScroll("prev")}
            disabled={!canScrollPrev}
            aria-label="محصولات قبلی"
            className="w-11 h-11 rounded-xl bg-[#141414] border border-white/10 text-white flex items-center justify-center transition-all hover:bg-white hover:text-black hover:border-white active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#141414] disabled:hover:text-white disabled:hover:border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("next")}
            disabled={!canScrollNext}
            aria-label="محصولات بعدی"
            className="w-11 h-11 rounded-xl bg-[#141414] border border-white/10 text-white flex items-center justify-center transition-all hover:bg-white hover:text-black hover:border-white active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#141414] disabled:hover:text-white disabled:hover:border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Slider Track */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div
          ref={containerRef}
          onScroll={updateScrollState}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-4 pt-1 hide-scrollbar snap-x snap-mandatory select-none touch-pan-x ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {validProducts.map((item) => {
            const imageSrc =
              item.imageUrl ||
              item.image_url ||
              "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop";

            const disc = getDiscountInfo({
              price: item.price,
              discount_price: item.discount_price,
              discount_percent: item.discount_percent,
              is_discount_active: item.is_discount_active,
            });

            return (
              <div
                key={item.id}
                data-related-card
                className="w-[240px] sm:w-[260px] md:w-[280px] shrink-0 snap-start group"
              >
                <Link
                  href={`/products/${item.slug || item.id}`}
                  onClick={handleCardClick}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-2xl"
                >
                  <div className="bg-[#111111] border border-white/10 rounded-2xl p-3 transition-all duration-300 hover:border-amber-400/40 hover:bg-[#151515] hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col h-full">
                    {/* Card Image Container */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-900 border border-white/5">
                      <img
                        src={imageSrc}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                      />

                      {/* Dark gradient overlay on bottom for contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between gap-1 z-10">
                        {item.is_manual_pin ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 backdrop-blur-md shadow-sm">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            پیشنهاد استایلیست
                          </span>
                        ) : disc.hasDiscount ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black backdrop-blur-md shadow-sm">
                            ٪{disc.discountPercent} تخفیف
                          </span>
                        ) : (
                          <span />
                        )}

                        {item.category && (
                          <span className="text-[10px] font-medium text-gray-300 bg-black/60 border border-white/10 backdrop-blur-md px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {/* Bottom Quick Action on Hover */}
                      <div className="absolute bottom-2.5 inset-x-2.5 z-10 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="w-full h-9 rounded-lg bg-white/95 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg backdrop-blur-sm">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>مشاهده و انتخاب</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content Details */}
                    <div className="mt-3 flex flex-col flex-1 justify-between space-y-2 px-1">
                      <div className="space-y-1">
                        <h3 className="text-xs md:text-sm font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                          {item.title}
                        </h3>

                        {/* Rating (if present) */}
                        {item.average_rating != null && (
                          <div className="flex items-center gap-1 text-amber-400 text-[11px]">
                            <Star className="w-3 h-3 fill-current text-amber-400" />
                            <span className="font-bold">
                              {Number(item.average_rating).toLocaleString("fa-IR", {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              })}
                            </span>
                            {Boolean(item.reviews_count) && (
                              <span className="text-gray-500 text-[10px]">
                                ({Number(item.reviews_count).toLocaleString("fa-IR")})
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Price Section */}
                      <div className="pt-1 border-t border-white/5 flex items-baseline justify-between gap-2">
                        {disc.hasDiscount ? (
                          <div className="flex flex-col">
                            <span className="text-[11px] text-gray-400 line-through">
                              {formatPrice(disc.basePrice)}
                            </span>
                            <span className="text-xs md:text-sm font-black text-emerald-400">
                              {formatPrice(disc.discountPrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs md:text-sm font-bold text-white">
                            {formatPrice(item.price)}
                          </span>
                        )}

                        <span className="text-gray-500 group-hover:text-amber-400 transition-colors">
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Mobile Swipe Hint and Dots Progress */}
        <div className="mt-3 flex items-center justify-between px-1">
          <span className="text-[11px] text-gray-500 sm:hidden">
            برای مشاهده موارد بیشتر بکشید ←
          </span>

          {/* Pagination Indicators */}
          {validProducts.length > 1 && (
            <div className="flex items-center gap-1.5 mr-auto">
              {validProducts.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToDot(i)}
                  aria-label={`رفتن به اسلاید ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? "w-6 bg-amber-400"
                      : "w-1.5 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
