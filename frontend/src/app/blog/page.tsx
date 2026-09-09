import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { FeaturedArticle } from "@/components/blog/featured-article";
import { ArticleFeed } from "@/components/blog/article-feed";
import { PopularArticles } from "@/components/blog/popular-articles";
import { ArticleCategoryNav } from "@/components/blog/article-category-nav";
import { Reveal } from "@/components/motion/reveal";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "مقالات آنیمور سرام | ایده‌ها، داستان‌ها و چیزهایی که ارزش خواندن دارند",
  description:
    "مقالات تخصصی سفال و سرامیک — مقالات، راهنماها و داستان‌هایی از دنیای هنر سفالگری و کارگاه آنیمور سرام.",
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
  const PAGE_SIZE = 6;

  let filtered = allArticles;
  if (activeCategory) {
    const cat = categories.find((c) => c.slug === activeCategory);
    if (cat) {
      filtered = allArticles.filter((a) => a.category_name === cat.name);
    }
  }

  const leadArticle = filtered[0] ?? null;
  const secondaryArticles = filtered.slice(1, 6);
  const restArticles = filtered.slice(6);

  const totalPages = Math.ceil(restArticles.length / PAGE_SIZE);
const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedArticles = restArticles.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const feedArticles = filtered.length > 6 ? paginatedArticles : filtered;


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
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Page header + category nav — always visible, even when a category is empty */}
        <Reveal>
          <header className="pt-10 md:pt-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-kiln-clay dark:text-clay-soft">
              مقالات آنیمور سرام
            </span>
            <h1 className="mt-3 text-3xl font-extrabold leading-snug text-char md:text-4xl dark:text-white">
              ایده‌ها، داستان‌ها و چیزهایی که ارزش خواندن دارند
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-8 text-char-soft dark:text-white/55">
              از پشتِ چرخِ سفالگری تا قفسه‌های خانه‌تان؛ داستان قطعه‌ها، راهنماهای کاربردی و
              زندگیِ دست‌ساز را در مقالات آنیمور سرام بخوانید.
            </p>
            <div className="mt-6 border-b border-char/8 pb-6 dark:border-white/5">
              <ArticleCategoryNav
                categories={categories}
                activeCategory={activeCategory}
              />
            </div>
          </header>
        </Reveal>

        {/* Lead story + headline column (Bloomberg-style split) */}
        {filtered.length > 6 && (
          <section className="py-8 md:py-12">
            <Reveal delay={100}>
              <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
                {leadArticle && (
                  <div className="min-w-0">
                    <FeaturedArticle article={leadArticle} />
                  </div>
                )}

                {secondaryArticles.length > 0 && (
                  <div className="flex min-w-0 flex-col divide-y divide-char/8 rounded-wobble-card border border-char/10 bg-surface shadow-shelf transition-shadow duration-300 hover:shadow-lifted dark:divide-white/8 dark:border-white/10 dark:bg-[#262320]">
                    <p className="px-4 pb-2 pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-char-soft/70 dark:text-white/35">
                      سرخط‌ها
                    </p>
                    {secondaryArticles.map((a, i) => (
                      <Link
                        key={a.id}
                        href={`/blog/${a.slug}`}
                        className="group flex flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-char/[0.03] dark:hover:bg-white/[0.03]"
                      >
                        <span className="shrink-0 text-lg font-extrabold leading-none text-char/15 transition-colors group-hover:text-lajvard dark:text-white/15 dark:group-hover:text-lajvard-soft">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slip dark:bg-char">
                          {a.cover_url ? (
                            <Image
                              src={mediaUrl(a.cover_url)}
                              alt={a.title}
                              fill
                              sizes="80px"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center">
                              <svg
                                className="h-5 w-5 text-char/10 dark:text-white/10"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                              </svg>
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
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
            </Reveal>
          </section>
        )}

        {/* Divider */}
        {filtered.length > 6 && (
          <div className="border-t border-char/8 dark:border-white/5" />
        )}

        {/* Main Content + Sidebar */}
        {feedArticles.length > 0 && (
          <section className="flex gap-8 py-8 md:py-12">
            {/* Feed */}
            <div className="min-w-0 flex-1">
              <Reveal delay={200}>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-char-soft/60 dark:text-white/30">
                  مقالات بیشتر
                </div>
                <ArticleFeed articles={feedArticles} />
              </Reveal>
            </div>

            {/* Sidebar */}
            <aside className="hidden w-72 shrink-0 lg:block">
              <div className="sticky top-24 space-y-8">
                <Reveal delay={200}>
                  <PopularArticles articles={popular} />
                </Reveal>

                {/* Shop CTA */}
                <Reveal delay={300}>
                  <div className="rounded-wobble-card bg-gradient-to-br from-lajvard to-lajvard-deep p-6 text-white transition-shadow duration-300 hover:shadow-lifted dark:from-[#1e2a3a] dark:to-[#16202e]">
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
                </Reveal>
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
                  n === safePage
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
