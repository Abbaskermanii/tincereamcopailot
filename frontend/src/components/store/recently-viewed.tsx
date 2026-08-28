"use client";

import Link from "next/link";
import { useRecentlyViewed } from "@/lib/local-store";
import Image from "next/image";
import { faPrice } from "@/lib/format";
import { mediaUrl } from "@/lib/api";
import { SectionHeading } from "@/components/ui/section-heading";

export function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const items = useRecentlyViewed(excludeSlug);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="rv-h" className="mt-16">
      <SectionHeading title="بازدیدهای اخیر شما" />
      <div id="rv-h" className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
        {items.map((r) => (
          <Link
            key={r.slug}
            href={`/product/${r.slug}`}
            className="glaze-edge w-40 shrink-0 overflow-hidden rounded-wobble bg-surface p-2 shadow-shelf dark:bg-black/25"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl bg-slip dark:bg-black/30">
              {r.imageUrl && (
                <Image src={mediaUrl(r.imageUrl)} alt={r.name} fill sizes="160px" className="object-cover" />
              )}
            </div>
            <p className="line-clamp-1 pt-2 text-sm font-medium">{r.name}</p>
            <p className="text-xs text-char-soft dark:text-ink-soft">{faPrice(r.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
