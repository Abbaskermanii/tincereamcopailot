"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { mediaUrl } from "@/lib/api";
import { useEffect, useState } from "react";
import { Calendar, Tag } from "lucide-react";
import { TrackRecentlyViewed } from "@/components/store/track-recently-viewed";
import DOMPurify from "dompurify";

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  return DOMPurify.sanitize(html);
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  published_at: string;
  cover_image_url?: string | null;
  categories?: Category[];
  tags?: { id: string; name: string; slug: string }[];
}

interface Props {
  params: { slug: string };
}

export default function ArticlePage({ params }: Props) {
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { API_URL } = await import("@/lib/api");
        const res = await fetch(`${API_URL}/articles/${encodeURIComponent(params.slug)}`, { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) { notFound(); return; }
        const data = await res.json();
        if (data?.title) setArticle(data as Article);
        else notFound();
      } catch {
        if (!cancelled) notFound();
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [params.slug]);

  if (!article) return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-char-soft">در حال بارگذاری…</div>;

  const tagCount = article.tags?.length ?? 0;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.cover_image_url ? mediaUrl(article.cover_image_url) : undefined,
    datePublished: article.published_at,
    publisher: { "@type": "Organization", name: "تن‌سِرام" },
    url: typeof window !== "undefined" ? window.location.href : "",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <TrackRecentlyViewed
        slug={article.slug}
        name={article.title}
        price={0}
        imageUrl={article.cover_image_url ?? ""}
      />

      <div className="grid gap-6 md:grid-cols-12">
        {/* Main article column */}
        <div className="col-span-12 md:col-span-8 lg:col-span-8">
          <article className="prose lg:prose-xl max-w-none">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl mb-6">
              {article.title}
            </h1>

            {/* Metadata line */}
            <div className="flex flex-col md:flex-row items-center gap-3 mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-char-soft" />
                <span className="text-sm text-char-soft dark:text-ink-soft">
                  {new Date(article.published_at).toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-char-soft" />
                <span className="text-sm text-char-soft dark:text-ink-soft">
                  {tagCount > 0 ? tagCount : "بدون تگ"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-char-soft"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 5h6v2h-6V5zm1 3H8v8h2V8zm5-3a2 2 0 100-4 2 2 0 000 4zm-7 7a2 2 0 100-4 2 2 0 000 4zm7-4a2 2 0 100-4 2 2 0 000 4zM6 8a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                <span className="text-sm text-char-soft dark:text-ink-soft">
                  {tagCount > 0 ? `${tagCount} دقیقه مطالعه` : ""}
                </span>
              </div>
            </div>

            {/* Cover image */}
            {article.cover_image_url && (
              <img
                src={mediaUrl(article.cover_image_url)}
                alt={article.title}
                className="w-full h-64 md:h-80 object-cover rounded-t-lg mb-6"
              />
            )}

            {/* Article body */}
            <div className="text-lg leading-relaxed text-char-soft dark:text-ink-soft" dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.body) }} />

            {/* Tags */}
            {tagCount > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {article.tags?.map((tag) => (
                  <span
                    key={tag.slug}
                    className="inline-flex items-center rounded-full border border-char/15 bg-surface dark:border-white/10 px-2.5 py-0.5 text-xs text-char-soft dark:text-ink-soft mr-1"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </article>
        </div>

        {/* Sidebar column */}
        <div className="col-span-12 md:col-span-4 lg:col-span-4 space-y-6">
          {/* Related articles */}
          <div>
            <h2 className="text-xl font-medium border-b border-char/10 pb-3 mb-4">مقالات مرتبط</h2>
            <div className="space-y-3">
              <p className="text-sm text-char-soft dark:text-ink-soft">
                مقالات مرتبط در اینجا نمایش خواهد یافت
              </p>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h2 className="text-xl font-medium border-b border-char/10 pb-3 mb-4">دسته‌بندی‌ها</h2>
            <div className="space-y-2">
              {article.categories?.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="inline-flex items-center rounded-full border border-char/15 bg-surface dark:border-white/10 px-3 py-1.5 text-sm text-char-soft dark:text-ink-soft"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Similar articles or other sidebar content */}
          <div>
            <h2 className="text-xl font-medium border-b border-char/10 pb-3 mb-4">بخش‌های محصولات</h2>
            <p className="text-sm text-char-soft dark:text-ink-soft">
              محصولات مرتبط با این مقاله در کاتالوگ خرید موجود است.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}