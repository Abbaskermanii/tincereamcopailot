import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/store/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = { title: "فروشگاه", description: "همه محصولات دست‌ساز تن‌سِرام" };
export const revalidate = 90;

export default async function ShopPage({ searchParams }: { searchParams: { page?: string; sort?: string; category?: string; min_price?: string; max_price?: string; in_stock_only?: string } }) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const sort = searchParams.sort ?? "newest";
  const categories = await api.categories();
  const data = await api.products({
    page, page_size: 16, sort, category: searchParams.category,
    min_price: searchParams.min_price, max_price: searchParams.max_price,
    in_stock_only: searchParams.in_stock_only === "true",
  });
  const query = new URLSearchParams();
  if (searchParams.category) query.set("category", searchParams.category);
  if (searchParams.min_price) query.set("min_price", searchParams.min_price);
  if (searchParams.max_price) query.set("max_price", searchParams.max_price);
  if (searchParams.in_stock_only) query.set("in_stock_only", searchParams.in_stock_only);
  const href = (nextSort: string) => {
    const params = new URLSearchParams(query);
    params.set("sort", nextSort);
    return `/shop?${params.toString()}`;
  };
  return <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm text-ink-soft">قفسه‌ی آنلاین کارگاه</p><h1 className="mt-2 text-4xl font-extrabold">فروشگاه</h1></div>
      <nav aria-label="مرتب‌سازی" className="flex gap-2 text-sm">
        {["newest", "price_asc", "price_desc"].map((item) => <Link key={item} href={href(item)} className={`rounded-full px-4 py-2 ${sort === item ? "bg-lajvard text-white" : "bg-char/8 dark:bg-white/10"}`}>{item === "newest" ? "جدیدترین" : item === "price_asc" ? "ارزان‌ترین" : "گران‌ترین"}</Link>)}
      </nav>
    </div>
    <form className="mb-8 grid gap-3 rounded-wobble bg-surface p-4 shadow-shelf sm:grid-cols-2 lg:grid-cols-5" aria-label="فیلتر محصولات">
      <select name="category" defaultValue={searchParams.category ?? ""} className="rounded-xl border border-char/15 bg-transparent px-3 py-2 text-sm dark:border-white/15">
        <option value="">همه دسته‌ها</option>
        {(categories ?? []).flatMap((c) => [c, ...(c.children ?? [])]).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
      </select>
      <input name="min_price" type="number" min="0" defaultValue={searchParams.min_price} placeholder="حداقل قیمت" className="rounded-xl border border-char/15 bg-transparent px-3 py-2 text-sm dark:border-white/15" />
      <input name="max_price" type="number" min="0" defaultValue={searchParams.max_price} placeholder="حداکثر قیمت" className="rounded-xl border border-char/15 bg-transparent px-3 py-2 text-sm dark:border-white/15" />
      <label className="flex items-center gap-2 px-2 text-sm"><input type="checkbox" name="in_stock_only" value="true" defaultChecked={searchParams.in_stock_only === "true"} /> فقط موجودها</label>
      <button className="glaze-edge bg-lajvard px-4 py-2 text-sm font-medium text-white" type="submit">اعمال فیلتر</button>
    </form>
    {!data || !data.items.length ? <EmptyState title="محصولی پیدا نشد" description="به‌زودی قطعه‌های تازه‌ای از کوره اضافه می‌کنیم." /> : <>
      <SectionHeading title={`${new Intl.NumberFormat("fa-IR").format(data.total)} محصول`} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{data.items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      {data.pages > 1 && <nav aria-label="صفحه‌بندی" className="mt-10 flex justify-center gap-2">{Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => <Link key={n} href={`/shop?page=${n}&sort=${searchParams.sort ?? "newest"}`} className={`flex h-11 w-11 items-center justify-center rounded-xl ${n === page ? "bg-lajvard text-white" : "bg-char/8 dark:bg-white/10"}`}>{new Intl.NumberFormat("fa-IR").format(n)}</Link>)}</nav>}
    </>}
  </div>;
}
