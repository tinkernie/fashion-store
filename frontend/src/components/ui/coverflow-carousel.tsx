"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FlowButton } from "@/components/ui/flow-button";
import { formatPriceNumber } from "@/lib/price-utils";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export interface CoverflowSlide {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  meta?: { label: string; value: string }[];
  href?: string;
  badge?: string;
  price?: string | number;
  compareAtPrice?: string | number;
}

export interface CoverflowCarouselProps {
  slides: CoverflowSlide[];
  /** Degrees the first neighbour tilts. */
  rotate?: number;
  /** How far the first neighbour recedes, as a fraction of card width. */
  depth?: number;
  /** Viewer distance as a multiple of card width — smaller is a wider lens. */
  perspective?: number;
  /** Exponent on distance. Below 1 the rake eases off as cards travel out. */
  falloff?: number;
  /** Opacity lost per step from the centre. */
  fade?: number;
  /** Any CSS length. Everything else is derived from it, so the rake scales. */
  cardWidth?: string;
  /** Space between cards, as a fraction of card width. */
  gap?: number;
  loop?: boolean;
  showCaption?: boolean;
  showPagination?: boolean;
  showNavigation?: boolean;
  /** Names the carousel for assistive tech. */
  label?: string;
  className?: string;
  cardClassName?: string;
  /** Auto swipe interval in milliseconds (e.g. 10000) */
  autoSwipeInterval?: number;
  /** Initial delay before first auto-swipe in milliseconds (e.g. 0 or 5000) */
  autoSwipeDelay?: number;
  /** Auto swipe direction: 'right' (to the right) or 'left' */
  autoSwipeDirection?: "right" | "left";
  /** Pause auto swipe on mouse hover */
  pauseOnHover?: boolean;
}

export function CoverflowCarousel({
  slides,
  rotate = 36,
  depth = 0.52,
  perspective = 3.5,
  falloff = 0.58,
  fade = 0.12,
  cardWidth = "clamp(220px, 26vw, 310px)",
  gap = -0.05,
  loop = true,
  showCaption = false,
  showPagination = false,
  showNavigation = false,
  label = "Cover carousel",
  className,
  cardClassName,
  autoSwipeInterval,
  autoSwipeDelay,
  autoSwipeDirection = "right",
  pauseOnHover = true,
}: CoverflowCarouselProps) {
  const count = slides.length;

  const frameRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  /** Fractional card index at the centre. The single source of truth. */
  const posRef = React.useRef(0);
  /** Where the current settle is headed. Stepping off `pos` instead would
      swallow a keypress that lands mid-flight, before the round-off moves. */
  const targetRef = React.useRef(0);
  const widthRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const dragRef = React.useRef<{
    id: number;
    x: number;
    pos: number;
    v: number;
    t: number;
  } | null>(null);

  const [selected, setSelected] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const hasDraggedRef = React.useRef(false);
  const dragResetTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  /** Nearest whole card, folded back into 0..count-1. */
  const indexAt = React.useCallback(
    (pos: number) => ((Math.round(pos) % count) + count) % count,
    [count],
  );

  // Paint straight to the DOM: Playing Cards Hand Deck + Center Pop-Out
  const paint = React.useCallback(() => {
    let width = widthRef.current;
    if (!width && cardRefs.current[0]) {
      width = cardRefs.current[0].offsetWidth;
      widthRef.current = width;
    }
    if (!width) return;

    const pitch = width * (1 + gap);
    const pos = posRef.current;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      // Fold the distance into the shorter way round the ring
      let offset = index - pos;
      if (loop) {
        offset = ((offset % count) + count) % count;
        if (offset > count / 2) offset -= count;
      }

      const distance = Math.abs(offset);

      // Strict Left/Right Symmetry: hide cards far behind the deck
      if (distance > 2.25) {
        card.style.opacity = "0";
        card.style.visibility = "hidden";
        card.style.pointerEvents = "none";
        return;
      }
      card.style.visibility = "visible";

      const ramp = Math.pow(distance, falloff);

      // Pop calculation: 1 at dead center (selected card), drops to 0 on neighbors
      const pop = Math.max(0, 1 - distance * 1.15);
      
      // Selected card elevates UP (-36px), neighbor cards curve down along fan (+12px)
      const elevationY = -36 * pop + Math.min(distance * 14, 30);
      
      // Selected card steps forward in 3D (+70px)
      const popZ = pop * 70;
      
      // Cards fan slightly along Z-axis like a hand of cards
      const fanAngleZ = offset * 2.6 * (1 - pop * 0.7);
      
      // 3D perspective Y-tilt for side cards (straight 0 deg at center)
      const tilt = Math.min(rotate * ramp, 75) * Math.sign(offset) * (1 - pop * 0.6);
      
      // Scale pop for selected card
      const cardScale = 0.92 + pop * 0.16;

      // Dead-center placement: left: 50%, top: 50% with exact symmetric offset
      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateY(calc(-50% + ${elevationY}px)) ` +
        `translateZ(${popZ - depth * width * ramp}px) ` +
        `rotateY(${-tilt}deg) ` +
        `rotateZ(${fanAngleZ}deg) ` +
        `scale(${cardScale})`;

      // Fade calculation with smooth edge falloff
      const edgeFalloff = distance > 2 ? Math.max(0, (2.25 - distance) / 0.25) : 1;
      const opacity = Math.max(0, 1 - fade * distance * 1.4) * edgeFalloff;
      card.style.opacity = String(opacity);
      
      // Top stacking order: center card always elevated above hand
      card.style.zIndex = String(Math.round(150 - distance * 20 + pop * 90));
      card.style.pointerEvents = "auto";
    });
  }, [count, depth, fade, falloff, gap, loop, rotate]);

  const settle = React.useCallback(
    (target: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      targetRef.current = target;
      setSelected(indexAt(target));

      const step = () => {
        const remaining = target - posRef.current;
        if (Math.abs(remaining) < 0.0004) {
          posRef.current = target;
          paint();
          rafRef.current = null;
          return;
        }
        // Smooth exponential physics deceleration
        posRef.current += remaining * 0.16;
        paint();
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [indexAt, paint],
  );

  const clamp = React.useCallback(
    (pos: number) => (loop ? pos : Math.max(0, Math.min(count - 1, pos))),
    [count, loop],
  );

  const goTo = React.useCallback(
    (index: number) => {
      const target = loop
        ? index + Math.round((targetRef.current - index) / count) * count
        : index;
      settle(clamp(target));
    },
    [clamp, count, loop, settle],
  );

  const nudge = React.useCallback(
    (by: number) => settle(clamp(Math.round(targetRef.current) + by)),
    [clamp, settle],
  );

  // Auto-swipe functionality
  React.useEffect(() => {
    if (!autoSwipeInterval || count <= 1) return;

    let intervalId: NodeJS.Timeout | null = null;
    const directionDelta = autoSwipeDirection === "left" ? 1 : -1;
    const initialDelay = autoSwipeDelay !== undefined ? autoSwipeDelay : autoSwipeInterval;

    const timeoutId = setTimeout(() => {
      if (!pauseOnHover || !isHovered) {
        nudge(directionDelta);
      }
      intervalId = setInterval(() => {
        if (!pauseOnHover || !isHovered) {
          nudge(directionDelta);
        }
      }, autoSwipeInterval);
    }, initialDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoSwipeInterval, autoSwipeDelay, autoSwipeDirection, count, isHovered, nudge, pauseOnHover]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragResetTimerRef.current !== null) {
      clearTimeout(dragResetTimerRef.current);
      dragResetTimerRef.current = null;
    }
    hasDraggedRef.current = false;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    targetRef.current = posRef.current;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now(),
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    if (Math.abs(event.clientX - drag.x) > 6) {
      hasDraggedRef.current = true;
    }

    const pitch = widthRef.current * (1 + gap);
    if (!pitch) return;

    const now = performance.now();
    const previous = posRef.current;
    posRef.current = clamp(drag.pos - (event.clientX - drag.x) / pitch);
    drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000;
    drag.t = now;

    const index = indexAt(posRef.current);
    if (index !== selected) setSelected(index);
    paint();
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    const carried = Math.max(-2, Math.min(2, drag.v * 0.18));
    settle(clamp(Math.round(posRef.current + carried)));

    if (hasDraggedRef.current) {
      dragResetTimerRef.current = setTimeout(() => {
        hasDraggedRef.current = false;
      }, 100);
    }
  };

  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const card = cardRefs.current[0];
      if (!card) return;
      widthRef.current = card.offsetWidth;
      paint();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paint]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (dragResetTimerRef.current !== null) clearTimeout(dragResetTimerRef.current);
    },
    [],
  );

  const active = slides[selected];

  return (
    <div
      className={cn("w-full select-none flex flex-col items-center", className)}
      style={{ ["--cf-card" as string]: cardWidth }}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Viewport locked to LTR coordinates for dead-center mathematical symmetry */}
      <div className="relative w-full max-w-full overflow-hidden flex justify-center" dir="ltr">
        <div
          ref={frameRef}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              nudge(-1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              nudge(1);
            }
          }}
          className="w-full cursor-grab overflow-hidden pt-14 pb-16 md:pt-16 md:pb-20 outline-none ring-ring focus-visible:ring-2 active:cursor-grabbing flex justify-center items-center"
          style={{
            perspective: `calc(var(--cf-card) * ${perspective})`,
            perspectiveOrigin: "50% 50%",
            touchAction: "pan-y",
          }}
        >
          <div
            className="relative select-none w-full flex justify-center items-center"
            style={{
              height: "calc(var(--cf-card) * 1.38)",
              transformStyle: "preserve-3d",
            }}
          >
            {slides.map((slide, index) => {
              const isSelected = index === selected;
              return (
                <div
                  key={index}
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${count}`}
                  aria-hidden={!isSelected}
                  className={cn(
                    "absolute left-1/2 top-1/2 aspect-[3/4] w-[var(--cf-card)] overflow-hidden rounded-3xl bg-white border shadow-xl transition-[border-color,box-shadow] duration-300 group cursor-pointer will-change-transform",
                    isSelected
                      ? "border-[#0082CA] shadow-2xl shadow-[#0082CA]/15 ring-2 ring-[#0082CA]/30"
                      : "border-sky-100 opacity-80 hover:opacity-100 hover:border-sky-200",
                    cardClassName,
                  )}
                >
                  {slide.href ? (
                    <Link
                      href={slide.href}
                      aria-label={slide.title || slide.alt || `محصول ${index + 1}`}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={(e) => {
                        if (hasDraggedRef.current) {
                          e.preventDefault();
                          return;
                        }
                        if (index !== selected) {
                          e.preventDefault();
                          goTo(index);
                        }
                      }}
                      className="relative block h-full w-full overflow-hidden"
                    >
                      <img
                        src={slide.src}
                        alt={slide.alt}
                        draggable={false}
                        className="h-full w-full select-none object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />

                      {/* Gentle deep Aegean gradient for text readability over photo */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C]/90 via-[#0B192C]/30 to-transparent pointer-events-none" />

                      {/* Top Badge */}
                      {slide.badge && (
                        <div className="absolute top-4 right-4 z-10" dir="rtl">
                          <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-white/95 text-[#0082CA] border border-sky-100 shadow-md backdrop-blur-md">
                            {slide.badge}
                          </span>
                        </div>
                      )}

                      {/* Card Content Overlay */}
                      <div className="absolute bottom-0 inset-x-0 p-5 z-10 flex flex-col justify-end text-right" dir="rtl">
                        {slide.subtitle && (
                          <span className="text-[11px] font-semibold text-sky-200 mb-1 tracking-wide">
                            {slide.subtitle}
                          </span>
                        )}
                        {slide.title && (
                          <h3 className="text-base md:text-lg font-bold text-white leading-snug drop-shadow-sm">
                            {slide.title}
                          </h3>
                        )}
                        {slide.price && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm font-black text-white">
                              {formatPriceNumber(slide.price)} تومان
                            </span>
                            {slide.compareAtPrice && (
                              <span className="text-xs text-sky-200/70 line-through">
                                {formatPriceNumber(slide.compareAtPrice)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div
                      onClick={() => {
                        if (hasDraggedRef.current) return;
                        if (index !== selected) goTo(index);
                      }}
                      className="relative block h-full w-full overflow-hidden"
                    >
                      <img
                        src={slide.src}
                        alt={slide.alt}
                        draggable={false}
                        className="h-full w-full select-none object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />

                      {/* Gentle deep Aegean gradient for text readability over photo */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C]/90 via-[#0B192C]/30 to-transparent pointer-events-none" />

                      {/* Top Badge */}
                      {slide.badge && (
                        <div className="absolute top-4 right-4 z-10" dir="rtl">
                          <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-white/95 text-[#0082CA] border border-sky-100 shadow-md backdrop-blur-md">
                            {slide.badge}
                          </span>
                        </div>
                      )}

                      {/* Card Content Overlay */}
                      <div className="absolute bottom-0 inset-x-0 p-5 z-10 flex flex-col justify-end text-right" dir="rtl">
                        {slide.subtitle && (
                          <span className="text-[11px] font-semibold text-sky-200 mb-1 tracking-wide">
                            {slide.subtitle}
                          </span>
                        )}
                        {slide.title && (
                          <h3 className="text-base md:text-lg font-bold text-white leading-snug drop-shadow-sm">
                            {slide.title}
                          </h3>
                        )}
                        {slide.price && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm font-black text-white">
                              {formatPriceNumber(slide.price)} تومان
                            </span>
                            {slide.compareAtPrice && (
                              <span className="text-xs text-sky-200/70 line-through">
                                {formatPriceNumber(slide.compareAtPrice)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Arrows */}
        {showNavigation && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => nudge(-1)}
              className="absolute left-4 top-1/2 z-[200] -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 border border-sky-200 text-slate-700 flex items-center justify-center backdrop-blur-md hover:bg-[#0082CA] hover:text-white hover:border-[#0082CA] transition-all shadow-xl shadow-sky-950/10 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => nudge(1)}
              className="absolute right-4 top-1/2 z-[200] -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 border border-sky-200 text-slate-700 flex items-center justify-center backdrop-blur-md hover:bg-[#0082CA] hover:text-white hover:border-[#0082CA] transition-all shadow-xl shadow-sky-950/10 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Synchronized Specification Drawer Centered Under Selected Card */}
      {showCaption && active && (
        <div className="w-full max-w-xl mx-auto mt-4 p-6 rounded-3xl bg-white/95 border border-sky-100 backdrop-blur-xl shadow-xl shadow-sky-950/5 text-right" dir="rtl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sky-100">
            <div>
              <div className="flex items-center gap-2">
                {active.badge && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-[#0082CA] border border-sky-200">
                    {active.badge}
                  </span>
                )}
                <h4 className="text-base md:text-lg font-black text-[#0B192C]">{active.title}</h4>
              </div>
              {active.subtitle && <p className="text-xs text-slate-500 mt-1">{active.subtitle}</p>}
            </div>

            {active.price && (
              <div className="text-left sm:text-left">
                <div className="text-sm md:text-base font-black text-[#0082CA]">
                  {formatPriceNumber(active.price)} تومان
                </div>
                {active.compareAtPrice && (
                  <div className="text-xs text-slate-400 line-through">
                    {formatPriceNumber(active.compareAtPrice)} تومان
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Meta Specifications */}
          {active.meta && active.meta.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-4">
              {active.meta.map((m, i) => (
                <div key={i} className="bg-sky-50/70 rounded-xl p-2.5 border border-sky-100">
                  <div className="text-[10px] text-slate-500">{m.label}</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{m.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* CTA Link to Product with FlowButton */}
          {active.href && (
            <div className="mt-4 pt-2">
              <FlowButton
                href={active.href}
                className="w-full h-11"
              >
                مشاهده مشخصات کامل و انتخاب سایز
              </FlowButton>
            </div>
          )}
        </div>
      )}

      {/* Pagination Dots */}
      {showPagination && (
        <div className="flex justify-center items-center gap-2 mt-4" role="tablist">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === selected}
              aria-label={`Slide ${index + 1}`}
              onClick={() => goTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                index === selected
                  ? "w-8 bg-[#0082CA]"
                  : "w-2 bg-sky-200 hover:bg-sky-300",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CoverflowCarousel;
