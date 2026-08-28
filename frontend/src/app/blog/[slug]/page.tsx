import { notFound } from "next/navigation";
import { api } from "@/lib/api";
export const revalidate = 300;
export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await api.article(params.slug);
  if (!article) notFound();
  return <article className="mx-auto max-w-3xl px-4 py-12 md:px-6"><p className="text-sm text-ink-soft">مجله‌ی تن‌سِرام</p><h1 className="mt-3 text-4xl font-extrabold leading-tight">{article.title}</h1>{article.published_at && <time className="mt-4 block text-sm text-ink-soft">{new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(new Date(article.published_at))}</time>}<div className="mt-10 whitespace-pre-line text-lg leading-9">{article.body}</div></article>;
}
