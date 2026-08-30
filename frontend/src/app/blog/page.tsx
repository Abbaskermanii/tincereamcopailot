import Link from "next/link";
import { api } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";

export const revalidate = 300;

export default async function BlogPage() {
  const articles = (await api.articles()) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
      <SectionHeading
        title="مقالات"
        subtitle="اخبار، داستان‌ها و راهنمای سفال و سرامیک"
      />

      {articles.length === 0 ? (
        <EmptyState
          title="هنوز مقاله‌ای منتشر نشده"
          description="به‌زودی مقالات جدیدی اضافه می‌کنیم."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/blog/${a.slug}`}
              className="group glaze-edge rounded-wobble bg-surface p-5 shadow-shelf transition-all duration-300 hover:shadow-lifted"
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
      )}
    </div>
  );
}