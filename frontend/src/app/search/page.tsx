"use client";

import Link from "next/link";
import { api } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { faPrice } from "@/lib/format";

export default function SearchPage() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{ category?: string; min_price?: number; max_price?: number; sort?: string }>({});
  const [products, setProducts] = useState<Array<{ id: string; name: string; slug: string; price: number; image_url?: string | null; price_old?: number }>>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const loadProducts = async () => {
    if (!q.trim() || loading) return;
    setLoading(true);
    try {
      await api.products({
        page_size: 24,
        page: page,
        search: q,
        min_price: filters.min_price,
        max_price: filters.max_price,
        sort: filters.sort,
      });
      setProducts((items) => {
        const existing = products.filter((p) => p.id !== items[0]?.id);
        return [...existing, ...items].filter(
          (p, idx, self) => self.findIndex((t) => t.id === p.id) === idx
        );
      });
      setTotal(products.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [q, page]);

  const handleFilter = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    const name = target.name;
    if (name && name !== "") {
      setFilters((prev) => {
        const newFilters = { ...prev };
        if (value === "") {
          delete (newFilters as Record<string, unknown>)[name];
        } else if (value === "on") {
          (newFilters as Record<string, unknown>)[name] = true;
        } else {
          (newFilters as Record<string, unknown>)[name] = value;
        }
        return newFilters;
      });
      setPage(1);
    }
  };

  const totalPages = Math.ceil(total / 24) || 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <SectionHeading
        title="نتایج جستجو"
        subtitle={`عبارت "${q}" برای ${products.length} محصول`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {["category", "min_price", "max_price", "sort"].map((key) => (
          <div
            key={key}
            className="border rounded-xl p-3 dark:border-white/10 mb-3"
          >
            <label className="block text-sm font-medium mb-2 text-ink dark:text-white">
              {key === "category" && "دسته‌بندی"}
              {key === "min_price" && "حداقل قیمت"}
              {key === "max_price" && "حداکثر قیمت"}
              {key === "sort" && "مرتب‌سازی"}
            </label>
            <input
              type={key === "category" ? "text" : "number"}
              name={key}
              placeholder={
                key === "category"
                  ? "انتخاب دسته‌بندی..."
                  : key === "min_price"
                    ? "مثلاً: 100,000"
                    : key === "max_price"
                      ? "مثلاً: 500,000"
                      : key === "sort"
                        ? "مرتب‌سازی..."
                        : ""
              }
              value={filters[key] || ""}
              onChange={handleFilter}
              className="w-full rounded border border-char/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black/25 focus:outline-none focus:ring-2 focus:ring-lajvard/25"
            />
            {key === "sort" && (
              <select
                name="sort"
                value={filters.sort || ""}
                onChange={handleFilter}
                className="w-full mt-2 rounded border border-char/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black/25 focus:outline-none focus:ring-2 focus:ring-lajvard/25"
              >
                <option value="newest">جدیدترین‌ها</option>
                <option value="price_asc">ارزان‌ترین‌ها</option>
                <option value="price_desc">گران‌ترین‌ها</option>
                <option value="name">نام‌الشهر</option>
              </select>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="rounded-xl border border-char/15 bg-surface hover:border-lajvard/50 transition-colors dark:border-white/10 dark:hover:border-lajvard-soft/50"
          >
            <div className="aspect-video overflow-hidden">
              <Link href={`/product/${product.slug}`}>
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-char/5">
                    <span className="text-xs text-char-soft dark:text-white/40">بدون تصویر</span>
                  </div>
                )}
              </Link>
            </div>
            <div className="p-3">
              <Link href={`/product/${product.slug}`}>
                <h3 className="text-sm font-medium truncate text-ink dark:text-white">
                  {product.name}
                </h3>
              </Link>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-lajvard dark:text-lajvard-soft">
                  {faPrice(product.price)}
                </span>
                {product.price_old && (
                  <span className="text-xs text-char-soft line-through dark:text-white/60">
                    {faPrice(product.price_old)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Link
              key={pageNum}
              href={`/search?q=${q}&page=${pageNum}`}
              className={`mx-2 rounded-lg px-4 py-2 text-sm transition-colors ${page === pageNum ? "bg-lajvard text-white dark:bg-lajvard-soft dark:text-ink" : "bg-char/10 text-char dark:bg-white/10 dark:text-white"}`}
            >
              {pageNum}
            </Link>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && q && (
        <div className="mt-12 text-center">
          <EmptyState
            icon="🔍"
            title="محصولی یافت نشد"
            description="با عبارت دیگری جستجو کنید یا فیلترهای متفاوتی را امتحان کنید"
          />
        </div>
      )}
    </div>
  );
}