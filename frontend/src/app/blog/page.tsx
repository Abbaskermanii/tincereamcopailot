import Link from "next/link";
import Image from "next/image";
import { api, mediaUrl } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { Calendar, Clock, Eye } from "lucide-react";

export const revalidate = 120;

interface SearchParams {
  category?: string;
  tag?: string;
  page?: string;
}

export default async function BlogPage({ searchParams }: { searchParams: SearchParams }) {
  const category = searchParams.category || undefined;
  const tag = searchParams.tag || undefined;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  const [articles, categories, tags] = await Promise.all([
    api.articles({ category, tag, offset, limit: pageSize }),
    api.articleCategories().catch(() => []),
    api.articleTags().catch(() => []),
  ]);

  const list = articles ?? [];
  const featured = list.find((a) => a.is_featured) ?? (list.length > 0 ? list[0] : null);
  const grid = featured ? list.filter((a) => a.slug !== featured.slug) : list;

  const hasFilters = Boolean(category || tag);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHeading title="مجله تن‌سِرام" subtitle="داستان‌ها، راهنمای سفال، پشت‌صحنه کارگاه و ایده‌های چیدمان" />

      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Link
          href="/blog"
          className={`rounded-full px-4 py-1.5 text-sm ${!category && !tag ? "bg-lajvard text-white" : "bg-char/5 hover:bg-char/10 dark:bg-white/10"}`}
        >
          همه
        </Link>
        {(categories ?? []).slice(0, 8).map((c) => (
          <Link
            key={c.slug}
            href={`/blog?category=${encodeURIComponent(c.slug)}`}
            className={`rounded-full px-4 py-1.5 text-sm ${category === c.slug ? "bg-lajvard text-white" : "bg-char/5 hover:bg-char/10 dark:bg-white/10"}`}
          >
            {c.name}
          </Link>
        ))}
        {(tags ?? []).slice(0, 8).map((t) => (
          <Link
            key={t.slug}
            href={`/blog?tag=${encodeURIComponent(t.slug)}`}
            className={`rounded-full border px-3 py-1 text-xs ${tag === t.slug ? "border-lajvard bg-lajvard/10 text-lajvard" : "border-char/15 bg-surface dark:border-white/15"}`}
          >
            #{t.name}
          </Link>
        ))}
        {hasFilters && (
          <Link href="/blog" className="mr-auto text-xs text-clay underline">
            پاک کردن فیلتر
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState title="مقاله‌ای یافت نشد" description={hasFilters ? "فیلتر انتخابی نتیجه‌ای نداشت." : "به‌زودی مقالات جدیدی اضافه می‌کنیم."} />
      ) : (
        <>
          {/* Featured */}
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group relative mb-10 flex flex-col overflow-hidden rounded-wobble bg-surface shadow-lifted md:flex-row"
            >
              <div className="relative h-64 w-full shrink-0 overflow-hidden md:h-auto md:w-[55%]">
                {featured.cover_url || featured.cover_image_url ? (
                  <Image
                    src={mediaUrl(featured.cover_url ?? featured.cover_image_url)}
                    alt={featured.title}
                    fill
                    sizes="(max-width:768px) 100vw, 55vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slip text-char-soft">بدون تصویر</div>
                )}
                <span className="absolute right-4 top-4 rounded-full bg-kiln-clay px-3 py-1 text-xs font-bold text-white">ویژه</span>
              </div>
              <div className="flex flex-1 flex-col p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                  {featured.category_name && <span className="rounded-full bg-char/5 px-2.5 py-1 dark:bg-white/10">{featured.category_name}</span>}
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{featured.published_at ? new Date(featured.published_at).toLocaleDateString("fa-IR") : ""}</span>
                  {featured.reading_time_minutes ? <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{featured.reading_time_minutes} دقیقه</span> : null}
                </div>
                <h2 className="mt-3 text-2xl font-extrabold leading-snug group-hover:text-lajvard dark:group-hover:text-lajvard-soft">{featured.title}</h2>
                {featured.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-7 text-char-soft dark:text-ink-soft">{featured.excerpt}</p>}
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-lajvard/10 text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft">
                    {featured.author_avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl(featured.author_avatar_url)} alt={featured.author_name ?? ""} className="h-full w-full object-cover" />
                    ) : (
                      (featured.author_name || "?")[0]?.toUpperCase()
                    )}
                  </span>
                  <span className="font-medium">{featured.author_name ?? "تیم تن‌سِرام"}</span>
                  {featured.view_count !== undefined && <span className="mr-auto inline-flex items-center gap-1 text-ink-soft"><Eye className="h-3 w-3" />{new Intl.NumberFormat("fa-IR").format(featured.view_count)}</span>}
                </div>
              </div>
            </Link>
          )}

          {/* Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((a) => (
              <Link
                key={a.slug}
                href={`/blog/${a.slug}`}
                className="group glaze-edge flex h-full flex-col overflow-hidden rounded-wobble bg-surface shadow-shelf transition-all hover:shadow-lifted"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slip">
                  {a.cover_url || a.cover_image_url ? (
                    <Image
                      src={mediaUrl(a.cover_url ?? a.cover_image_url)}
                      alt={a.title}
                      fill
                      sizes="(max-width:768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-char-soft">بدون تصویر</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-soft">
                    {a.category_name && <span className="rounded-full bg-char/5 px-2 py-0.5 dark:bg-white/10">{a.category_name}</span>}
                    {a.published_at && <span>{new Date(a.published_at).toLocaleDateString("fa-IR")}</span>}
                    {a.reading_time_minutes ? <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{a.reading_time_minutes}′</span> : null}
                  </div>
                  <h3 className="mt-2 line-clamp-2 font-bold leading-6 group-hover:text-lajvard dark:group-hover:text-lajvard-soft">{a.title}</h3>
                  {a.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-char-soft dark:text-ink-soft">{a.excerpt}</p>}
                  <div className="mt-3 flex items-center gap-2 border-t border-char/10 pt-3 dark:border-white/10">
                    <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-lajvard/10 text-xs font-bold text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft">
                      {a.author_avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(a.author_avatar_url)} alt={a.author_name ?? ""} className="h-full w-full object-cover" />
                      ) : (
                        (a.author_name || "؟")[0]?.toUpperCase()
                      )}
                    </span>
                    <span className="text-xs font-medium">{a.author_name ?? "تیم تن‌سِرام"}</span>
                    <span className="mr-auto text-xs text-ink-soft inline-flex items-center gap-1"><Eye className="h-3 w-3" />{a.view_count ?? 0}</span>
                  </div>
                  {a.tags && a.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {a.tags.slice(0, 3).map((t) => (
                        <span key={t.slug} className="rounded-full border border-char/10 px-2 py-0.5 text-[11px] text-ink-soft dark:border-white/10">{t.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-10 flex items-center justify-center gap-2">
            {page > 1 && (
              <Link href={`/blog?${new URLSearchParams({ ...(category ? { category } : {}), ...(tag ? { tag } : {}), page: String(page - 1) }).toString()}`} className="rounded-xl border border-char/15 px-4 py-2 text-sm hover:bg-char/5 dark:border-white/15">
                قبلی
              </Link>
            )}
            <span className="text-sm text-ink-soft">صفحه {page}</span>
            {grid.length >= pageSize && (
              <Link href={`/blog?${new URLSearchParams({ ...(category ? { category } : {}), ...(tag ? { tag } : {}), page: String(page + 1) }).toString()}`} className="rounded-xl bg-lajvard px-4 py-2 text-sm text-white dark:bg-lajvard-soft dark:text-char">
                بعدی
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
