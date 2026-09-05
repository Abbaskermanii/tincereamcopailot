"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SmartCarouselProps {
  children: React.ReactNode;
  className?: string;
  minCardWidth?: number;
  maxCardWidth?: number;
  gap?: number;
}

export function SmartCarousel({
  children,
  className,
  minCardWidth = 260,
  maxCardWidth = 360,
  gap = 12,
}: SmartCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 2);
    setCanNext(el.scrollLeft < maxScroll - 2);
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

  const scrollBy = useCallback((direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>(":scope > *")?.offsetWidth ?? minCardWidth;
    el.scrollBy({ left: direction * (cardWidth + gap) * 2, behavior: "smooth" });
  }, [minCardWidth, gap]);

  const items = React.Children.toArray(children);
  if (items.length === 0) return null;

  return (
    <div className={cn("group/carousel relative -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8", className)}>
      <div
        ref={trackRef}
        className="no-scrollbar flex items-stretch snap-x snap-mandatory overflow-x-auto scroll-smooth"
        style={{ gap: `${gap}px`, scrollPaddingInline: `${gap}px` }}
      >
        {items.map((child, i) => (
          <div
            key={i}
            className="snap-start flex shrink-0"
            style={{
              flex: `0 0 clamp(${minCardWidth}px, calc((100vw - ${gap * 2}px - 32px) / ${Math.max(2, Math.floor((1000) / (minCardWidth + gap)))}), ${maxCardWidth}px)`,
            }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {items.length > 2 && (
        <>
          <button
            type="button"
            aria-label="قبلی"
            onClick={() => scrollBy(-1)}
            className={cn(
              "absolute -left-1 top-1/2 z-10 -translate-y-1/2",
              "flex h-9 w-9 items-center justify-center rounded-full",
              "border border-char/10 bg-surface/90 text-char-soft shadow-md backdrop-blur-sm",
              "transition-all duration-200",
              "hover:bg-lajvard hover:text-white hover:border-lajvard",
              "dark:border-white/10 dark:bg-[#262320]/90 dark:text-white/60",
              "dark:hover:bg-lajvard-soft dark:hover:text-char",
              "opacity-0 group-hover/carousel:opacity-100",
              canPrev ? "cursor-pointer" : "pointer-events-none opacity-0"
            )}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="بعدی"
            onClick={() => scrollBy(1)}
            className={cn(
              "absolute -right-1 top-1/2 z-10 -translate-y-1/2",
              "flex h-9 w-9 items-center justify-center rounded-full",
              "border border-char/10 bg-surface/90 text-char-soft shadow-md backdrop-blur-sm",
              "transition-all duration-200",
              "hover:bg-lajvard hover:text-white hover:border-lajvard",
              "dark:border-white/10 dark:bg-[#262320]/90 dark:text-white/60",
              "dark:hover:bg-lajvard-soft dark:hover:text-char",
              "opacity-0 group-hover/carousel:opacity-100",
              canNext ? "cursor-pointer" : "pointer-events-none opacity-0"
            )}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
