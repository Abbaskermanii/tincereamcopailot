import Image from "next/image";
import { mediaUrl } from "@/lib/api";
import { Calendar, Clock, Eye } from "lucide-react";

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

interface ArticleMetaProps {
  author_name?: string | null;
  author_avatar_url?: string | null;
  published_at?: string | null;
  reading_time_minutes?: number;
  view_count?: number;
  className?: string;
  size?: "sm" | "md";
}

export function ArticleMeta({
  author_name,
  author_avatar_url,
  published_at,
  reading_time_minutes,
  view_count,
  className = "",
  size = "sm",
}: ArticleMetaProps) {
  const textSize = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <div className={`flex flex-wrap items-center gap-2 text-char-soft dark:text-white/45 ${textSize} ${className}`}>
      {author_name && (
        <span className="flex items-center gap-1.5">
          {author_avatar_url ? (
            <Image
              src={mediaUrl(author_avatar_url)}
              alt={author_name}
              width={size === "sm" ? 16 : 20}
              height={size === "sm" ? 16 : 20}
              className="rounded-full object-cover"
            />
          ) : (
            <span
              className={`flex items-center justify-center rounded-full bg-lajvard/10 font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft ${
                size === "sm" ? "h-4 w-4 text-[7px]" : "h-5 w-5 text-[8px]"
              }`}
            >
              {author_name.charAt(0)}
            </span>
          )}
          <span>{author_name}</span>
        </span>
      )}
      {published_at && (
        <span className="flex items-center gap-0.5">
          <Calendar className="h-3 w-3" />
          {formatDate(published_at)}
        </span>
      )}
      {reading_time_minutes != null && (
        <span className="flex items-center gap-0.5">
          <Clock className="h-3 w-3" />
          {reading_time_minutes} دقیقه مطالعه
        </span>
      )}
      {view_count != null && view_count > 0 && (
        <span className="flex items-center gap-0.5">
          <Eye className="h-3 w-3" />
          {new Intl.NumberFormat("fa-IR").format(view_count)}
        </span>
      )}
    </div>
  );
}
