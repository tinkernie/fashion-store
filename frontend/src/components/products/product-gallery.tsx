"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Maximize2,
  X,
  Layers,
} from "lucide-react";

interface ProductGalleryProps {
  product: any;
  discountInfo?: {
    hasDiscount: boolean;
    discountPercent?: number | null;
    remainingTime?: string | null;
  };
  matchedVariant?: any;
}

export default function ProductGallery({
  product,
  discountInfo,
  matchedVariant,
}: ProductGalleryProps) {
  // Extract all available images
  const images = useMemo(() => {
    const list: string[] = [];

    // 1. Direct images array (if backend provides top-level)
    if (Array.isArray(product?.images) && product.images.length > 0) {
      list.push(
        ...product.images
          .map((i: any) => (typeof i === "string" ? i : i?.url))
          .filter(Boolean)
      );
    }

    // 2. Metadata images array (current immediate persistence)
    if (
      Array.isArray(product?.metadata?.images) &&
      product.metadata.images.length > 0
    ) {
      list.push(
        ...product.metadata.images
          .map((i: any) => (typeof i === "string" ? i : i?.url))
          .filter(Boolean)
      );
    }

    // 3. Fallback to primary image URL
    if (list.length === 0) {
      const single = product?.imageUrl || product?.image_url || product?.image;
      if (single) list.push(single);
    }

    // 4. Ultimate fallback placeholder
    if (list.length === 0) {
      list.push("/globe.svg");
    }

    // Remove duplicates while preserving order
    return Array.from(new Set(list));
  }, [product]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep index within range if images array length changes
  useEffect(() => {
    if (currentIndex >= images.length) {
      setCurrentIndex(0);
    }
  }, [images.length, currentIndex]);

  // Scroll active thumbnail into view
  useEffect(() => {
    const activeThumb = thumbnailRefs.current[currentIndex];
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentIndex]);

  const paginate = useCallback(
    (newDirection: 1 | -1) => {
      setDirection(newDirection);
      setCurrentIndex((prev) => {
        let nextIndex = prev + newDirection;
        if (nextIndex < 0) {
          nextIndex = images.length - 1;
        } else if (nextIndex >= images.length) {
          nextIndex = 0;
        }
        return nextIndex;
      });
    },
    [images.length]
  );

  // Keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.key === "ArrowLeft") {
        // In Persian RTL, ArrowLeft navigates next
        paginate(1);
      } else if (e.key === "ArrowRight") {
        paginate(-1);
      } else if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paginate, isFullscreen]);

  // Mobile swipe gesture handler
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handleDragEnd = (
    _: any,
    { offset, velocity }: { offset: { x: number; y: number }; velocity: { x: number; y: number } }
  ) => {
    const swipe = swipePower(offset.x, velocity.x);

    // Left swipe
    if (swipe < -swipeConfidenceThreshold || offset.x < -40) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold || offset.x > 40) {
      // Right swipe
      paginate(-1);
    }
  };

  const currentImage = images[currentIndex] || "/globe.svg";

  // Framer Motion slide variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 320, damping: 32 },
        opacity: { duration: 0.25 },
        scale: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 80 : -80,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: "spring" as const, stiffness: 320, damping: 32 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <div className="space-y-4 select-none" ref={containerRef} dir="rtl">
      {/* Main Slide Viewer Container */}
      <div className="relative w-full aspect-[3/4] bg-[#111111] rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
        {/* Discount Badge on Product Photo */}
        {discountInfo?.hasDiscount && (
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1.5 pointer-events-none">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-500 text-black text-xs font-black shadow-[0_4px_15px_rgba(16,185,129,0.5)] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              ٪{discountInfo.discountPercent} تخفیف
            </span>
            {discountInfo.remainingTime && (
              <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                مهلت: {discountInfo.remainingTime}
              </span>
            )}
          </div>
        )}

        {/* Counter Badge (Top Left) */}
        {images.length > 1 && (
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <span
              className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-xs font-mono font-bold border border-white/15 flex items-center gap-1.5 shadow-lg"
              dir="ltr"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {currentIndex + 1} / {images.length}
              </span>
            </span>
          </div>
        )}

        {/* Fullscreen Expansion Button */}
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="absolute top-4 left-24 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur-md border border-white/15 transition-all opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center shadow-lg hover:scale-105"
          title="مشاهده تمام صفحه تصویر"
          aria-label="تمام صفحه"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Main Swipeable Image with Framer Motion */}
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
            >
              <img
                src={currentImage}
                alt={`${product?.name || product?.title || "محصول"} - تصویر ${currentIndex + 1}`}
                className="w-full h-full object-cover object-center pointer-events-none"
                loading="eager"
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* PC Desktop Navigation Buttons (Left & Right Sides) */}
        {images.length > 1 && (
          <>
            {/* Right Arrow Button (Next / Previous in RTL) */}
            <button
              type="button"
              onClick={() => paginate(-1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/85 text-white border border-white/15 hover:border-amber-400/50 backdrop-blur-md transition-all flex items-center justify-center shadow-xl opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="تصویر بعدی"
              title="تصویر بعدی (کلید راست)"
            >
              <ChevronRight className="w-6 h-6 text-white transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Left Arrow Button */}
            <button
              type="button"
              onClick={() => paginate(1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/85 text-white border border-white/15 hover:border-amber-400/50 backdrop-blur-md transition-all flex items-center justify-center shadow-xl opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="تصویر قبلی"
              title="تصویر قبلی (کلید چپ)"
            >
              <ChevronLeft className="w-6 h-6 text-white transition-transform group-hover:-translate-x-0.5" />
            </button>
          </>
        )}

        {/* SKU Badge (Bottom Left - desktop only to ensure clean mobile breathing room) */}
        {matchedVariant?.sku && (
          <span
            className="absolute bottom-4 left-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono text-gray-300 border border-white/10 hidden sm:inline-block max-w-[160px] truncate"
            dir="ltr"
          >
            SKU: {matchedVariant.sku}
          </span>
        )}

        {/* Mobile Swipe Guidance and Pagination Dots Overlay */}
        {images.length > 1 && (
          <div className="absolute bottom-4 inset-x-0 z-20 flex flex-col items-center gap-1.5 pointer-events-none">
            {/* Pagination Dots */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 pointer-events-auto">
              {images.map((_, idx) => (
                <button
                  key={`dot-${idx}`}
                  type="button"
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                  }}
                  className={`transition-all duration-300 rounded-full ${
                    idx === currentIndex
                      ? "w-6 h-1.5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                      : "w-1.5 h-1.5 bg-white/40 hover:bg-white/80"
                  }`}
                  aria-label={`رفتن به تصویر ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Horizontal Thumbnail Strip (Mobile Sweep & Desktop Selection) */}
      {images.length > 1 && (
        <div className="relative">
          <div
            className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 px-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
            tabIndex={0}
            role="region"
            aria-label="گالری پیش‌نمایش بندانگشتی تصاویر کالا"
          >
            {images.map((url, idx) => {
              const isActive = idx === currentIndex;

              return (
                <button
                  key={`thumb-${url}-${idx}`}
                  ref={(el) => {
                    thumbnailRefs.current[idx] = el;
                  }}
                  type="button"
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                  }}
                  className={`relative shrink-0 w-16 sm:w-20 aspect-[3/4] rounded-2xl overflow-hidden border transition-all duration-200 snap-center cursor-pointer ${
                    isActive
                      ? "border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-105 opacity-100"
                      : "border-white/10 opacity-55 hover:opacity-100 hover:border-white/30"
                  }`}
                  aria-label={`انتخاب تصویر ${idx + 1}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <img
                    src={url}
                    alt={`تصویر بندانگشتی ${idx + 1}`}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-amber-400/10 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fullscreen Modal View */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8"
            onClick={() => setIsFullscreen(false)}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 left-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
              title="بستن (Escape)"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Counter */}
            <div className="absolute top-6 right-6 z-50 text-white/80 font-mono text-sm" dir="ltr">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Large Image Container */}
            <div
              className="relative max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentImage}
                alt={product?.name || product?.title}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => paginate(-1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-xl transition-all hover:scale-110"
                    aria-label="بعدی"
                  >
                    <ChevronRight className="w-7 h-7" />
                  </button>
                  <button
                    type="button"
                    onClick={() => paginate(1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-xl transition-all hover:scale-110"
                    aria-label="قبلی"
                  >
                    <ChevronLeft className="w-7 h-7" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail selector in fullscreen */}
            {images.length > 1 && (
              <div
                className="mt-6 flex items-center gap-2 max-w-lg overflow-x-auto py-2 no-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                {images.map((url, idx) => (
                  <button
                    key={`fs-thumb-${idx}`}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-12 h-16 rounded-lg overflow-hidden border transition-all shrink-0 ${
                      idx === currentIndex
                        ? "border-amber-400 ring-2 ring-amber-400/50 scale-105"
                        : "border-white/20 opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
