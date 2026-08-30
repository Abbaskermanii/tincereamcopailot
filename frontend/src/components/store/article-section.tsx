import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | undefined;
  published_at: string | undefined;
};

type ArticleSectionProps = {
  title: string;
  articles: Article[];
  limit?: number;
};

export function ArticleSection({ title, articles, limit = 6 }: ArticleSectionProps) {
  const items = articles.slice(0, limit);

  if (items.length === 0) return null;

  return (
    <section className="py-14" aria-labelledby="article-section">
      <SectionHeading title={title} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((a) => (
          <Link
            key={a.slug}
            href={`/blog/${a.slug}`}
            className="group glaze-edge flex flex-col h-full rounded-wobble bg-surface p-5 shadow-shelf transition-all duration-300 hover:shadow-lifted"
          >
            <h3 className="font-bold transition-colors group-hover:text-lajvard dark:group-hover:text-lajvard-soft">
              {a.title}
            </h3>
            {a.excerpt && (
              <p className="mt-2 line-clamp-2 text-sm leading-7 text-char-soft dark:text-ink-soft">
                {a.excerpt}
              </p>
            )}
            {a.published_at && (
              <p className="mt-3 text-xs text-char-soft dark:text-ink-soft">
                {new Date(a.published_at).toLocaleDateString("fa-IR")}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}