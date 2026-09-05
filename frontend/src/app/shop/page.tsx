import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { ShopProductGrid } from "@/components/store/shop-product-grid";
import { ShopFilters } from "@/components/store/shop-filters";

export const metadata: Metadata = { title: "فروشگاه", description: "همه محصولات دست‌ساز تن‌سِرام" };
export const revalidate = 90;

async function getBrands(): Promise<Array<{ slug: string; name: string }>> {
  try {
    const brands = await api.brands();
    if (brands && Array.isArray(brands)) return brands.map((b) => ({ slug: b.slug, name: b.name }));
    return [];
  } catch {
    return [];
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { page?: string; sort?: string; category?: string; brand?: string; min_price?: string; max_price?: string; in_stock_only?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const sort = searchParams.sort ?? "newest";
  const categories = await api.categories();
  const brands = await getBrands();
  const data = await api.products({
    page,
    page_size: 16,
    sort,
    category: searchParams.category,
    brand: searchParams.brand,
    min_price: searchParams.min_price,
    max_price: searchParams.max_price,
    in_stock_only: searchParams.in_stock_only === "true",
  });

  const query = new URLSearchParams();
  if (searchParams.category) query.set("category", searchParams.category);
  if (searchParams.brand) query.set("brand", searchParams.brand);
  if (searchParams.min_price) query.set("min_price", searchParams.min_price);
  if (searchParams.max_price) query.set("max_price", searchParams.max_price);
  if (searchParams.in_stock_only) query.set("in_stock_only", searchParams.in_stock_only);

  const activeFilters = {
    category: searchParams.category,
    brand: searchParams.brand,
    min_price: searchParams.min_price,
    max_price: searchParams.max_price,
    in_stock_only: searchParams.in_stock_only,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-ink-soft">قفسه‌ی آنلاین کارگاه</p>
        <h1 className="mt-2 text-4xl font-extrabold">فروشگاه</h1>
      </div>

      {/* Filters & Grid Layout */}
      <div className="flex gap-8">
        {/* Desktop Sidebar + Mobile Sheet */}
        <ShopFilters
          categories={categories ?? []}
          brands={brands}
          currentSort={sort}
          totalProducts={data?.total ?? 0}
          activeFilters={activeFilters}
        />

        {/* Main Content */}
        <div className="min-w-0 flex-1">
          {!data || !data.items.length ? (
            <EmptyState
              title="محصولی پیدا نشد"
              description="به‌زودی قطعه‌های تازه‌ای از کوره اضافه می‌کنیم. فیلترها را تغییر دهید."
            />
          ) : (
            <>
              <ShopProductGrid items={data.items} />

              {/* Pagination */}
              {data.pages > 1 && (
                <nav aria-label="صفحه‌بندی" className="mt-10 flex justify-center gap-2">
                  {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => {
                    const params = new URLSearchParams(query);
                    params.set("page", String(n));
                    params.set("sort", sort);
                    return (
                      <Link
                        key={n}
                        href={`/shop?${params.toString()}`}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                          n === page
                            ? "bg-lajvard text-white shadow-md"
                            : "bg-char/8 text-char hover:bg-char/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                        }`}
                      >
                        {new Intl.NumberFormat("fa-IR").format(n)}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
