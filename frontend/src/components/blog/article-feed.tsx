import Link from "next/link";
import Image from "next/image";
import { mediaUrl } from "@/lib/api";
import { Calendar, Clock, ArrowLeft } from "lucide-react";

export interface FeedArticle {
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

function FeedArticleRow({ article }: { article: FeedArticle }) {
  const img = article.cover_url ? mediaUrl(article.cover_url) : null;

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group flex gap-4 border-b border-char/5 py-5 dark:border-white/5 md:gap-6"
    >
      {/* Image */}
      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-slip dark:bg-char sm:h-28 sm:w-32">
        {img ? (
          <Image
            src={img}
            alt={article.title}
            fill
            sizes="128px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-8 w-8 text-char/10 dark:text-white/5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {article.category_name && (
          <span className="mb-1.5 inline-block rounded bg-kiln-clay/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-kiln-clay dark:bg-kiln-clay/15">
            {article.category_name}
          </span>
        )}

        <h3 className="line-clamp-2 text-[15px] font-bold leading-6 text-char transition-colors group-hover:text-lajvard dark:text-white/90 dark:group-hover:text-lajvard-soft">
          {article.title}
        </h3>

        {article.excerpt && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-char-soft dark:text-white/40">
            {article.excerpt}
          </p>
        )}

        <div className="mt-2 flex items-center gap-3 text-[10px] text-char-soft/70 dark:text-white/35">
          {article.author_name && (
            <span className="flex items-center gap-1">
              {article.author_avatar_url ? (
                <Image
                  src={mediaUrl(article.author_avatar_url)}
                  alt={article.author_name}
                  width={14}
                  height={14}
                  className="h-3.5 w-3.5 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-lajvard/10 text-[6px] font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft">
                  {article.author_name.charAt(0)}
                </span>
              )}
              {article.author_name}
            </span>
          )}
          {article.published_at && (
            <span className="flex items-center gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              {formatDate(article.published_at)}
            </span>
          )}
          {article.reading_time_minutes != null && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {article.reading_time_minutes} دقیقه
            </span>
          )}
        </div>
      </div>

      <ArrowLeft className="h-4 w-4 shrink-0 self-center text-char/15 transition-all group-hover:-translate-x-1 group-hover:text-lajvard dark:text-white/10 dark:group-hover:text-lajvard-soft" />
    </Link>
  );
}

export function ArticleFeed({ articles }: { articles: FeedArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <div>
      {articles.map((a) => (
        <FeedArticleRow key={a.id} article={a} />
      ))}
    </div>
  );
}
