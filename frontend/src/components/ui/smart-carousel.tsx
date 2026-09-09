"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SmartCarouselProps {
  children: React.ReactNode;
  className?: string;
  minCardWidth?: number;
  maxCardWidth?: number;
  gap?: number;
  /** Shared minimum card height — keeps product/article cards the same size across sections */
  minCardHeight?: number;
  /** Slow automatic glide (ms between steps). Pauses on hover and hidden tabs. */
  autoPlayMs?: number;
}

/**
 * Horizontal snap carousel that sizes its cards from the *measured container
 * width* (not 100vw), so cards always align flush with the section heading
 * and page padding — no half-visible cards, no uneven gutters.
 */
export function SmartCarousel({
  children,
  className,
  minCardWidth = 240,
  maxCardWidth = 320,
  gap = 16,
  minCardHeight,
  autoPlayMs,
}: SmartCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(minCardWidth);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [paused, setPaused] = useState(false);

  /* Measure the container and derive a uniform card width */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      // Max cards that fit while keeping at least minCardWidth…
      let n = Math.max(1, Math.floor((width + gap) / (minCardWidth + gap)));
      let w = (width - gap * (n - 1)) / n;
      // …but if cards overshoot maxCardWidth, squeeze more in when reasonable.
      if (w > maxCardWidth) {
        const nByMax = Math.ceil((width + gap) / (maxCardWidth + gap));
        const wByMax = (width - gap * (nByMax - 1)) / nByMax;
        if (wByMax >= minCardWidth * 0.8) {
          n = nByMax;
          w = wByMax;
        } else if (width > 340) {
          // Small screens: one card + a peek of the next, instead of a huge full-width card.
          w = width * 0.75;
        }
      }
      setCardWidth(Math.floor(w));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minCardWidth, maxCardWidth, gap]);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    // RTL carousels scroll into negative values; normalise with abs.
    const pos = Math.abs(el.scrollLeft);
    setCanPrev(pos > 2);
    setCanNext(pos < maxScroll - 2);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  const scrollByCards = useCallback(
    (direction: -1 | 1) => {
      const el = trackRef.current;
      if (!el) return;
      const step = (cardWidth + gap) * 2;
      // In RTL, "next" moves further negative — flip the sign for the visual direction.
      const rtl = getComputedStyle(el).direction === "rtl";
      const delta = rtl ? -direction : direction;
      el.scrollBy({ left: delta * step, behavior: "smooth" });
    },
    [cardWidth, gap],
  );

  // Slow glide with easing (native scrollBy is too snappy for ambient motion)
  const glideByCards = useCallback(
    (direction: -1 | 1) => {
      const el = trackRef.current;
      if (!el) return;
      const rtl = getComputedStyle(el).direction === "rtl";
      const delta = (rtl ? -1 : 1) * direction * (cardWidth + gap);
      const from = el.scrollLeft;
      const to = from + delta;
      const duration = 1300;
      const t0 = performance.now();
      const maxScroll = el.scrollWidth - el.clientWidth;
      // Loop back to the start when the end is reached
      const target = Math.abs(to) > maxScroll + 4 ? 0 : to;
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        el.scrollLeft = from + (target - from) * eased;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    [cardWidth, gap],
  );

  useEffect(() => {
    if (!autoPlayMs || paused) return;
    if (typeof document !== "undefined" && document.hidden) return;
    const id = setInterval(() => glideByCards(1), autoPlayMs);
    return () => clearInterval(id);
  }, [autoPlayMs, paused, glideByCards]);

  const items = React.Children.toArray(children);
  if (items.length === 0) return null;

  return (
    <div
      className={cn("group/carousel relative flex flex-col", className)}
      ref={containerRef}
      onMouseEnter={() => autoPlayMs && setPaused(true)}
      onMouseLeave={() => autoPlayMs && setPaused(false)}
    >
      {/* Carousel navigation - always visible */}
      {(canPrev || canNext) && (
        <div className="mb-3 flex items-center justify-start gap-2">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            disabled={!canPrev}
            aria-label="قبلی"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-char/10 bg-surface text-char-soft shadow-sm transition-all duration-200 hover:bg-lajvard hover:text-white hover:border-lajvard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lajvard disabled:opacity-30 disabled:pointer-events-none dark:border-white/10 dark:bg-[#262320] dark:text-white/60 dark:hover:bg-lajvard-soft dark:hover:text-char"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            disabled={!canNext}
            aria-label="بعدی"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-char/10 bg-surface text-char-soft shadow-sm transition-all duration-200 hover:bg-lajvard hover:text-white hover:border-lajvard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lajvard disabled:opacity-30 disabled:pointer-events-none dark:border-white/10 dark:bg-[#262320] dark:text-white/60 dark:hover:bg-lajvard-soft dark:hover:text-char"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
        </div>
      )}
      <div
        ref={trackRef}
        className="no-scrollbar flex items-stretch snap-x snap-mandatory overflow-x-auto scroll-smooth pb-1"
        style={{ gap: `${gap}px`, scrollPaddingInline: `${gap}px` }}
      >
        {items.map((child, i) => (
          <div
            key={i}
            className="snap-start flex shrink-0"
            style={{
              flex: `0 0 ${cardWidth}px`,
              width: `${cardWidth}px`,
              ...(minCardHeight ? { height: `${minCardHeight}px` } : {}),
            }}
          >
            {child}
          </div>
        ))}
      </div>

    </div>
  );
}
