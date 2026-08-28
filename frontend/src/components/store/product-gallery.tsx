"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductImage } from "@/lib/api";
import { mediaUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [emblaRef, emblaApi] = useEmblaCarousel({ direction: "rtl", loop: true });
  const current = images[active];

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActive(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  if (!current) return null;

  return (
    <div className="space-y-3">
      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden rounded-wobble">
          <div className="flex touch-pan-y">
            {images.map((img) => (
              <button
                key={img.id}
                type="button"
                aria-label="بزرگ‌نمایی تصویر"
                onClick={() => { setActive(images.indexOf(img)); setZoom(true); }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setOrigin(`${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`);
                }}
                className="kiln-reveal relative min-w-0 flex-[0_0_100%] aspect-square cursor-zoom-in overflow-hidden bg-surface shadow-shelf dark:bg-black/25"
              >
                <Image src={mediaUrl(img.url)} alt={img.alt_text || productName} fill priority={img.id === images[0]?.id} sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover transition-transform duration-300 hover:scale-105" style={{ transformOrigin: origin }} />
              </button>
            ))}
          </div>
        </div>
        {images.length > 1 && (
          <>
            <button type="button" aria-label="تصویر قبلی" onClick={() => emblaApi?.scrollPrev()} className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 shadow-md"><ChevronRight size={20} /></button>
            <button type="button" aria-label="تصویر بعدی" onClick={() => emblaApi?.scrollNext()} className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 shadow-md"><ChevronLeft size={20} /></button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2" role="tablist" aria-label="تصاویر محصول">
          {images.map((img, i) => (
            <button
              key={img.id}
              role="tab"
              aria-selected={i === active}
              aria-label={`نمای ${i + 1}`}
              onClick={() => { setActive(i); emblaApi?.scrollTo(i); }}
              className={cn(
                "relative h-20 w-20 overflow-hidden rounded-2xl border-2 transition-colors",
                i === active ? "border-lajvard" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image src={mediaUrl(img.url)} alt={img.alt_text || productName} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* lightbox */}
      {zoom && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`تصویر بزرگ ${productName}`}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setZoom(false)}
          onKeyDown={(e) => e.key === "Escape" && setZoom(false)}
        >
          <div className="relative aspect-square max-h-[85vh] w-full max-w-2xl">
            <Image
              src={current.url}
              alt={current.alt_text || productName}
              fill
              sizes="90vw"
              className="rounded-wobble object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
