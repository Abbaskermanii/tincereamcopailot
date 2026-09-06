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

function getSlideMeta(slide: HeroSlide, index: number) {
  const defaults: { eyebrow: string; description: string; cta: string; ctaHref: string }[] = [
    {
      eyebrow: "سفال دست‌ساز ایرانی",
      description: "هر قطعه حاصل دقت، صبر و عشق به هنر سفالگری است.",
      cta: "مشاهده فروشگاه",
      ctaHref: slide.link_url ?? "/shop",
    },
    {
      eyebrow: "ظروف روزمره",
      description: "برای لحظه‌هایی که ارزش زیبایی دارند.",
      cta: "کشف کنید",
      ctaHref: slide.link_url ?? "/shop",
    },
    {
      eyebrow: "از کارگاه آنیمور سرام",
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

/**
 * Slim campaign-banner hero: the dashboard slide's photo fills a short
 * rounded card, copy sits on a soft right-side scrim. Deliberately low
 * (≈260–290px) so the page content starts immediately below the fold.
 */
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
    <section aria-label="بنرهای ویژه" className="mb-8 mt-4 md:mb-10 md:mt-5">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="overflow-hidden rounded-wobble-card shadow-lifted" ref={emblaRef}>
          <div className="flex">
            {slides.map((s, idx) => (
              <div key={s.id} className="min-w-0 flex-[0_0_100%]">
                <HeroSlideCard
                  slide={s}
                  index={idx}
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
  index,
  total,
  selected,
  isActive,
  isReducedMotion,
  isPriority,
}: {
  slide: HeroSlide;
  index: number;
  total: number;
  selected: number;
  isActive: boolean;
  isReducedMotion: boolean;
  isPriority: boolean;
}) {
  const meta = getSlideMeta(slide, index);
  const title = slide.title || meta.eyebrow;
  const description = slide.subtitle || meta.description;
  const hasImage = Boolean(slide.image_url);

  return (
    <div className="relative h-[250px] overflow-hidden bg-[#1b2433] md:h-[270px] lg:h-[290px]">
      {/* Slide photo fills the card */}
      <div className="absolute inset-0">
        {hasImage ? (
          <Image
            src={mediaUrl(slide.image_url)}
            alt={title}
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

      {/* Soft scrim — dark on the right where the copy sits */}
      <div className="absolute inset-0 bg-gradient-to-l from-black/75 via-black/40 to-black/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      {/* Copy — right side in RTL */}
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[560px] flex-col justify-center py-5 pl-6 pr-5 sm:pr-8 md:pr-10">
        <span
          key={`b-${slide.id}`}
          className={`inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[9px] font-bold tracking-[0.12em] text-white/80 backdrop-blur-sm md:text-[10px] ${
            isActive && !isReducedMotion ? "animate-fade-in" : ""
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-clay-soft" />
          {meta.eyebrow}
        </span>

        <h2
          key={`t-${slide.id}`}
          className={`mt-2.5 line-clamp-2 text-xl font-extrabold leading-[1.35] text-white drop-shadow-md md:text-2xl md:leading-[1.35] lg:text-[1.9rem] ${
            isActive && !isReducedMotion ? "animate-fade-in" : ""
          }`}
        >
          {title}
        </h2>

        <p className="mt-1.5 line-clamp-1 text-[11px] leading-5 text-white/70 md:text-[13px] md:leading-6">
          {description}
        </p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <Link
            href={meta.ctaHref}
            className="group inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-char shadow-md transition-all duration-300 hover:bg-kiln-clay hover:text-white"
          >
            {meta.cta}
            <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:border-white/45 hover:bg-white/20"
          >
            داستان ما
          </Link>
        </div>

        {/* Slide indicators */}
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
