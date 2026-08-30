export interface CmsPageData {
  title: string;
  slug: string;
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
  is_published: boolean;
}

async function fetchPage(slug: string): Promise<CmsPageData | null> {
  const base = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${base}/pages/${slug}`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    return (await res.json()) as CmsPageData;
  } catch {
    return null;
  }
}

import { sanitizeHtml } from "@/lib/sanitize";

export async function CmsPage({ slug, fallbackTitle, fallbackContent }: { slug: string; fallbackTitle: string; fallbackContent: React.ReactNode }) {
  const page = await fetchPage(slug);
  if (!page || !page.is_published) {
    return (
      <>
        <h1 className="text-3xl font-extrabold md:text-4xl">{fallbackTitle}</h1>
        <div className="prose-fa mt-8 space-y-6 leading-9 text-char-soft dark:text-ink-soft [&_h2]:pt-4 [&_h2]:font-extrabold [&_h2]:text-char dark:[&_h2]:text-ink">{fallbackContent}</div>
        <p className="mt-10 text-xs text-char-soft dark:text-ink-soft">این محتوا توسط مدیریت از طریق پنل CMS قابل ویرایش است.</p>
      </>
    );
  }
  return (
    <>
      <h1 className="text-3xl font-extrabold md:text-4xl">{page.title}</h1>
      <div className="prose-fa mt-8 leading-9 text-char-soft dark:text-ink-soft [&_h2]:font-extrabold [&_h2]:text-char dark:[&_h2]:text-ink" dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }} />
    </>
  );
}
