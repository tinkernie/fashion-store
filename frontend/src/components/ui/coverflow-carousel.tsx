"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
}

export function CoverflowCarousel({
  slides,
  rotate = 44,
  depth = 0.6,
  perspective = 3,
  falloff = 0.56,
  fade = 0.1,
  cardWidth = "clamp(200px, 32vw, 320px)",
  gap = 0.05,
  loop = true,
  showCaption = false,
  showPagination = false,
  showNavigation = false,
  label = "Cover carousel",
  className,
  cardClassName,
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

  /** Nearest whole card, folded back into 0..count-1. */
  const indexAt = React.useCallback(
    (pos: number) => ((Math.round(pos) % count) + count) % count,
    [count],
  );

  // Paint straight to the DOM. Sixty state updates a second would re-render
  // every card for numbers React never needs to see.
  const paint = React.useCallback(() => {
    const width = widthRef.current;
    if (!width) return;
    const pitch = width * (1 + gap);
    const pos = posRef.current;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      // Fold the distance into the shorter way round the ring. This is the
      // whole looping mechanism — no cloned nodes, no shuffling the DOM.
      let offset = index - pos;
      if (loop) {
        offset = ((offset % count) + count) % count;
        if (offset > count / 2) offset -= count;
      }

      const distance = Math.abs(offset);
      // Both the tilt and the recession ease off as cards travel out —
      // doubling the distance adds only about half again as much of each.
      // A linear ramp folds the second card shut; this keeps it readable.
      const ramp = Math.pow(distance, falloff);
      // Capped short of edge-on so a far card never turns its back.
      const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset);

      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`;

      // A card is teleported across the ring at exactly half a turn out, so it
      // has to be gone by then or the jump is visible.
      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
      card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge);
      card.style.zIndex = String(100 - Math.round(distance));
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
        // ponytail: exponential ease-out, not a spring. Swap in a spring only
        // if the settle needs overshoot.
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
      // Take the shorter way round rather than unwinding the whole ring.
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

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
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

    const pitch = widthRef.current * (1 + gap);
    if (!pitch) return;

    const now = performance.now();
    const previous = posRef.current;
    posRef.current = clamp(drag.pos - (event.clientX - drag.x) / pitch);
    // Cards per second, for the throw.
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
    // Let a flick carry, but never more than two cards.
    const carried = Math.max(-2, Math.min(2, drag.v * 0.18));
    settle(clamp(Math.round(posRef.current + carried)));
  };

  // Card width drives pitch, depth and perspective, so it is the only thing
  // worth measuring — and only when the box actually changes.
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
    },
    [],
  );

  const active = slides[selected];

  return (
    <div
      className={cn("w-full", className)}
      style={{ ["--cf-card" as string]: cardWidth }}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="relative">
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
          // Vertical padding keeps the drop shadows clear of the overflow clip.
          className="cursor-grab overflow-hidden py-8 md:py-12 outline-none ring-ring focus-visible:ring-2 active:cursor-grabbing"
          style={{
            perspective: `calc(var(--cf-card) * ${perspective})`,
            // Horizontal drag is ours; the page keeps vertical scrolling.
            touchAction: "pan-y",
          }}
        >
          <div
            className="relative select-none"
            style={{
              height: "calc(var(--cf-card) * 1.3)",
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
                  onClick={() => {
                    if (!isSelected) {
                      goTo(index);
                    }
                  }}
                  className={cn(
                    "group absolute left-1/2 top-0 aspect-[3/4] overflow-hidden rounded-3xl bg-[#111111] border border-white/10 shadow-2xl will-change-transform cursor-pointer transition-all duration-300",
                    isSelected ? "ring-2 ring-white/30 shadow-white/5" : "hover:border-white/30",
                    cardClassName,
                  )}
                  style={{ width: "var(--cf-card)" }}
                >
                  {/* Badge */}
                  {slide.badge && (
                    <div className="absolute top-3 right-3 z-20">
                      <span className="bg-amber-400 text-black text-[10px] md:text-xs font-black px-2.5 py-1 rounded-full shadow-lg">
                        {slide.badge}
                      </span>
                    </div>
                  )}

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    draggable={false}
                    className="h-full w-full select-none object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Gradient Overlay & Quick View Link */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity flex flex-col justify-end p-4 z-10">
                    <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <p className="text-white text-sm md:text-base font-bold line-clamp-1">{slide.title}</p>
                      {slide.price && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-amber-400 text-xs md:text-sm font-black">
                            {typeof slide.price === "number" ? slide.price.toLocaleString("fa-IR") : slide.price} تومان
                          </span>
                          {slide.compareAtPrice && (
                            <span className="text-gray-400 line-through text-[10px] md:text-xs">
                              {typeof slide.compareAtPrice === "number" ? slide.compareAtPrice.toLocaleString("fa-IR") : slide.compareAtPrice}
                            </span>
                          )}
                        </div>
                      )}
                      {slide.href && isSelected && (
                        <Link
                          href={slide.href}
                          className="mt-3 inline-flex items-center justify-center gap-2 w-full py-2 px-3 bg-white text-black text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-lg"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          مشاهده و خرید
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showNavigation && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => nudge(-1)}
              className="absolute left-2 md:left-6 top-1/2 z-[200] -translate-y-1/2 rounded-full bg-black/60 border border-white/10 p-3 text-white backdrop-blur-md transition hover:bg-white hover:text-black shadow-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => nudge(1)}
              className="absolute right-2 md:right-6 top-1/2 z-[200] -translate-y-1/2 rounded-full bg-black/60 border border-white/10 p-3 text-white backdrop-blur-md transition hover:bg-white hover:text-black shadow-xl"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {showCaption && active?.title && (
        <div
          key={selected}
          className="mt-4 flex flex-col items-center px-6 duration-300 animate-in fade-in text-center"
        >
          <div className="inline-flex items-center gap-2">
            <h4 className="text-base md:text-xl font-bold tracking-tight text-white">
              {active.title}
            </h4>
            {active.badge && (
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2 py-0.5 rounded-md">
                {active.badge}
              </span>
            )}
          </div>
          
          {active.subtitle && (
            <p className="mt-1 text-xs md:text-sm text-gray-400 max-w-md">
              {active.subtitle}
            </p>
          )}

          {active.price && (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-lg md:text-2xl font-black text-amber-400">
                {typeof active.price === "number" ? active.price.toLocaleString("fa-IR") : active.price} تومان
              </span>
              {active.compareAtPrice && (
                <span className="text-sm text-gray-500 line-through">
                  {typeof active.compareAtPrice === "number" ? active.compareAtPrice.toLocaleString("fa-IR") : active.compareAtPrice} تومان
                </span>
              )}
            </div>
          )}

          {active.href && (
            <div className="mt-4">
              <Link
                href={active.href}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 text-xs md:text-sm font-bold transition-all shadow-xl"
              >
                مشاهده مشخصات کامل و انتخاب سایز
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          )}

          {active.meta && active.meta.length > 0 && (
            <dl className="mt-6 w-full max-w-sm text-xs bg-white/5 border border-white/10 rounded-2xl p-4 divide-y divide-white/5">
              {active.meta.map((row) => (
                <div key={row.label} className="flex justify-between py-2">
                  <dt className="text-gray-400">{row.label}</dt>
                  <dd className="font-bold text-white">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {showPagination && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === selected}
              onClick={() => goTo(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === selected ? "w-8 bg-white" : "w-2 bg-white/30",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
