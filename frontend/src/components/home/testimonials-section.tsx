import Link from "next/link";
import { Star, BadgeCheck, Quote } from "lucide-react";

import { EditorialHeading } from "@/components/ui/editorial-heading";
import { SmartCarousel } from "@/components/ui/smart-carousel";
import { faNum } from "@/lib/format";

export interface TestimonialItem {
  id: string;
  author_name: string;
  rating: number;
  title: string;
  body: string;
  is_buyer: boolean;
  created_at: string;
  product_name?: string | null;
  product_slug?: string | null;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${faNum(rating)} از ۵`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-kiln-clay text-kiln-clay" : "text-char/15 dark:text-white/15"}`}
        />
      ))}
    </span>
  );
}

/**
 * Social-proof section: latest approved customer reviews as elegant
 * profile cards with a big decorative quote mark and a slow-gliding
 * carousel. Hidden entirely until at least one review is approved.
 */
export function TestimonialsSection({ items }: { items: TestimonialItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="py-10 md:py-14 lg:py-16" aria-labelledby="testimonials">
      <EditorialHeading
        eyebrow="تجربهٔ مشتری‌ها"
        title="مشتری‌ها چه می‌گویند"
        subtitle="حرف‌های واقعی کسانی که قطعه‌های آنیمور سرام را در خانه دارند"
        variant="minimal"
      />

      <SmartCarousel minCardWidth={290} maxCardWidth={330} gap={16} minCardHeight={270} autoPlayMs={4800}>
        {items.map((t) => (
          <figure
            key={t.id}
            className="group glaze-edge relative flex h-full w-full flex-col overflow-hidden rounded-wobble-card bg-surface p-5 pt-6 shadow-shelf transition-all duration-500 hover:-translate-y-1 hover:shadow-lifted dark:bg-[#262320]"
          >
            {/* Decorative quote mark */}
            <Quote
              aria-hidden="true"
              className="pointer-events-none absolute -left-2 -top-3 h-16 w-16 rotate-180 text-kiln-clay/10"
              strokeWidth={1}
            />

            <div className="relative flex items-center justify-between gap-2">
              <Stars rating={t.rating} />
              {t.is_buyer && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-firouzeh/10 px-2 py-0.5 text-[9px] font-bold text-firouzeh dark:bg-firouzeh/15">
                  <BadgeCheck className="h-3 w-3" />
                  خرید واقعی
                </span>
              )}
            </div>

            {t.title && (
              <p className="relative mt-3 line-clamp-1 text-sm font-bold text-char-800 [overflow-wrap:anywhere] dark:text-white/90">
                {t.title}
              </p>
            )}

            <blockquote className="relative mt-2 line-clamp-4 min-h-[5rem] text-[13px] leading-7 text-char-soft [overflow-wrap:anywhere] dark:text-white/55">
              {t.body}
            </blockquote>

            {/* Commenter profile */}
            <figcaption className="relative mt-auto flex items-center gap-3 border-t border-char/8 pt-4 dark:border-white/8">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-kiln-clay/25 to-lajvard/25 text-sm font-extrabold text-char dark:from-clay-soft/25 dark:to-lajvard-soft/25 dark:text-white">
                {t.author_name?.charAt(0) ?? "؟"}
                {t.is_buyer && (
                  <span className="absolute -bottom-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-firouzeh text-white ring-2 ring-surface dark:ring-[#262320]">
                    <BadgeCheck className="h-2.5 w-2.5" />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-extrabold text-char dark:text-white/90">
                  {t.author_name}
                </span>
                <span className="block text-[10px] text-char-soft dark:text-white/40">
                  خریدار آنیمور سرام
                </span>
              </span>
              {t.product_name && t.product_slug && (
                <Link
                  href={`/product/${t.product_slug}`}
                  className="max-w-[100px] truncate rounded-full bg-char/5 px-2.5 py-1 text-[10px] font-medium text-char-soft transition-colors hover:bg-lajvard/10 hover:text-lajvard dark:bg-white/5 dark:text-white/40 dark:hover:text-lajvard-soft"
                >
                  {t.product_name}
                </Link>
              )}
            </figcaption>
          </figure>
        ))}
      </SmartCarousel>
    </section>
  );
}
