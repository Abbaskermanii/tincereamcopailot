import Link from "next/link";
import Image from "next/image";
import { mediaUrl } from "@/lib/api";
import { Calendar, Clock, ArrowLeft } from "lucide-react";

export interface FeaturedArticleData {
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

export function FeaturedArticle({ article }: { article: FeaturedArticleData }) {
  const img = article.cover_url ? mediaUrl(article.cover_url) : null;

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group relative flex min-h-[400px] flex-col justify-end overflow-hidden rounded-2xl bg-char md:min-h-[480px]"
    >
      {img ? (
        <Image
          src={img}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-lajvard/20 to-clay/20" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      <div className="relative p-6 md:p-10">
        {article.category_name && (
          <span className="mb-3 inline-block rounded-md bg-kiln-clay/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {article.category_name}
          </span>
        )}

        <h2 className="mb-3 text-2xl font-extrabold leading-tight text-white md:text-3xl lg:text-4xl">
          {article.title}
        </h2>

        {article.excerpt && (
          <p className="mb-4 max-w-xl text-sm leading-7 text-white/75 line-clamp-2 md:text-base md:leading-8">
            {article.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-white/55">
          {article.author_name && (
            <span className="flex items-center gap-1.5">
              {article.author_avatar_url ? (
                <Image
                  src={mediaUrl(article.author_avatar_url)}
                  alt={article.author_name}
                  width={22}
                  height={22}
                  className="h-[22px] w-[22px] rounded-full object-cover ring-2 ring-white/20"
                />
              ) : (
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white/15 text-[9px] font-bold text-white">
                  {article.author_name.charAt(0)}
                </span>
              )}
              {article.author_name}
            </span>
          )}
          {article.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(article.published_at)}
            </span>
          )}
          {article.reading_time_minutes != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.reading_time_minutes} دقیقه مطالعه
            </span>
          )}
        </div>

        <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-white transition-colors group-hover:text-kiln-clay">
          مطالعه مقاله
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
