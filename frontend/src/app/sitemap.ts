import type { MetadataRoute } from "next";
import { api } from "@/lib/api";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, articles] = await Promise.all([api.categories(), api.articles()]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/returns-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/privacy-policy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  function flattenCategories(list: typeof cats): typeof cats {
    if (!list) return [];
    const out: NonNullable<typeof cats> = [];
    function walk(nodes: NonNullable<typeof cats>) {
      for (const n of nodes) {
        out.push(n);
        if (n.children && n.children.length > 0) walk(n.children);
      }
    }
    walk(list);
    return out;
  }

  const flatCats = flattenCategories(cats);
  const categoryPages: MetadataRoute.Sitemap = (flatCats ?? []).map((c) => ({
    url: `${SITE}/category/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // Paginate through all products — previous implementation truncated to 48
  const productPages: MetadataRoute.Sitemap = [];
  let page = 1;
  let totalPages = 1;
  do {
    const chunk = await api.products({ page, page_size: 48 });
    if (!chunk || chunk.items.length === 0) break;
    for (const p of chunk.items) {
      productPages.push({
        url: `${SITE}/product/${p.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    totalPages = chunk.pages;
    page++;
    // safety: avoid infinite loop on malformed pagination
    if (page > 100) break;
  } while (page <= totalPages);

  const articlePages: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${SITE}/blog/${a.slug}`,
    lastModified: a.published_at ? new Date(a.published_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...productPages, ...articlePages];
}
