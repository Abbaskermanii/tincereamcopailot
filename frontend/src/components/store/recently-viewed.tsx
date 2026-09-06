"use client";

import Link from "next/link";
import { useRecentlyViewed } from "@/lib/local-store";
import Image from "next/image";
import { faPrice } from "@/lib/format";
import { mediaUrl } from "@/lib/api";
import { SectionHeading } from "@/components/ui/section-heading";
import { SmartCarousel } from "@/components/ui/smart-carousel";

const MAX_ITEMS = 8;

export function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const all = useRecentlyViewed(excludeSlug);
  const items = all.slice(0, MAX_ITEMS);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="rv-h" className="mt-16">
      <SectionHeading title="بازدیدهای اخیر شما" />
      <SmartCarousel minCardWidth={220} maxCardWidth={260} gap={16}>
        {items.map((r) => (
          <Link
            key={r.slug}
            href={`/product/${r.slug}`}
            className="glaze-edge flex h-full w-full flex-col overflow-hidden rounded-wobble-card bg-surface p-2 shadow-shelf transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lifted"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl bg-slip dark:bg-surface">
              {r.imageUrl && (
                <Image src={mediaUrl(r.imageUrl)} alt={r.name} fill sizes="240px" className="object-cover" />
              )}
            </div>
            <p className="line-clamp-1 pt-2 text-sm font-medium">{r.name}</p>
            <p className="pb-1 text-xs text-char-soft dark:text-ink-soft">{faPrice(r.price)}</p>
          </Link>
        ))}
      </SmartCarousel>
    </section>
  );
}