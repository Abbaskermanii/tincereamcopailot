import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { FeaturedArticle } from "@/components/blog/featured-article";
import { ArticleFeed } from "@/components/blog/article-feed";
import { ArticleCategoryNav } from "@/components/blog/article-category-nav";
import { PopularArticles } from "@/components/blog/popular-articles";
import { ArticleCard } from "@/components/blog/article-card";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "مجله آنیمور سرام | ایده‌ها، داستان‌ها و چیزهایی که ارزش خواندن دارند",
  description:
    "مجله تخصصی سفال و سرامیک — مقالات، راهنماها و داستان‌هایی از دنیای هنر سفالگری و کارگاه آنیمور سرام.",
  alternates: { canonical: "/blog" },
};

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_url?: string | null;
  published_at?: string | null;
  category_name?: string | null;
  author_name?: string | null;
  author_avatar_url?: string | null;
  reading_time_minutes?: number;
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: { category?: string; page?: string };
}) {
  const allArticles: ArticleItem[] = (await api.articles()) ?? [];
  const categories = (await api.articleCategories()) ?? [];

  const activeCategory = searchParams?.category;
  const currentPage = Math.max(1, Number(searchParams?.page ?? 1));
  const PAGE_SIZE = 9;

  let filtered = allArticles;
  if (activeCategory) {
    const cat = categories.find((c) => c.slug === activeCategory);
    if (cat) {
      filtered = allArticles.filter((a) => a.category_name === cat.name);
    }
  }

  const leadArticle = filtered[0] ?? null;
  const secondaryArticles = filtered.slice(1, 4);
  const restArticles = filtered.slice(4);

  const totalPages = Math.ceil(restArticles.length / PAGE_SIZE);
  const paginatedArticles = restArticles.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const popular = [...allArticles]
    .sort((a, b) => (b.reading_time_minutes ?? 0) - (a.reading_time_minutes ?? 0))
    .slice(0, 5);

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    params.set("page", String(page));
    return `/blog?${params.toString()}`;
  };

  return (
    <div className="min-h-screen">
      {/* Editorial hero */}
      <section className="relative overflow-hidden border-b border-char/5 px-4 py-14 md:px-6 md:py-20 dark:border-white/5">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-kiln-clay/10 dark:border-clay-soft/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border border-lajvard/10 dark:border-lajvard-soft/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-kiln-clay/5 blur-3xl dark:bg-clay-soft/5" />

        <div className="relative mx-auto max-w-6xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-kiln-clay/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-kiln-clay dark:bg-clay-soft/15 dark:text-clay-soft md:text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            مجله آنیمور سرام
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-char md:text-5xl lg:text-6xl dark:text-white">
            داستان‌ها از دنیای
            <span className="text-kiln-clay dark:text-clay-soft"> خاک و آتش</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-char-soft md:text-lg md:leading-9 dark:text-white/50">
            ایده‌ها، راهنماها و قصه‌هایی از کارگاه سفالگری؛ چیزهایی که ارزش خواندن دارند.
          </p>

          <div className="mt-8">
            <ArticleCategoryNav categories={categories} activeCategory={activeCategory} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Lead story + headline column (Bloomberg-style split) */}
        {filtered.length > 0 && (
          <section className="py-8 md:py-12">
            <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
              {leadArticle && (
                <div className="min-w-0">
                  <FeaturedArticle article={leadArticle} />
                </div>
              )}

              {secondaryArticles.length > 0 && (
                <div className="flex min-w-0 flex-col divide-y divide-char/8 rounded-wobble-card border border-char/10 bg-surface shadow-shelf dark:divide-white/8 dark:border-white/10 dark:bg-[#262320]">
                  <p className="px-4 pb-2 pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-char-soft/70 dark:text-white/35">
                    سرخط‌ها
                  </p>
                  {secondaryArticles.map((a, i) => (
                    <Link
                      key={a.id}
                      href={`/blog/${a.slug}`}
                      className="group flex flex-1 items-start gap-3 px-4 py-4 transition-colors hover:bg-char/[0.03] dark:hover:bg-white/[0.03]"
                    >
                      <span className="mt-0.5 shrink-0 text-lg font-extrabold leading-none text-char/15 transition-colors group-hover:text-lajvard dark:text-white/15 dark:group-hover:text-lajvard-soft">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 block text-sm font-bold leading-6 text-char transition-colors group-hover:text-lajvard dark:text-white/90 dark:group-hover:text-lajvard-soft">
                          {a.title}
                        </span>
                        {a.category_name && (
                          <span className="mt-1 block text-[10px] font-bold text-kiln-clay dark:text-clay-soft">
                            {a.category_name}
                          </span>
                        )}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Divider */}
        {filtered.length > 4 && (
          <div className="border-t border-char/8 dark:border-white/5" />
        )}

        {/* Main Content + Sidebar */}
        {paginatedArticles.length > 0 && (
          <section className="flex gap-8 py-8 md:py-12">
            {/* Feed */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-char-soft/60 dark:text-white/30">
                آخرین مقالات
              </div>
              <ArticleFeed articles={paginatedArticles} />
            </div>

            {/* Sidebar */}
            <aside className="hidden w-72 shrink-0 lg:block">
              <div className="sticky top-24 space-y-8">
                <PopularArticles articles={popular} />

                {/* Shop CTA */}
                <div className="rounded-wobble-card bg-gradient-to-br from-lajvard to-lajvard-deep p-6 text-white dark:from-[#1e2a3a] dark:to-[#16202e]">
                  <p className="text-sm font-extrabold">از قصه تا قطعه</p>
                  <p className="mt-2 text-xs leading-6 text-white/70">
                    قطعاتی که توشون می‌خونید رو توی فروشگاه کارگاه ببینید.
                  </p>
                  <Link
                    href="/shop"
                    className="group mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-lajvard transition-colors hover:bg-kiln-clay hover:text-white"
                  >
                    مشاهده فروشگاه
                    <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </aside>
          </section>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="صفحه‌بندی" className="flex justify-center gap-2 pb-12 pt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={buildPageHref(n)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                  n === currentPage
                    ? "bg-lajvard text-white shadow-md dark:bg-lajvard-soft dark:text-char"
                    : "bg-char/8 text-char hover:bg-char/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                }`}
              >
                {new Intl.NumberFormat("fa-IR").format(n)}
              </Link>
            ))}
          </nav>
        )}

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="py-16">
            <EmptyState
              title="هنوز مقاله‌ای منتشر نشده"
              description="به‌زودی مقالات جدیدی اضافه می‌کنیم."
            />
          </div>
        )}
      </div>
    </div>
  );
}
