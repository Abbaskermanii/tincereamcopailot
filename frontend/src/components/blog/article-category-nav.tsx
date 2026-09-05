"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function ArticleCategoryNav({
  categories,
  activeCategory,
}: {
  categories: Category[];
  activeCategory?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0"
      aria-label="دسته‌بندی مقالات"
    >
      <Link
        href={pathname}
        className={cn(
          "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
          !activeCategory
            ? "border-lajvard bg-lajvard text-white dark:border-lajvard-soft dark:bg-lajvard-soft dark:text-char"
            : "border-char/10 text-char-soft hover:border-char/25 hover:text-char dark:border-white/10 dark:text-white/50 dark:hover:border-white/20 dark:hover:text-white"
        )}
      >
        همه
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`${pathname}?category=${cat.slug}`}
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            activeCategory === cat.slug
              ? "border-lajvard bg-lajvard text-white dark:border-lajvard-soft dark:bg-lajvard-soft dark:text-char"
              : "border-char/10 text-char-soft hover:border-char/25 hover:text-char dark:border-white/10 dark:text-white/50 dark:hover:border-white/20 dark:hover:text-white"
          )}
        >
          {cat.name}
        </Link>
      ))}
    </nav>
  );
}
