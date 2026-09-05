import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { FeaturedArticle } from "@/components/blog/featured-article";
import { ArticleFeed } from "@/components/blog/article-feed";
import { ArticleCategoryNav } from "@/components/blog/article-category-nav";
import { PopularArticles } from "@/components/blog/popular-articles";
import { ArticleCard } from "@/components/blog/article-card";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "مجله تن‌سِرام | ایده‌ها، داستان‌ها و چیزهایی که ارزش خواندن دارند",
  description: "مجله تخصصی سفال و سرامیک — مقالات، راهنماها و داستان‌هایی از دنیای هنر سفالگری",
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
  const PAGE_SIZE = 8;

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
    currentPage * PAGE_SIZE
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
      {/* Hero */}
      <section className="border-b border-char/5 bg-gradient-to-b from-char/[0.02] to-transparent px-4 py-12 md:px-6 md:py-16 dark:from-white/[0.01]">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-char md:text-5xl lg:text-6xl dark:text-white">
            مجله
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-char-soft md:text-lg dark:text-white/50">
            ایده‌ها، داستان‌ها و چیزهایی که ارزش خواندن دارند.
          </p>

          <div className="mt-6">
            <ArticleCategoryNav categories={categories} activeCategory={activeCategory} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Lead Story + Secondary */}
        {filtered.length > 0 && (
          <section className="py-8 md:py-12">
            {leadArticle && (
              <div className="mb-6 md:mb-8">
                <FeaturedArticle article={leadArticle} />
              </div>
            )}

            {secondaryArticles.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {secondaryArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            )}
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
            <div className="mb-4 text-xs font-bold uppercase tracking-widest text-char-soft/60 dark:text-white/30">
                آخرین مقالات
              </div>
              <ArticleFeed articles={paginatedArticles} />
            </div>

            {/* Sidebar */}
            <aside className="hidden w-72 shrink-0 lg:block">
              <div className="sticky top-24 space-y-8">
                <PopularArticles articles={popular} />

                {/* Newsletter CTA */}
                <div className="rounded-2xl border border-char/5 bg-char/[0.02] p-5 dark:border-white/5 dark:bg-white/[0.02]">
                  <h4 className="text-sm font-bold text-char dark:text-white">عضو خبرنامه شوید</h4>
                  <p className="mt-1.5 text-xs leading-5 text-char-soft dark:text-white/40">
                    جدیدترین مقالات و اخبار را در ایمیل خود دریافت کنید.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="email"
                      placeholder="ایمیل"
                      className="min-h-[36px] flex-1 rounded-lg border border-char/10 bg-white px-3 text-xs text-char placeholder:text-char-soft/40 focus:border-lajvard focus:outline-none focus:ring-1 focus:ring-lajvard/25 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/30"
                    />
                    <button className="shrink-0 rounded-lg bg-lajvard px-3 text-xs font-bold text-white transition-colors hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char">
                      عضویت
                    </button>
                  </div>
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
