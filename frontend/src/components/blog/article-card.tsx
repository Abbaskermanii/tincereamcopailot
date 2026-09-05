import Link from "next/link";
import Image from "next/image";
import { mediaUrl } from "@/lib/api";
import { Calendar, Clock } from "lucide-react";

export interface ArticleCardData {
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
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function AuthorAvatar({ name, avatarUrl }: { name: string | null; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return (
      <Image
        src={mediaUrl(avatarUrl)}
        alt={name ?? ""}
        width={20}
        height={20}
        className="h-5 w-5 rounded-full object-cover"
      />
    );
  }
  const initials = name ? name.charAt(0) : "ن";
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lajvard/10 text-[8px] font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft">
      {initials}
    </span>
  );
}

export function ArticleCard({ article }: { article: ArticleCardData }) {
  const img = article.cover_url ? mediaUrl(article.cover_url) : null;

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group glaze-edge flex h-full flex-col overflow-hidden rounded-wobble bg-surface transition-all duration-300 hover:shadow-lifted dark:bg-[#262320]"
    >
      {/* Image — fixed aspect ratio */}
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-slip dark:bg-char">
        {img ? (
          <Image
            src={img}
            alt={article.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-10 w-10 text-char/10 dark:text-white/5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
          </div>
        )}
        {/* Category badge — absolute, no layout impact */}
        {article.category_name && (
          <span className="absolute right-2 top-2 z-10 rounded-md bg-lajvard/85 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm dark:bg-lajvard/90">
            {article.category_name}
          </span>
        )}
      </div>

      {/* Content — flex-col with fixed structure */}
      <div className="flex min-h-0 flex-1 flex-col p-3">
        {/* Title — exactly 2 lines, fixed min-height */}
        <h3 className="mb-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-[1.25] text-char-800 transition-colors group-hover:text-lajvard dark:text-white/90 dark:group-hover:text-lajvard-soft">
          {article.title}
        </h3>

        {/* Excerpt — exactly 2 lines, fixed min-height */}
        <div className="mb-2 h-10">
          {article.excerpt ? (
            <p className="line-clamp-2 text-[11px] leading-5 text-char-soft dark:text-white/45">
              {article.excerpt}
            </p>
          ) : null}
        </div>

        {/* Meta — pinned to bottom */}
        <div className="mt-auto flex items-center gap-2 text-[9px] text-char-soft dark:text-white/40">
          {article.author_name && (
            <span className="flex items-center gap-1">
              <AuthorAvatar name={article.author_name} avatarUrl={article.author_avatar_url} />
              <span className="truncate max-w-[80px]">{article.author_name}</span>
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
    </Link>
  );
}
