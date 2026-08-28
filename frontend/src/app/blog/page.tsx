import Link from "next/link";
import { api } from "@/lib/api";
export const revalidate = 300;
export default async function BlogPage() {
  const articles = (await api.articles()) ?? [];
  return <div className="mx-auto max-w-5xl px-4 py-12 md:px-6"><p className="text-sm text-ink-soft">یادداشت‌های کارگاه</p><h1 className="mt-2 text-4xl font-extrabold">مجله‌ی تن‌سِرام</h1><div className="mt-10 grid gap-5 md:grid-cols-2">{articles.map((a) => <Link key={a.id} href={`/blog/${a.slug}`} className="glaze-edge rounded-wobble bg-surface p-6 shadow-shelf transition-shadow hover:shadow-lifted dark:bg-white/5"><h2 className="text-xl font-bold">{a.title}</h2>{a.excerpt && <p className="mt-3 leading-8 text-ink-soft">{a.excerpt}</p>}<span className="mt-5 inline-block text-sm text-lajvard dark:text-firouzeh">خواندن مقاله ←</span></Link>)}</div>{!articles.length && <p className="mt-10 rounded-2xl bg-surface p-8 text-center text-ink-soft">هنوز مقاله‌ای منتشر نشده است.</p>}</div>;
}
