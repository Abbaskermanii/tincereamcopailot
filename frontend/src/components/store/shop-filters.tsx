"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  label: string;
  value: string;
}

interface ShopFiltersProps {
  categories: Array<{ slug: string; name: string; children?: Array<{ slug: string; name: string }> }>;
  brands: Array<{ slug: string; name: string }>;
  currentSort: string;
  totalProducts: number;
  activeFilters: {
    category?: string;
    brand?: string;
    min_price?: string;
    max_price?: string;
    in_stock_only?: string;
  };
}

const SORT_OPTIONS: FilterOption[] = [
  { label: "جدیدترین", value: "newest" },
  { label: "ارزان‌ترین", value: "price_asc" },
  { label: "گران‌ترین", value: "price_desc" },
  { label: "محبوب‌ترین", value: "popular" },
];

function buildUrl(pathname: string, params: URLSearchParams, key: string, value: string | undefined) {
  const next = new URLSearchParams(params);
  if (value && value !== "") {
    next.set(key, value);
  } else {
    next.delete(key);
  }
  next.delete("page");
  return `${pathname}?${next.toString()}`;
}

function removeFilter(pathname: string, params: URLSearchParams, key: string) {
  const next = new URLSearchParams(params);
  next.delete(key);
  next.delete("page");
  return `${pathname}?${next.toString()}`;
}

function clearAllFilters(pathname: string) {
  return pathname;
}

/* ───── Sort Dropdown ───── */
function SortDropdown({ currentSort, buildHref }: { currentSort: string; buildHref: (sort: string) => string }) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.value === currentSort) ?? SORT_OPTIONS[0]!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-char/10 bg-surface px-4 py-2.5 text-sm font-medium text-char transition-colors hover:border-char/20 dark:border-white/10 dark:bg-[#262320] dark:text-white"
        aria-label="مرتب‌سازی"
      >
        <ArrowUpDown className="h-4 w-4 text-char-soft" />
        <span>{current.label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-char-soft transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-char/10 bg-surface shadow-lifted dark:border-white/10 dark:bg-[#262320]">
            {SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={buildHref(opt.value)}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-4 py-2.5 text-sm transition-colors hover:bg-char/5 dark:hover:bg-white/5",
                  opt.value === currentSort ? "font-bold text-lajvard dark:text-lajvard-soft" : "text-char dark:text-white"
                )}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ───── Active Filter Chips ───── */
function ActiveFilterChips({
  activeFilters,
  categories,
  brands,
  pathname,
  params,
}: {
  activeFilters: ShopFiltersProps["activeFilters"];
  categories: ShopFiltersProps["categories"];
  brands: ShopFiltersProps["brands"];
  pathname: string;
  params: URLSearchParams;
}) {
  const chips: Array<{ label: string; href: string }> = [];

  if (activeFilters.category) {
    const flat = categories.flatMap((c) => [c, ...(c.children ?? [])]);
    const cat = flat.find((c) => c.slug === activeFilters.category);
    chips.push({
      label: `دسته: ${cat?.name ?? activeFilters.category}`,
      href: removeFilter(pathname, params, "category"),
    });
  }
  if (activeFilters.brand) {
    const br = brands.find((b) => b.slug === activeFilters.brand);
    chips.push({
      label: `برند: ${br?.name ?? activeFilters.brand}`,
      href: removeFilter(pathname, params, "brand"),
    });
  }
  if (activeFilters.min_price || activeFilters.max_price) {
    const min = activeFilters.min_price ? new Intl.NumberFormat("fa-IR").format(Number(activeFilters.min_price)) : "";
    const max = activeFilters.max_price ? new Intl.NumberFormat("fa-IR").format(Number(activeFilters.max_price)) : "";
    const range = min && max ? `${min} – ${max}` : min ? `از ${min}` : `تا ${max}`;
    chips.push({
      label: `قیمت: ${range}`,
      href: removeFilter(removeFilter(pathname, params, "min_price"), "max_price" as never, "max_price"),
    });
  }
  if (activeFilters.in_stock_only === "true") {
    chips.push({
      label: "فقط موجودها",
      href: removeFilter(pathname, params, "in_stock_only"),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          className="group flex items-center gap-1.5 rounded-lg bg-lajvard/10 px-3 py-1.5 text-xs font-medium text-lajvard transition-colors hover:bg-lajvard/20 dark:bg-lajvard-soft/15 dark:text-lajvard-soft dark:hover:bg-lajvard-soft/25"
        >
          {chip.label}
          <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
        </Link>
      ))}
      <Link
        href={clearAllFilters(pathname)}
        className="text-xs font-medium text-char-soft transition-colors hover:text-clay dark:text-white/50 dark:hover:text-clay"
      >
        پاک کردن همه
      </Link>
    </div>
  );
}

/* ───── Desktop Sidebar ───── */
function DesktopFilters({
  categories,
  brands,
  activeFilters,
  pathname,
  params,
}: {
  categories: ShopFiltersProps["categories"];
  brands: ShopFiltersProps["brands"];
  activeFilters: ShopFiltersProps["activeFilters"];
  pathname: string;
  params: URLSearchParams;
}) {
  return (
    <aside className="hidden w-64 shrink-0 space-y-6 lg:block" aria-label="فیلتر محصولات">
      {/* Categories */}
      <FilterGroup title="دسته‌بندی">
        <div className="space-y-1">
          <Link
            href={removeFilter(pathname, params, "category")}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm transition-colors",
              !activeFilters.category
                ? "bg-lajvard/10 font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft"
                : "text-char hover:bg-char/5 dark:text-white dark:hover:bg-white/5"
            )}
          >
            همه
          </Link>
          {categories.map((c) => (
            <div key={c.slug}>
              <Link
                href={buildUrl(pathname, params, "category", c.slug)}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  activeFilters.category === c.slug
                    ? "bg-lajvard/10 font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft"
                    : "text-char hover:bg-char/5 dark:text-white dark:hover:bg-white/5"
                )}
              >
                {c.name}
              </Link>
              {c.children && c.children.length > 0 && activeFilters.category === c.slug && (
                <div className="mr-4 space-y-0.5">
                  {c.children.map((child) => (
                    <Link
                      key={child.slug}
                      href={buildUrl(pathname, params, "category", child.slug)}
                      className={cn(
                        "block rounded-lg px-3 py-1.5 text-xs transition-colors",
                        activeFilters.category === child.slug
                          ? "font-bold text-lajvard dark:text-lajvard-soft"
                          : "text-char-soft hover:text-char dark:text-white/60 dark:hover:text-white"
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
      </FilterGroup>

      {/* Price Range */}
      <FilterGroup title="محدوده قیمت">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const min = fd.get("min_price") as string;
            const max = fd.get("max_price") as string;
            const next = new URLSearchParams(params);
            if (min) next.set("min_price", min); else next.delete("min_price");
            if (max) next.set("max_price", max); else next.delete("max_price");
            next.delete("page");
            window.location.href = `${pathname}?${next.toString()}`;
          }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <input
              name="min_price"
              type="number"
              min="0"
              defaultValue={activeFilters.min_price}
              placeholder="از"
              className="w-full rounded-lg border border-char/10 bg-transparent px-3 py-2 text-sm text-char placeholder:text-char-soft/50 focus:border-lajvard focus:outline-none focus:ring-1 focus:ring-lajvard/25 dark:border-white/10 dark:text-white dark:placeholder:text-white/40"
            />
            <span className="shrink-0 text-xs text-char-soft dark:text-white/40">—</span>
            <input
              name="max_price"
              type="number"
              min="0"
              defaultValue={activeFilters.max_price}
              placeholder="تا"
              className="w-full rounded-lg border border-char/10 bg-transparent px-3 py-2 text-sm text-char placeholder:text-char-soft/50 focus:border-lajvard focus:outline-none focus:ring-1 focus:ring-lajvard/25 dark:border-white/10 dark:text-white dark:placeholder:text-white/40"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-char/8 px-3 py-2 text-xs font-medium text-char transition-colors hover:bg-char/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          >
            اعمال قیمت
          </button>
        </form>
      </FilterGroup>

      {/* Brands */}
      {brands.length > 0 && (
        <FilterGroup title="برند">
          <div className="space-y-1">
            <Link
              href={removeFilter(pathname, params, "brand")}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm transition-colors",
                !activeFilters.brand
                  ? "bg-lajvard/10 font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft"
                  : "text-char hover:bg-char/5 dark:text-white dark:hover:bg-white/5"
              )}
            >
              همه برندها
            </Link>
            {brands.map((b) => (
              <Link
                key={b.slug}
                href={buildUrl(pathname, params, "brand", b.slug)}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  activeFilters.brand === b.slug
                    ? "bg-lajvard/10 font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft"
                    : "text-char hover:bg-char/5 dark:text-white dark:hover:bg-white/5"
                )}
              >
                {b.name}
              </Link>
            ))}
          </div>
        </FilterGroup>
      )}

      {/* In Stock */}
      <FilterGroup title="موجودی">
        <Link
          href={buildUrl(pathname, params, "in_stock_only", activeFilters.in_stock_only === "true" ? "" : "true")}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-char/5 dark:hover:bg-white/5"
        >
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded border transition-colors",
              activeFilters.in_stock_only === "true"
                ? "border-lajvard bg-lajvard text-white dark:border-lajvard-soft dark:bg-lajvard-soft"
                : "border-char/20 dark:border-white/20"
            )}
          >
            {activeFilters.in_stock_only === "true" && (
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="text-char dark:text-white">فقط موجودها</span>
        </Link>
      </FilterGroup>
    </aside>
  );
}

/* ───── Filter Group Wrapper ───── */
function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-char/5 pb-5 dark:border-white/5">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1 text-sm font-bold text-char dark:text-white"
        aria-expanded={open}
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 text-char-soft transition-transform", !open && "-rotate-90")} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

/* ───── Mobile Filter Sheet ───── */
function MobileFilterSheet({
  open,
  onClose,
  categories,
  brands,
  activeFilters,
  pathname,
  params,
}: {
  open: boolean;
  onClose: () => void;
  categories: ShopFiltersProps["categories"];
  brands: ShopFiltersProps["brands"];
  activeFilters: ShopFiltersProps["activeFilters"];
  pathname: string;
  params: URLSearchParams;
}) {
  const router = useRouter();
  const [localFilters, setLocalFilters] = useState({ ...activeFilters });

  const updateLocal = useCallback((key: string, value: string | undefined) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    const next = new URLSearchParams(params);
    if (localFilters.category) next.set("category", localFilters.category); else next.delete("category");
    if (localFilters.brand) next.set("brand", localFilters.brand); else next.delete("brand");
    if (localFilters.min_price) next.set("min_price", localFilters.min_price); else next.delete("min_price");
    if (localFilters.max_price) next.set("max_price", localFilters.max_price); else next.delete("max_price");
    if (localFilters.in_stock_only) next.set("in_stock_only", localFilters.in_stock_only); else next.delete("in_stock_only");
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
    onClose();
  }, [localFilters, params, pathname, router, onClose]);

  const clearAll = useCallback(() => {
    setLocalFilters({});
    router.push(pathname);
    onClose();
  }, [router, pathname, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute inset-y-0 left-0 w-full max-w-sm overflow-y-auto bg-surface shadow-lifted dark:bg-[#1c1a18]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-char/5 bg-surface px-5 py-4 dark:bg-[#1c1a18]">
          <h2 className="text-base font-bold text-char dark:text-white">فیلترها</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-char-soft transition-colors hover:bg-char/10 dark:text-white/60 dark:hover:bg-white/10"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-0 px-5 pb-24">
          {/* Categories */}
          <div className="py-4">
            <h3 className="mb-3 text-sm font-bold text-char dark:text-white">دسته‌بندی</h3>
            <div className="space-y-0.5">
              <button
                onClick={() => updateLocal("category", undefined)}
                className={cn(
                  "block w-full rounded-lg px-3 py-2 text-right text-sm transition-colors",
                  !localFilters.category
                    ? "bg-lajvard/10 font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft"
                    : "text-char hover:bg-char/5 dark:text-white dark:hover:bg-white/5"
                )}
              >
                همه
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => updateLocal("category", c.slug)}
                  className={cn(
                    "block w-full rounded-lg px-3 py-2 text-right text-sm transition-colors",
                    localFilters.category === c.slug
                      ? "bg-lajvard/10 font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft"
                      : "text-char hover:bg-char/5 dark:text-white dark:hover:bg-white/5"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-char/5 dark:border-white/5" />

          {/* Price */}
          <div className="py-4">
            <h3 className="mb-3 text-sm font-bold text-char dark:text-white">محدوده قیمت</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={localFilters.min_price ?? ""}
                onChange={(e) => updateLocal("min_price", e.target.value || undefined)}
                placeholder="از"
                className="w-full rounded-lg border border-char/10 bg-transparent px-3 py-2 text-sm text-char placeholder:text-char-soft/50 focus:border-lajvard focus:outline-none focus:ring-1 focus:ring-lajvard/25 dark:border-white/10 dark:text-white dark:placeholder:text-white/40"
              />
              <span className="shrink-0 text-xs text-char-soft dark:text-white/40">—</span>
              <input
                type="number"
                min="0"
                value={localFilters.max_price ?? ""}
                onChange={(e) => updateLocal("max_price", e.target.value || undefined)}
                placeholder="تا"
                className="w-full rounded-lg border border-char/10 bg-transparent px-3 py-2 text-sm text-char placeholder:text-char-soft/50 focus:border-lajvard focus:outline-none focus:ring-1 focus:ring-lajvard/25 dark:border-white/10 dark:text-white dark:placeholder:text-white/40"
              />
            </div>
          </div>

          <div className="border-t border-char/5 dark:border-white/5" />

          {/* Brands */}
          {brands.length > 0 && (
            <>
              <div className="py-4">
                <h3 className="mb-3 text-sm font-bold text-char dark:text-white">برند</h3>
                <div className="space-y-0.5">
                  <button
                    onClick={() => updateLocal("brand", undefined)}
                    className={cn(
                      "block w-full rounded-lg px-3 py-2 text-right text-sm transition-colors",
                      !localFilters.brand
                        ? "bg-lajvard/10 font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft"
                        : "text-char hover:bg-char/5 dark:text-white dark:hover:bg-white/5"
                    )}
                  >
                    همه برندها
                  </button>
                  {brands.map((b) => (
                    <button
                      key={b.slug}
                      onClick={() => updateLocal("brand", b.slug)}
                      className={cn(
                        "block w-full rounded-lg px-3 py-2 text-right text-sm transition-colors",
                        localFilters.brand === b.slug
                          ? "bg-lajvard/10 font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft"
                          : "text-char hover:bg-char/5 dark:text-white dark:hover:bg-white/5"
                      )}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-char/5 dark:border-white/5" />
            </>
          )}

          {/* In Stock */}
          <div className="py-4">
            <button
              onClick={() => updateLocal("in_stock_only", localFilters.in_stock_only === "true" ? undefined : "true")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-char/5 dark:hover:bg-white/5"
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                  localFilters.in_stock_only === "true"
                    ? "border-lajvard bg-lajvard text-white dark:border-lajvard-soft dark:bg-lajvard-soft"
                    : "border-char/20 dark:border-white/20"
                )}
              >
                {localFilters.in_stock_only === "true" && (
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-char dark:text-white">فقط موجودها</span>
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="sticky bottom-0 border-t border-char/5 bg-surface px-5 py-4 dark:border-white/5 dark:bg-[#1c1a18]">
          <div className="flex gap-3">
            <button
              onClick={clearAll}
              className="flex-1 rounded-xl border border-char/10 px-4 py-3 text-sm font-medium text-char transition-colors hover:bg-char/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
            >
              پاک کردن همه
            </button>
            <button
              onClick={applyFilters}
              className="flex-1 rounded-xl bg-lajvard px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char dark:hover:bg-lajvard-soft/80"
            >
              اعمال فیلترها
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── Main Export ───── */
export function ShopFilters({
  categories,
  brands,
  currentSort,
  totalProducts,
  activeFilters,
}: ShopFiltersProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const buildSortHref = useCallback(
    (sort: string) => {
      const next = new URLSearchParams(params);
      next.set("sort", sort);
      next.delete("page");
      return `${pathname}?${next.toString()}`;
    },
    [params, pathname]
  );

  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Mobile filter button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-char/10 bg-surface px-4 py-2.5 text-sm font-medium text-char transition-colors hover:border-char/20 lg:hidden dark:border-white/10 dark:bg-[#262320] dark:text-white"
              aria-label="فیلترها"
            >
              <SlidersHorizontal className="h-4 w-4 text-char-soft" />
              فیلترها
              {Object.values(activeFilters).filter(Boolean).length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lajvard text-[10px] font-bold text-white">
                  {Object.values(activeFilters).filter(Boolean).length}
                </span>
              )}
            </button>
            <SortDropdown currentSort={currentSort} buildHref={buildSortHref} />
          </div>
          <p className="text-sm text-char-soft dark:text-white/50">
            {new Intl.NumberFormat("fa-IR").format(totalProducts)} محصول
          </p>
        </div>

        {/* Active Filter Chips */}
        <ActiveFilterChips
          activeFilters={activeFilters}
          categories={categories}
          brands={brands}
          pathname={pathname}
          params={params}
        />
      </div>

      {/* Desktop Layout: Sidebar + Content */}
      <div className="flex gap-8">
        <DesktopFilters
          categories={categories}
          brands={brands}
          activeFilters={activeFilters}
          pathname={pathname}
          params={params}
        />

        {/* Mobile Sheet */}
        <MobileFilterSheet
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          categories={categories}
          brands={brands}
          activeFilters={activeFilters}
          pathname={pathname}
          params={params}
        />
      </div>
    </>
  );
}
