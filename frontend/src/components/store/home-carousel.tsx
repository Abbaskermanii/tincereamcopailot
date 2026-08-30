"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { mediaUrl } from "@/lib/api";

export interface CarouselSlide {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
  sort_order: number;
  is_active?: boolean;
}

export function HomeCarousel({ slides }: { slides: CarouselSlide[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: "rtl" });
  const [selected, setSelected] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    const id = setInterval(() => emblaApi.scrollNext(), 4500);
    return () => {
      clearInterval(id);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (!slides.length) return null;

  return (
    <section aria-label="بنرهای ویژه" className="relative overflow-hidden rounded-wobble shadow-lifted">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((s) => {
            const content = (
              <div className="relative flex aspect-[16/7] min-w-0 flex-[0_0_100%] items-center overflow-hidden bg-slip dark:bg-surface md:aspect-[16/6]">
                <Image
                  src={mediaUrl(s.image_url)}
                  alt={s.title ?? "بنر"}
                  fill
                  priority={s.sort_order === 0}
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-black/55 via-black/20 to-transparent" />
                <div className="relative p-6 md:p-10 max-w-xl">
                  {s.title && <h2 className="text-2xl font-extrabold text-white md:text-3xl drop-shadow">{s.title}</h2>}
                  {s.subtitle && <p className="mt-2 text-sm leading-7 text-white/90 md:text-base">{s.subtitle}</p>}
                  {s.link_url && (
                    <span className="mt-4 inline-flex rounded-xl bg-white px-5 py-2 text-sm font-bold text-char">مشاهده</span>
                  )}
                </div>
              </div>
            );
            return (
              <div key={s.id} className="min-w-0 flex-[0_0_100%]">
                {s.link_url ? (
                  <Link href={s.link_url} className="block">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </div>
            );
          })}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            aria-label="اسلاید قبلی"
            onClick={scrollPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="اسلاید بعدی"
            onClick={scrollNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`رفتن به اسلاید ${i + 1}`}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${i === selected ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/90"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
