import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";

import { mediaUrl } from "@/lib/api";
import { faNum } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  name: string;
  slug: string;
  image?: string | null;
  productCount?: number | null;
  isActive?: boolean;
  priority?: boolean;
}

/**
 * The single shared category pill used site-wide.
 * Deliberately minimal and compact: a small round thumbnail + name, so the
 * row still reads cleanly when the number of categories grows.
 * Categories link into the shop's filtered view.
 */
export function CategoryCard({
  name,
  slug,
  image,
  productCount,
  isActive = false,
}: CategoryCardProps) {
  const img = image ? mediaUrl(image) : null;

  return (
    <Link
      href={`/shop?category=${slug}`}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group inline-flex shrink-0 items-center gap-2 rounded-full border bg-surface py-1 pl-4 pr-1 transition-all duration-200 dark:bg-[#262320]",
        isActive
          ? "border-lajvard bg-lajvard/8 dark:border-lajvard-soft dark:bg-lajvard-soft/10"
          : "border-char/10 hover:border-lajvard/40 hover:bg-lajvard/5 dark:border-white/10 dark:hover:border-lajvard-soft/40 dark:hover:bg-lajvard-soft/10",
      )}
    >
      {/* Tiny round thumbnail */}
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slip dark:bg-char">
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            sizes="32px"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <Package className="h-3.5 w-3.5 text-char/25 dark:text-white/25" strokeWidth={1.5} />
        )}
      </span>

      <span className="text-sm font-semibold text-char transition-colors group-hover:text-lajvard dark:text-white/90 dark:group-hover:text-lajvard-soft">
        {name}
      </span>

      {productCount != null && productCount > 0 && (
        <span className="text-[11px] font-medium text-char-soft/70 dark:text-white/35">
          {faNum(productCount)}
        </span>
      )}
    </Link>
  );
}
