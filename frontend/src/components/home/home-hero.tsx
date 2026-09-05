"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useState } from "react";
import { mediaUrl } from "@/lib/api";

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

function getSlideMeta(slide: HeroSlide, index: number) {
  const defaults: { eyebrow: string; description: string; cta: string; ctaHref: string }[] = [
    {
      eyebrow: "سفال دست‌ساز",
      description: "هر قطعه حاصل دقت، صبر و عشق به هنر سفالگری است.",
      cta: "مشاهده مجموعه",
      ctaHref: slide.link_url ?? "/shop",
    },
    {
      eyebrow: "ظروف روزمره",
      description: "برای لحظه‌هایی که ارزش زیبایی دارند.",
      cta: "کشف کنید",
      ctaHref: slide.link_url ?? "/shop",
    },
    {
      eyebrow: "از کارگاه تن‌سِرام",
      description: "ساخته‌شده با خاک، آب و آتش در قلب ایران.",
      cta: "داستان ما",
      ctaHref: slide.link_url ?? "/about",
    },
    {
      eyebrow: "مجموعه جدید",
      description: "قطعات تازه از کوره، آماده برای خانه شما.",
      cta: "ببینید",
      ctaHref: slide.link_url ?? "/shop",
    },
  ];
  return defaults[index % defaults.length]!;
}

export function HomeHero({ slides }: HomeHeroProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    direction: "rtl",
    duration: 30,
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
      }, 6000);
    };
    startAutoplay();

    return () => {
      clearInterval(id);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, isPaused, isReducedMotion]);

  if (!slides.length) return null;

  return (
    <section
      aria-label="بنرهای ویژه"
      className="relative mb-8 mt-4 md:mb-12 md:mt-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden rounded-2xl md:rounded-3xl" ref={emblaRef}>
        <div className="flex">
          {slides.map((s, idx) => {
            const meta = getSlideMeta(s, idx);
            const isActive = idx === selected;

            return (
              <div key={s.id} className="min-w-0 flex-[0_0_100%]">
                {s.link_url ? (
                  <Link href={s.link_url} className="block" aria-label={s.title ?? meta.eyebrow}>
                    <SlideContent slide={s} meta={meta} isActive={isActive} isReducedMotion={isReducedMotion} isPriority={idx === 0} />
                  </Link>
                ) : (
                  <SlideContent slide={s} meta={meta} isActive={isActive} isReducedMotion={isReducedMotion} isPriority={idx === 0} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation arrows - desktop only */}
      {slides.length > 1 && (
        <>
          <button
            aria-label="اسلاید قبلی"
            onClick={(e) => { e.preventDefault(); emblaApi?.scrollPrev(); }}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur-md transition-all hover:bg-white/25 md:left-5 md:p-3.5"
          >
            <svg className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button
            aria-label="اسلاید بعدی"
            onClick={(e) => { e.preventDefault(); emblaApi?.scrollNext(); }}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur-md transition-all hover:bg-white/25 md:right-5 md:p-3.5"
          >
            <svg className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`رفتن به اسلاید ${i + 1}`}
                onClick={(e) => { e.preventDefault(); emblaApi?.scrollTo(i); }}
                className={`rounded-full transition-all duration-500 ${
                  i === selected
                    ? "h-2 w-8 bg-white"
                    : "h-2 w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function SlideContent({
  slide,
  meta,
  isActive,
  isReducedMotion,
  isPriority,
}: {
  slide: HeroSlide;
  meta: { eyebrow: string; description: string; cta: string; ctaHref: string };
  isActive: boolean;
  isReducedMotion: boolean;
  isPriority: boolean;
}) {
  return (
    <div className="relative aspect-[16/8] min-h-[320px] overflow-hidden bg-char md:aspect-[16/6.5] md:min-h-[420px] lg:min-h-[480px]">
      {/* Image */}
      <div className="absolute inset-0">
        <Image
          src={mediaUrl(slide.image_url)}
          alt={slide.title ?? meta.eyebrow}
          fill
          priority={isPriority}
          sizes="100vw"
          className={`object-cover transition-transform duration-[2000ms] ease-out ${
            isActive && !isReducedMotion ? "scale-105" : "scale-100"
          }`}
        />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/30 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:from-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full px-6 py-8 md:px-12 lg:px-16">
          <div className="max-w-lg space-y-4 md:space-y-5">
            {/* Eyebrow */}
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm md:text-xs">
              {meta.eyebrow}
            </span>

            {/* Headline */}
            {slide.title && (
              <h2 className="text-3xl font-extrabold leading-[1.2] text-white drop-shadow-lg md:text-4xl lg:text-[3.25rem]">
                {slide.title}
              </h2>
            )}

            {/* Description */}
            <p className="max-w-md text-sm leading-7 text-white/75 md:text-base lg:text-lg lg:leading-8">
              {slide.subtitle || meta.description}
            </p>

            {/* CTA */}
            <div className="pt-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-char transition-all duration-300 hover:bg-kiln-clay hover:text-white dark:bg-white/90 dark:text-char dark:hover:bg-kiln-clay">
                {meta.cta}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
