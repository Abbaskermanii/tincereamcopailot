import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Package } from "lucide-react";

import { mediaUrl } from "@/lib/api";
import { faNum } from "@/lib/format";
import { cn } from "@/lib/utils";

type Category = {
  name: string;
  slug: string;
  image_url?: string | null;
  product_count?: number | null;
};

/* ───── Horizontal mini category card (homepage showcase) ───── */

function CategoryMiniCard({ category }: { category: Category }) {
  const img = category.image_url ? mediaUrl(category.image_url) : null;
  const count = category.product_count;

  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className="group glaze-edge flex items-center gap-3 rounded-wobble-card hover:-translate-y-0.5 bg-surface p-2.5 shadow-shelf transition-all duration-200 hover:border-lajvard/40 hover:shadow-lifted dark:bg-[#262320] dark:hover:border-lajvard-soft/40 border border-transparent"
    >
      {/* Small square thumbnail */}
      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slip dark:bg-char">
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            sizes="64px"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-kiln-clay/18 via-slip-raised to-lajvard/15 dark:from-clay-soft/15 dark:via-[#2a2622] dark:to-lajvard-soft/15">
            <Package className="h-6 w-6 text-char/30 dark:text-white/25" strokeWidth={1.4} />
          </span>
        )}
      </span>

      {/* Name + count */}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold text-char-800 transition-colors group-hover:text-lajvard dark:text-white/90 dark:group-hover:text-lajvard-soft">
          {category.name}
        </span>
        {count != null && count > 0 && (
          <span className="mt-0.5 block text-[10px] font-medium text-char-soft dark:text-white/40">
            {faNum(count)} محصول
          </span>
        )}
      </span>

      <ChevronLeft
        className="h-4 w-4 shrink-0 text-char/20 transition-all duration-200 group-hover:-translate-x-0.5 group-hover:text-lajvard dark:text-white/20 dark:group-hover:text-lajvard-soft"
        strokeWidth={2}
      />
    </Link>
  );
}

interface CategoryTilesProps {
  categories: Category[];
  limit?: number;
  className?: string;
}

/**
 * Compact category navigation: horizontal mini-cards (thumb + name + count).
 * Slides on mobile; on larger screens wraps into centered rows, so any
 * number of categories stays balanced and tidy.
 */
export function CategoryTiles({ categories, limit = 12, className }: CategoryTilesProps) {
  const items = categories.slice(0, limit);

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "no-scrollbar -mx-4 flex flex-nowrap snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0",
        className,
      )}
    >
      {items.map((c) => (
        <div key={c.slug} className="w-[290px] shrink-0 snap-start sm:w-[300px]">
          <CategoryMiniCard category={c} />
        </div>
      ))}
    </div>
  );
}
