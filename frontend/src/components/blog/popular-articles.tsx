import Link from "next/link";
import { Clock } from "lucide-react";

interface PopularArticle {
  id: string;
  title: string;
  slug: string;
  published_at?: string | null;
  reading_time_minutes?: number;
}

export function PopularArticles({ articles }: { articles: PopularArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <div>
      <h3 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-char dark:text-white">
        محبوب‌ترین مطالب
      </h3>
      <ol className="space-y-0">
        {articles.map((a, i) => (
          <li key={a.id} className="border-b border-char/5 dark:border-white/5">
            <Link
              href={`/blog/${a.slug}`}
              className="group flex gap-3 py-3.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-char/5 text-sm font-extrabold text-char/20 transition-colors group-hover:bg-lajvard/10 group-hover:text-lajvard dark:bg-white/5 dark:text-white/15 dark:group-hover:bg-lajvard-soft/15 dark:group-hover:text-lajvard-soft">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="line-clamp-2 text-[13px] font-semibold leading-5 text-char transition-colors group-hover:text-lajvard dark:text-white/85 dark:group-hover:text-lajvard-soft">
                  {a.title}
                </h4>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-char-soft/70 dark:text-white/35">
                  {a.reading_time_minutes != null && (
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {a.reading_time_minutes} دقیقه
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
