"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import { faNum } from "@/lib/format";

export interface HeroSlide {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
}

interface HomeHeroProps {
  slides: HeroSlide[];
}

/** Slim campaign banner — only real slide data is shown, no invented copy. */
export function HomeHero({ slides }: HomeHeroProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    direction: "rtl",
    duration: 32,
  });
  const [selected, setSelected] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();

    let id: ReturnType<typeof setInterval>;
    const startAutoplay = () => {
      clearInterval(id);
      id = setInterval(() => {
        if (!isPaused && !isReducedMotion) emblaApi.scrollNext();
      }, 6500);
    };
    startAutoplay();

    return () => {
      clearInterval(id);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, isPaused, isReducedMotion]);

  if (!slides.length) return null;

  return (
    <section aria-label="بنرهای ویژه" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} className="mb-8 mt-4 md:mb-10 md:mt-5">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="overflow-hidden rounded-wobble-card shadow-lifted" ref={emblaRef}>
          <div className="flex">
            {slides.map((s, idx) => (
              <div key={s.id} className="min-w-0 flex-[0_0_100%]">
                <HeroSlideCard
                  slide={s}
                  total={slides.length}
                  selected={selected}
                  isActive={idx === selected}
                  isReducedMotion={isReducedMotion}
                  isPriority={idx === 0}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroSlideCard({
  slide,
  total,
  selected,
  isActive,
  isReducedMotion,
  isPriority,
}: {
  slide: HeroSlide;
  total: number;
  selected: number;
  isActive: boolean;
  isReducedMotion: boolean;
  isPriority: boolean;
}) {
  const title = slide.title || null;
  const description = slide.subtitle || null;
  const hasImage = Boolean(slide.image_url);

  return (
    <div className="relative h-[250px] overflow-hidden bg-[#1b2433] md:h-[270px] lg:h-[290px]">
      <div className="absolute inset-0">
        {hasImage ? (
          <Image
            src={mediaUrl(slide.image_url)}
            alt={slide.title ?? "بنر تبلیغاتی"}
            fill
            priority={isPriority}
            sizes="(max-width: 768px) 100vw, 80vw"
            className={`object-cover transition-transform duration-[2400ms] ease-out ${
              isActive && !isReducedMotion ? "scale-105" : "scale-100"
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-l from-kiln-clay/40 via-[#1b2433] to-lajvard/50">
            <svg className="h-16 w-16 text-white/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M7 21h10M8 21v-4a4 4 0 014-4 4 4 0 014 4v4M12 13V9m0 0a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-l from-black/75 via-black/40 to-black/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      <div className="pointer-events-none absolute inset-y-0 right-0 flex w-full max-w-[560px] flex-col justify-center py-5 pl-6 pr-5 sm:pr-8 md:pr-10">
        {title && (
          <h2
            key={`t-${slide.id}`}
            className={`mt-2.5 line-clamp-2 text-xl font-extrabold leading-[1.35] text-white drop-shadow-md md:text-2xl md:leading-[1.35] lg:text-[1.9rem] ${
              isActive && !isReducedMotion ? "animate-fade-in" : ""
            }`}
          >
            {title}
          </h2>
        )}
        {description && (
          <p className="mt-1.5 line-clamp-1 text-[11px] leading-5 text-white/70 md:text-[13px] md:leading-6">
            {description}
          </p>
        )}
        {slide.link_url && (
          <Link
            href={slide.link_url}
            className="pointer-events-auto mt-3.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-char shadow-md transition-all duration-300 hover:bg-kiln-clay hover:text-white"
          >
            مشاهده
            <ChevronLeft className="h-3.5 w-3.5" />
          </Link>
        )}
        {total > 1 && (
          <div className="mt-4 flex items-center gap-1.5" dir="ltr">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === selected ? "w-6 bg-white" : "w-1.5 bg-white/30"
                }`}
              />
            ))}
            <span className="num-latin mr-2 text-[9px] font-bold text-white/40">
              {faNum(selected + 1)} / {faNum(total)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
