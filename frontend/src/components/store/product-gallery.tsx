"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/api";

export interface ProductImage {
  id: string;
  url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  variantImageUrl?: string; // Optional variant-specific image
  variantName?: string; // Currently selected variant name
}

export function ProductGallery({
  images,
  productName,
  variantImageUrl,
  variantName,
}: ProductGalleryProps) {
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

  if (!current) {
    // No product images yet — show a stable placeholder instead of nothing.
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-wobble-card bg-surface shadow-shelf dark:bg-black/25">
        <span className="text-5xl text-char/15 dark:text-white/10" aria-hidden="true">🏺</span>
        <span className="sr-only">{productName}</span>
      </div>
    );
  }

  // Variant image only overrides the active slide, not every slide — prevents all slides showing same variant url
  const getSlideSrc = (img: ProductImage, idx: number) =>
    variantImageUrl && idx === active ? variantImageUrl : mediaUrl(img.url);
  const getSlideAlt = (img: ProductImage, idx: number) =>
    variantImageUrl && idx === active ? (variantName || productName) : (img.alt_text || productName);

  const lightboxImage = variantImageUrl
    ? { url: variantImageUrl, alt: variantName || productName }
    : { url: current.url, alt: current.alt_text || productName };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden rounded-wobble-card shadow-shelf">
          <div className="flex touch-pan-y">
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                aria-label={`بزرگنمایی تصویر ${idx + 1} از ${images.length}`}
                onClick={() => { setActive(idx); setZoom(true); }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setOrigin(`${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`);
                }}
                className="kiln-reveal relative min-w-0 flex-[0_0_100%] aspect-square cursor-zoom-in overflow-hidden bg-surface shadow-shelf"
              >
                <Image
                  src={getSlideSrc(img, idx)}
                  alt={getSlideAlt(img, idx)}
                  fill
                  priority={idx === 0}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  style={{ transformOrigin: origin }}
                />
              </button>
            ))}
          </div>
        </div>
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="تصویر قبلی"
              onClick={() => emblaApi?.scrollPrev()}
              className="absolute right-3 top-1/2 inline-flex h-11 w-11 min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 shadow-md transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lajvard"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="تصویر بعدی"
              onClick={() => emblaApi?.scrollNext()}
              className="absolute left-3 top-1/2 inline-flex h-11 w-11 min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 shadow-md transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lajvard"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="تصاویر محصول">
          {images.map((img, i) => (
            <button
              key={img.id}
              role="tab"
              aria-selected={i === active}
              aria-label={`نمای ${i + 1}`}
              onClick={() => { setActive(i); emblaApi?.scrollTo(i); }}
              className={cn(
                "relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lajvard",
                i === active ? "border-lajvard" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image src={mediaUrl(img.url)} alt={img.alt_text || productName} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* lightbox — single Radix Dialog with focus trap */}
      <Dialog.Root open={zoom} onOpenChange={setZoom}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm" />
          <Dialog.Content
            aria-label={`تصویر بزرگ ${productName}`}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 focus:outline-none"
            onEscapeKeyDown={() => setZoom(false)}
          >
            <Dialog.Title className="sr-only">{`تصویر بزرگ ${productName}`}</Dialog.Title>
            <div className="relative aspect-square max-h-[85vh] w-full max-w-2xl" onClick={() => setZoom(false)}>
              <Image
                src={lightboxImage.url}
                alt={lightboxImage.alt}
                fill
                sizes="90vw"
                className="rounded-wobble-card object-contain"
              />
            </div>
            <Dialog.Close
              aria-label="بستن بزرگنمایی"
              className="absolute right-4 top-4 inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/90 text-char shadow-md hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X size={20} aria-hidden="true" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}