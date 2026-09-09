import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, ChevronLeft, Clock, UserRound } from "lucide-react";

import { api, mediaUrl, SITE_URL } from "@/lib/api";
import { BreadcrumbNav } from "@/components/ui/breadcrumbs";
import { ArticleCard } from "@/components/blog/article-card";
import { ShareButtons } from "@/components/blog/share-buttons";
import { Reveal } from "@/components/motion/reveal";

export const revalidate = 300;

interface Props {
  params: { slug: string };
}

async function getArticle(slug: string) {
  return api.article(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return { title: "مقاله یافت نشد" };

  const title = `${article.title} | مقالات آنیمور سرام`;
  const description =
    article.excerpt?.slice(0, 160) ?? `مقاله «${article.title}» در مقالات آنیمور سرام`;
  const ogImage = article.cover_url ? mediaUrl(article.cover_url) : undefined;
  const metaTags = article.tags ?? [];

  return {
    title,
    description,
    keywords: metaTags.length ? metaTags.join(", ") : undefined,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: article.published_at ?? undefined,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

/** Server-safe HTML sanitiser: strips scripts/styles/handlers from CMS body. */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/ on[a-z]+="[^"]*"/gi, "")
    .replace(/ on[a-z]+='[^']*'/gi, "");
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticle(params.slug);
  if (!article) notFound();
  const tags = article.tags ?? [];

  const [categories, allArticles] = await Promise.all([
    api.articleCategories(),
    api.articles(),
  ]);

  const categorySlug = categories?.find((c) => c.name === article.category_name)?.slug;

  // Related: same-category articles first, then newest others — up to 4, no repeats
  const sameCategory = (allArticles ?? []).filter(
    (a) => a.slug !== article.slug && a.category_name === article.category_name,
  );
  const relatedSlugs = new Set([article.slug, ...sameCategory.map((a) => a.slug)]);
  const latestOthers = (allArticles ?? []).filter((a) => !relatedSlugs.has(a.slug));
  const related = [...sameCategory, ...latestOthers].slice(0, 4);

  const articleUrl = `${SITE_URL}/blog/${article.slug}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? undefined,
    keywords: tags.length ? tags.join(", ") : undefined,
    image: article.cover_url ? [mediaUrl(article.cover_url)] : undefined,
    datePublished: article.published_at ?? undefined,
    dateModified: article.published_at ?? undefined,
    author: article.author_name
      ? { "@type": "Person", name: article.author_name }
      : { "@type": "Organization", name: "آنیمور سرام" },
    publisher: { "@type": "Organization", name: "آنیمور سرام" },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "مقالات", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <BreadcrumbNav
        items={[
          { label: "خانه", href: "/" },
          { label: "مقالات", href: "/blog" },
          { label: article.title },
        ]}
      />

      <article className="grid gap-10 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="min-w-0 max-w-full">
          {/* Header */}
          <Reveal>
            <header className="max-w-3xl">
              {article.category_name && (
                <Link
                  href={categorySlug ? `/blog?category=${categorySlug}` : "/blog"}
                  className="inline-block rounded-full bg-kiln-clay/10 px-3 py-1 text-xs font-bold text-kiln-clay transition-colors hover:bg-kiln-clay/20 dark:bg-clay-soft/15 dark:text-clay-soft"
                >
                  {article.category_name}
                </Link>
              )}
              <h1 className="mt-4 text-3xl font-extrabold leading-[1.3] md:text-4xl md:leading-[1.3]">
                {article.title}
              </h1>
              {article.excerpt && (
                <p className="mt-4 text-base leading-8 text-char-soft dark:text-ink-soft md:text-lg md:leading-9">
                  {article.excerpt}
                </p>
              )}

              {/* Meta row */}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-char/10 py-4 text-xs text-char-soft dark:border-white/10 dark:text-white/50 md:text-sm">
                {article.author_name && (
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-lajvard/10 text-[10px] font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft">
                      {article.author_avatar_url ? (
                        <Image
                          src={mediaUrl(article.author_avatar_url)}
                          alt={article.author_name}
                          width={28}
                          height={28}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        article.author_name.charAt(0)
                      )}
                    </span>
                    <UserRound className="h-3.5 w-3.5" />
                    {article.author_name}
                  </span>
                )}
                {article.published_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(article.published_at)}
                  </span>
                )}
                {article.reading_time_minutes != null && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {article.reading_time_minutes} دقیقه مطالعه
                  </span>
                )}
              </div>
            </header>
          </Reveal>

          {/* Share */}
          <div className="mt-5 flex items-center justify-between gap-4">
            <ShareButtons url={articleUrl} title={article.title} />
          </div>

          {/* Cover */}
          {article.cover_url && (
            <Reveal className="mt-8">
              <figure className="overflow-hidden rounded-wobble-card bg-surface shadow-lifted dark:bg-[#1c1a18]">
                <div className="relative aspect-[16/9]">
                  <Image
                    src={mediaUrl(article.cover_url)}
                    alt={article.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover"
                  />
                </div>
              </figure>
            </Reveal>
          )}

          {/* Body */}
          <Reveal className="mt-8">
            <div className="article-body mx-auto max-w-3xl overflow-hidden rounded-wobble-card border border-char/10 bg-surface p-5 shadow-shelf dark:border-white/10 dark:bg-[#262320] sm:p-8">
            {article.body ? (
              <div className="prose prose-sm sm:prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.body) }} />
            ) : null}

            </div>          </Reveal>

          {/* Category footer chip + tags */}
          {(article.category_name || tags.length > 0) && (
            <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-char/10 pt-6 dark:border-white/10">
              {article.category_name && (
                <>
                  <span className="text-sm text-char-soft dark:text-white/50">موضوع:</span>
                  <Link
                    href={categorySlug ? `/blog?category=${categorySlug}` : "/blog"}
                    className="rounded-full bg-char/5 px-3 py-1 text-sm font-medium text-char transition-colors hover:bg-lajvard/10 hover:text-lajvard dark:bg-white/5 dark:text-white/70 dark:hover:text-lajvard-soft"
                  >
                    {article.category_name}
                  </Link>
                </>
              )}
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-char/5 px-3 py-1 text-sm font-medium text-char transition-colors hover:bg-lajvard/10 hover:text-lajvard dark:bg-white/5 dark:text-white/70 dark:hover:text-lajvard-soft"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <Reveal>
            <div className="rounded-wobble-card bg-gradient-to-br from-kiln-clay/10 to-lajvard/10 p-6 dark:from-clay-soft/10 dark:to-lajvard-soft/10">
              <p className="text-sm font-extrabold text-char dark:text-white">از کارگاه تا خانه شما</p>
              <p className="mt-2 text-xs leading-6 text-char-soft dark:text-white/50">
                هر قطعه آنیمور سرام روی چرخ، با دست و با لعاب‌دستی سنتی شکل می‌گیرد.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-flex rounded-full bg-lajvard px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char"
              >
                مشاهده فروشگاه
              </Link>
            </div>
          </Reveal>

          {allArticles && allArticles.length > 0 && (
            <Reveal>
              <div>
                <h2 className="mb-4 border-b border-char/10 pb-3 text-base font-extrabold dark:border-white/10">
                  تازه‌ترین مقالات
                </h2>
                <div className="space-y-4">
                  {allArticles
                    .filter((a) => a.slug !== article.slug)
                    .slice(0, 4)
                    .map((a) => (
                      <Link
                        key={a.id}
                        href={`/blog/${a.slug}`}
                        className="group flex items-start gap-3"
                      >
                        <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-slip dark:bg-char">
                          {a.cover_url && (
                            <Image
                              src={mediaUrl(a.cover_url)}
                              alt=""
                              fill
                              sizes="80px"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-2 text-xs font-bold leading-5 text-char transition-colors group-hover:text-lajvard dark:text-white/85 dark:group-hover:text-lajvard-soft">
                            {a.title}
                          </span>
                          <span className="mt-1 block text-[10px] text-char-soft dark:text-white/35">
                            {formatDate(a.published_at)}
                          </span>
                        </span>
                      </Link>
                    ))}
                </div>
              </div>
            </Reveal>
          )}
        </aside>
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related-articles">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 id="related-articles" className="text-2xl font-extrabold">
              مقالات مرتبط
            </h2>
            <Link
              href="/blog"
              className="group flex shrink-0 items-center gap-1 text-sm font-bold text-lajvard transition-colors hover:text-lajvard-deep dark:text-lajvard-soft dark:hover:text-white"
            >
              همه مقالات
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((a, i) => (
              <Reveal key={a.id} delay={i * 100} className="h-full">
                <ArticleCard article={a} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
