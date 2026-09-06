"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { faNum } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CategoryCard } from "./category-card";

interface ShopFiltersProps {
  categories: Array<{ slug: string; name: string; image_url?: string | null; children?: Array<{ slug: string; name: string }> }>;
  currentSort: string;
  activeFilters: {
    category?: string;
    min_price?: string;
    max_price?: string;
    in_stock_only?: string;
  };
  searchQuery?: string;
  totalProducts: number;
}

const SORT_OPTIONS = [
  { label: "جدیدترین", value: "newest" },
  { label: "ارزان‌ترین", value: "price_asc" },
  { label: "گران‌ترین", value: "price_desc" },
  { label: "محبوب‌ترین", value: "popular" },
];

function buildUrl(pathname: string, params: URLSearchParams, key: string, value: string | undefined) {
  const next = new URLSearchParams(params);
  if (value && value !== "") next.set(key, value);
  else next.delete(key);
  next.delete("page");
  return `${pathname}?${next.toString()}`;
}

/* ————— Shared filter sections (used by both sidebar and mobile panel) ————— */

function PriceSection({ activeFilters, pathname, params }: { activeFilters: ShopFiltersProps["activeFilters"]; pathname: string; params: URLSearchParams }) {
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const next = new URLSearchParams(params);
        const min = fd.get("min_price") as string;
        const max = fd.get("max_price") as string;
        if (min) next.set("min_price", min); else next.delete("min_price");
        if (max) next.set("max_price", max); else next.delete("max_price");
        next.delete("page");
        router.push(`${pathname}?${next.toString()}`, { scroll: false });
      }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2">
        <input
          name="min_price" type="number" min={0} defaultValue={activeFilters.min_price} placeholder="از"
          className="num-latin h-9 w-full rounded-lg border border-char/10 bg-transparent px-3 text-sm dark:border-white/10 dark:text-white"
        />
        <span className="text-xs text-char-soft">—</span>
        <input
          name="max_price" type="number" min={0} defaultValue={activeFilters.max_price} placeholder="تا"
          className="num-latin h-9 w-full rounded-lg border border-char/10 bg-transparent px-3 text-sm dark:border-white/10 dark:text-white"
        />
      </div>
      <button type="submit" className="w-full rounded-lg bg-char/8 py-2 text-xs font-medium text-char transition-colors hover:bg-char/15 dark:bg-white/10 dark:text-white">
        اعمال قیمت
      </button>
    </form>
  );
}

function StockSection({ activeFilters, pathname, params }: { activeFilters: ShopFiltersProps["activeFilters"]; pathname: string; params: URLSearchParams }) {
  const on = activeFilters.in_stock_only === "true";
  return (
    <Link
      href={buildUrl(pathname, params, "in_stock_only", on ? "" : "true")}
      className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm transition-colors hover:text-lajvard"
    >
      <span className={cn(
        "flex h-5 w-5 items-center justify-center rounded border transition-colors",
        on ? "border-lajvard bg-lajvard text-white dark:border-lajvard-soft dark:bg-lajvard-soft" : "border-char/25 dark:border-white/25",
      )}>
        {on && (
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      فقط کالاهای موجود
    </Link>
  );
}

function SortSection({ currentSort, pathname, params }: { currentSort: string; pathname: string; params: URLSearchParams }) {
  return (
    <div className="space-y-1">
      {SORT_OPTIONS.map((opt) => (
        <Link
          key={opt.value}
          href={buildUrl(pathname, params, "sort", opt.value)}
          scroll={false}
          className={cn(
            "block rounded-lg px-3 py-2 text-sm transition-colors",
            opt.value === currentSort
              ? "bg-lajvard/10 font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft"
              : "text-char-soft hover:bg-char/5 dark:text-white/55 dark:hover:bg-white/5",
          )}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}

function ActiveChips({ activeFilters, categories, pathname, params }: { activeFilters: ShopFiltersProps["activeFilters"]; categories: ShopFiltersProps["categories"]; pathname: string; params: URLSearchParams }) {
  const chips: Array<{ label: string; href: string }> = [];
  if (activeFilters.category) {
    const flat = categories.flatMap((c) => [c, ...(c.children ?? [])]);
    chips.push({ label: flat.find((c) => c.slug === activeFilters.category)?.name ?? activeFilters.category, href: buildUrl(pathname, params, "category", "") });
  }
  if (activeFilters.min_price || activeFilters.max_price) {
    const next = new URLSearchParams(params);
    next.delete("min_price"); next.delete("max_price"); next.delete("page");
    chips.push({ label: "قیمت", href: `${pathname}?${next.toString()}` });
  }
  if (activeFilters.in_stock_only === "true") {
    chips.push({ label: "فقط موجود", href: buildUrl(pathname, params, "in_stock_only", "") });
  }
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Link key={chip.label} href={chip.href}
          className="group flex items-center gap-1.5 rounded-lg bg-lajvard/10 px-2.5 py-1.5 text-xs font-medium text-lajvard transition-colors hover:bg-lajvard/20 dark:bg-lajvard-soft/15 dark:text-lajvard-soft">
          {chip.label}
          <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
        </Link>
      ))}
    </div>
  );
}

/* ————— Desktop sidebar (right column) ————— */

export function ShopSidebar({ categories, currentSort, activeFilters, searchQuery, totalProducts }: ShopFiltersProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const activeCategory = categories.find((c) => c.slug === activeFilters.category);

  return (
    <aside className="sticky top-24 hidden w-64 shrink-0 self-start space-y-6 lg:block" aria-label="فیلتر محصولات">
      {/* Active chips on top */}
      <ActiveChips activeFilters={activeFilters} categories={categories} pathname={pathname} params={params} />

      {/* Categories */}
      <div>
        <p className="mb-2 border-b border-char/10 pb-2 text-sm font-extrabold text-char dark:border-white/10 dark:text-white">دسته‌بندی</p>
        <div className="space-y-0.5">
          <Link
            href={buildUrl(pathname, params, "category", "")}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm transition-colors",
              !activeFilters.category
                ? "bg-lajvard/10 font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft"
                : "text-char-soft hover:bg-char/5 dark:text-white/55 dark:hover:bg-white/5",
            )}
          >
            همه دسته‌ها
          </Link>
          {categories.map((c) => (
            <div key={c.slug}>
              <Link
                href={buildUrl(pathname, params, "category", c.slug)}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  activeFilters.category === c.slug
                    ? "bg-lajvard/10 font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft"
                    : "text-char-soft hover:bg-char/5 dark:text-white/55 dark:hover:bg-white/5",
                )}
              >
                {c.name}
              </Link>
              {c.children && c.children.length > 0 && activeFilters.category === c.slug && (
                <div className="mr-4 space-y-0.5 border-r border-char/10 pr-2 dark:border-white/10">
                  {c.children.map((child) => (
                    <Link
                      key={child.slug}
                      href={buildUrl(pathname, params, "category", child.slug)}
                      className={cn(
                        "block rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                        activeFilters.category === child.slug
                          ? "font-bold text-lajvard dark:text-lajvard-soft"
                          : "text-char-soft hover:text-char dark:text-white/45",
                      )}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="mb-2 border-b border-char/10 pb-2 text-sm font-extrabold text-char dark:border-white/10 dark:text-white">چیدمان</p>
        <SortSection currentSort={currentSort} pathname={pathname} params={params} />
      </div>

      {/* Price */}
      <div>
        <p className="mb-2 border-b border-char/10 pb-2 text-sm font-extrabold text-char dark:border-white/10 dark:text-white">محدوده قیمت (تومان)</p>
        <PriceSection activeFilters={activeFilters} pathname={pathname} params={params} />
      </div>

      {/* Stock */}
      <div>
        <p className="mb-2 border-b border-char/10 pb-2 text-sm font-extrabold text-char dark:border-white/10 dark:text-white">موجودی</p>
        <StockSection activeFilters={activeFilters} pathname={pathname} params={params} />
      </div>

      {searchQuery && (
        <p className="rounded-xl bg-lajvard/10 p-3 text-xs text-lajvard dark:bg-lajvard-soft/10 dark:text-lajvard-soft">
          نتایج جست‌وجو برای «{searchQuery}»
        </p>
      )}
    </aside>
  );
}

/* ————— Mobile: slim bar + collapsible panel ————— */

export function ShopMobileFilters({ categories, currentSort, activeFilters, searchQuery }: ShopFiltersProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const activeCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className="mb-6 space-y-3 lg:hidden">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={cn(
            "flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-colors",
            expanded || activeCount > 0
              ? "border-lajvard/40 bg-lajvard/10 text-lajvard dark:border-lajvard-soft/40 dark:bg-lajvard-soft/10 dark:text-lajvard-soft"
              : "border-char/10 bg-surface text-char dark:border-white/10 dark:bg-[#262320] dark:text-white/80",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          فیلترها
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lajvard px-1 text-[10px] font-bold text-white dark:bg-lajvard-soft dark:text-char">
              {faNum(activeCount)}
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
        </button>
      </div>

      {expanded && (
        <div className="space-y-5 rounded-wobble-card border border-char/10 bg-surface p-4 dark:border-white/10 dark:bg-[#262320]">
          <div>
            <p className="mb-2 text-xs font-bold text-char dark:text-white">دسته‌بندی</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <CategoryCard
                  key={c.slug}
                  name={c.name}
                  slug={c.slug}
                  image={c.image_url}
                  isActive={c.slug === activeFilters.category}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-char dark:text-white">چیدمان</p>
            <SortSection currentSort={currentSort} pathname={pathname} params={params} />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-char dark:text-white">محدوده قیمت (تومان)</p>
            <PriceSection activeFilters={activeFilters} pathname={pathname} params={params} />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-char dark:text-white">موجودی</p>
            <StockSection activeFilters={activeFilters} pathname={pathname} params={params} />
          </div>
          {searchQuery && (
            <p className="text-xs text-char-soft dark:text-white/50">نتایج برای «{searchQuery}»</p>
          )}
        </div>
      )}

      <ActiveChips activeFilters={activeFilters} categories={categories} pathname={pathname} params={params} />
    </div>
  );
}

/* Backwards-compatible combined export */
export function ShopFilters(props: ShopFiltersProps) {
  return (
    <>
      <ShopSidebar {...props} />
      <ShopMobileFilters {...props} />
    </>
  );
}
