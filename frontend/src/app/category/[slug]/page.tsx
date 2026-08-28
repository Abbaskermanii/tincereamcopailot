import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/store/product-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";

export const revalidate = 120;

interface Props {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}

async function resolveCategory(slug: string) {
  return api.category(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await resolveCategory(params.slug);
  if (!cat) return { title: "دسته یافت نشد" };
  const title = cat.name;
  const description =
    cat.description ??
    `خرید ${cat.name} دست‌ساز با لعاب‌دستی سنتی؛ ارسال به سراسر ایران.`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${cat.slug}` },
    openGraph: { title: `${title} | تن‌سِرام`, description },
  };
}

const SORTS = [
  { key: "newest", label: "جدیدترین" },
  { key: "price_asc", label: "ارزان‌ترین" },
  { key: "price_desc", label: "گران‌ترین" },
];

function buildQuery(base: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  const merged = { ...base, ...patch };
  for (const [k, v] of Object.entries(merged)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const cat = await resolveCategory(params.slug);
  if (!cat) notFound();

  const get = (k: string) => {
    const v = searchParams[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const sort = get("sort") ?? "newest";
  const minPrice = get("min_price");
  const maxPrice = get("max_price");
  const page = Number(get("page") ?? "1");

  const data =
    (await api.products({
      category: cat.slug,
      sort,
      min_price: minPrice,
      max_price: maxPrice,
      page,
      page_size: 12,
    })) ?? null;

  const currentFilters = { sort, min_price: minPrice, max_price: maxPrice };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <Breadcrumbs items={[{ name: "خانه", href: "/" }, { name: cat.name }]} />

      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-extrabold md:text-4xl">{cat.name}</h1>
        {cat.description && (
          <p className="mt-4 leading-8 text-char-soft dark:text-ink-soft">{cat.description}</p>
        )}
      </header>

      <nav aria-label="مرتب‌سازی و فیلتر" className="mb-8 flex flex-wrap items-center gap-3 border-y border-char/10 py-4 dark:border-white/10">
        <span className="text-sm font-bold">چیدمان:</span>
        {SORTS.map((s) => (
          <Link
            key={s.key}
            href={`/category/${cat.slug}${buildQuery(currentFilters, { sort: s.key, page: undefined })}`}
            scroll={false}
            className={
              "rounded-full px-4 py-1.5 text-sm transition-colors " +
              (sort === s.key
                ? "bg-lajvard text-white"
                : "bg-char/6 hover:bg-char/12 dark:bg-white/8 dark:hover:bg-white/15")
            }
            aria-current={sort === s.key ? "true" : undefined}
          >
            {s.label}
          </Link>
        ))}
        <form action={`/category/${cat.slug}`} method="get" className="mr-auto flex items-center gap-2">
          <input type="hidden" name="sort" value={sort} />
          <input
            name="min_price"
            defaultValue={minPrice}
            inputMode="numeric"
            dir="ltr"
            placeholder="از قیمت"
            className="num-latin h-9 w-28 rounded-xl border border-char/15 bg-surface px-3 text-sm dark:border-white/20 dark:bg-black/25"
          />
          <input
            name="max_price"
            defaultValue={maxPrice}
            inputMode="numeric"
            dir="ltr"
            placeholder="تا قیمت"
            className="num-latin h-9 w-28 rounded-xl border border-char/15 bg-surface px-3 text-sm dark:border-white/20 dark:bg-black/25"
          />
          <button className="rounded-xl bg-char/6 px-4 py-2 text-sm hover:bg-char/12 dark:bg-white/10">
            اعمال
          </button>
        </form>
      </nav>

      {!data || data.items.length === 0 ? (
        <EmptyState
          title="چیزی در این قفسه نیست"
          description="با فیلترهای دیگر امتحان کنید یا سراغ مجموعه‌های ما بروید."
        />
      ) : (
        <>
          <SectionHeading
            title={`${new Intl.NumberFormat("fa-IR").format(data.total)} کالا`}
            subtitle={`صفحهٔ ${new Intl.NumberFormat("fa-IR").format(data.page)} از ${new Intl.NumberFormat("fa-IR").format(Math.max(data.pages, 1))}`}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {data.pages > 1 && (
            <nav aria-label="صفحه‌بندی" className="mt-10 flex justify-center gap-2">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={`/category/${cat.slug}${buildQuery(currentFilters, { page: String(n) })}`}
                  scroll={false}
                  aria-current={n === page ? "page" : undefined}
                  className={
                    "num-latin flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium " +
                    (n === page
                      ? "bg-lajvard text-white"
                      : "bg-char/6 hover:bg-char/12 dark:bg-white/8")
                  }
                >
                  {new Intl.NumberFormat("fa-IR").format(n)}
                </Link>
              ))}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
