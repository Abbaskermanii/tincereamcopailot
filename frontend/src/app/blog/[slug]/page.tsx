import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api, mediaUrl, SITE_URL } from "@/lib/api";
import { Calendar, Clock, Eye, Tag, ChevronLeft, Home } from "lucide-react";
import { ShareButton } from "@/components/store/share-button";

export const revalidate = 30;

interface Props { params: { slug: string } }

async function getArticle(slug: string) {
  const article = await api.article(slug);
  return article;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return { title: "مقاله یافت نشد" };
  const title = article.meta_title || article.title;
  const description = article.meta_description || article.excerpt || article.body?.slice(0, 160).replace(/<[^>]+>/g, "") || "";
  const url = `${SITE_URL}/blog/${article.slug}`;
  const ogImage = article.cover_url || article.cover_image_url ? mediaUrl(article.cover_url ?? article.cover_image_url) : undefined;
  return {
    title: `${title} | مجله تن‌سِرام`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | تن‌سِرام`,
      description,
      url,
      type: "article",
      images: ogImage ? [{ url: ogImage }] : undefined,
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at ?? article.published_at ?? undefined,
      authors: article.author_name ? [article.author_name] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    other: {
      "article:author": article.author_name ?? "",
      "article:published_time": article.published_at ?? "",
    },
  };
}

function addHeadingIds(html: string): { html: string; toc: Array<{ id: string; text: string; level: number }> } {
  let counter = 0;
  const toc: Array<{ id: string; text: string; level: number }> = [];
  const newHtml = html.replace(/<(h[2-4])([^>]*)>(.*?)<\/h[2-4]>/gi, (_match, tag: string, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (!text) return _match;
    counter += 1;
    const id = `heading-${counter}`;
    const level = Number(tag[1]);
    toc.push({ id, text, level });
    // preserve existing attrs but add/replace id
    const hasId = /id\s*=/.test(attrs);
    const newAttrs = hasId ? attrs.replace(/id\s*=\s*["'][^"']*["']/, `id="${id}"`) : `${attrs} id="${id}"`;
    return `<${tag}${newAttrs}>${inner}</${tag}>`;
  });
  return { html: newHtml, toc };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const tagCount = article.tags?.length ?? 0;
  const readingTime = article.reading_time_minutes ?? 0;
  const viewCount = article.view_count ?? 0;
  const cover = article.cover_url ?? article.cover_image_url ?? null;
  const { html: bodyWithIds, toc } = addHeadingIds(article.body || "");

  const site = SITE_URL;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    image: cover ? [mediaUrl(cover)] : [],
    author: { "@type": "Person", name: article.author_name ?? "تن‌سِرام" },
    publisher: { "@type": "Organization", name: "تن‌سِرام", logo: { "@type": "ImageObject", url: `${site}/logo.png` } },
    datePublished: article.published_at,
    dateModified: article.updated_at ?? article.published_at,
    description: article.excerpt ?? "",
    mainEntityOfPage: `${site}/blog/${article.slug}`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: site },
      { "@type": "ListItem", position: 2, name: "مجله", item: `${site}/blog` },
      { "@type": "ListItem", position: 3, name: article.title, item: `${site}/blog/${article.slug}` },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-6 flex items-center gap-1 text-xs text-ink-soft">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-lajvard"><Home className="h-3.5 w-3.5" />خانه</Link>
        <ChevronLeft className="h-3 w-3" />
        <Link href="/blog" className="hover:text-lajvard">مجله</Link>
        <ChevronLeft className="h-3 w-3" />
        <span className="line-clamp-1 font-medium text-char dark:text-ink">{article.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.7fr_0.9fr]">
        {/* Main */}
        <article className="min-w-0">
          <h1 className="text-3xl font-extrabold leading-snug md:text-4xl">{article.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{article.published_at ? new Date(article.published_at).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" }) : ""}</span>
            {readingTime ? <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{readingTime} دقیقه مطالعه</span> : null}
            <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{new Intl.NumberFormat("fa-IR").format(viewCount)} بازدید</span>
            {article.category_name && <span className="rounded-full bg-char/5 px-2.5 py-1 dark:bg-white/10">{article.category_name}</span>}
          </div>

          {/* Author card */}
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-shelf dark:bg-black/25">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-lajvard/10 text-sm font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft">
              {article.author_avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(article.author_avatar_url)} alt={article.author_name ?? "نویسنده"} className="h-full w-full object-cover" />
              ) : (
                (article.author_name || "?")[0]?.toUpperCase()
              )}
            </div>
            <div>
              <p className="text-sm font-bold">{article.author_name ?? "تیم تن‌سِرام"}</p>
              <p className="text-xs text-ink-soft">نویسندهٔ مقاله</p>
            </div>
            <div className="mr-auto">
              <ShareButton title={article.title} slug={article.slug} />
            </div>
          </div>

          {/* Cover */}
          {cover && (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-wobble bg-slip">
              <Image
                src={mediaUrl(cover)}
                alt={article.title}
                fill
                sizes="(max-width:1024px) 100vw, 70vw"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* TOC */}
          {toc.length >= 3 && (
            <div className="mt-8 rounded-2xl border border-char/10 bg-surface p-5 dark:border-white/10 dark:bg-black/20">
              <p className="font-bold">فهرست مطالب</p>
              <ul className="mt-3 space-y-2">
                {toc.map((h) => (
                  <li key={h.id} style={{ marginRight: `${(h.level - 2) * 12}px` }}>
                    <a href={`#${h.id}`} className="text-sm text-lajvard hover:underline dark:text-lajvard-soft">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Body */}
          <div
            className="prose prose-sm mt-8 max-w-none leading-8 text-char-soft dark:prose-invert dark:text-ink-soft prose-headings:font-extrabold prose-h2:mt-10 prose-h2:text-2xl prose-h3:text-xl prose-a:text-lajvard dark:prose-a:text-lajvard-soft prose-img:rounded-xl prose-img:shadow-shelf prose-blockquote:border-r-4 prose-blockquote:border-firouzeh/30 prose-blockquote:pr-4"
            dangerouslySetInnerHTML={{ __html: bodyWithIds }}
          />

          {/* Tags */}
          {tagCount > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {article.tags!.map((t) => (
                <Link key={t.slug} href={`/blog?tag=${encodeURIComponent(t.slug)}`} className="inline-flex items-center gap-1 rounded-full border border-char/15 bg-surface px-3 py-1.5 text-xs hover:bg-char/5 dark:border-white/15 dark:bg-black/20">
                  <Tag className="h-3 w-3" />{t.name}
                </Link>
              ))}
            </div>
          )}

          {/* Share bottom */}
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-char/5 p-4 dark:bg-white/10">
            <p className="text-sm font-medium">این مقاله را به اشتراک بگذارید</p>
            <div className="mr-auto">
              <ShareButton title={article.title} slug={article.slug} variant="full" />
            </div>
          </div>

          {/* Related */}
          {article.related && article.related.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-extrabold">مقالات مرتبط</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {article.related.map((r) => (
                  <Link key={r.slug} href={`/blog/${r.slug}`} className="group overflow-hidden rounded-2xl bg-surface shadow-shelf hover:shadow-lifted dark:bg-black/25">
                    <div className="relative aspect-[16/10] bg-slip">
                      {r.cover_url ? (
                        <Image src={mediaUrl(r.cover_url)} alt={r.title} fill sizes="300px" className="object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-ink-soft">بدون تصویر</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-sm font-bold group-hover:text-lajvard">{r.title}</h3>
                      <p className="mt-1 text-xs text-ink-soft line-clamp-2">{r.excerpt ?? ""}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 self-start">
          <div className="rounded-2xl bg-surface p-5 shadow-shelf dark:bg-black/25">
            <p className="font-bold">درباره نویسنده</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-lajvard/10 text-lajvard">
                {article.author_avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(article.author_avatar_url)} alt={article.author_name ?? ""} className="h-full w-full object-cover" />
                ) : (
                  (article.author_name || "?")[0]?.toUpperCase()
                )}
              </div>
              <div>
                <p className="text-sm font-bold">{article.author_name ?? "تیم تن‌سِرام"}</p>
                <p className="text-xs text-ink-soft">نویسنده مجله تن‌سِرام</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-soft">مطالب این نویسنده با دقت برای الهام‌بخشی و آموزش سفال دست‌ساز تهیه شده است.</p>
          </div>

          <div className="rounded-2xl bg-surface p-5 shadow-shelf dark:bg-black/25">
            <p className="font-bold">دسته‌بندی</p>
            {article.category_name ? (
              <Link href={`/blog?category=${encodeURIComponent(article.category_name)}`} className="mt-3 inline-flex rounded-full bg-lajvard/10 px-3 py-1.5 text-sm text-lajvard dark:bg-lajvard-soft/15">{article.category_name}</Link>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">بدون دسته</p>
            )}
          </div>

          <div className="rounded-2xl bg-lajvard p-6 text-white dark:bg-lajvard-soft dark:text-char">
            <p className="font-bold">محصولات مرتبط</p>
            <p className="mt-2 text-sm opacity-90">محصولات دست‌ساز کارگاه را در فروشگاه ببینید.</p>
            <Link href="/shop" className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-white px-4 text-sm font-bold text-lajvard dark:bg-char dark:text-white">رفتن به فروشگاه</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
