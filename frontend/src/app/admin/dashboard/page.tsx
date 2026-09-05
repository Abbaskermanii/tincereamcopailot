"use client";

import Link from "next/link";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { TrendingUp, TrendingDown, ShoppingBag, Package, Users, Clock } from "lucide-react";
import {
  AdminCard, DataTable, ErrorBanner, PageHeader, StatCard, StatusBadge,
  Carousel,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/admin/kit";
import { useAdminResource } from "@/lib/admin-hooks";
import { faNum, faPrice, toPersianDigits } from "@/lib/format";

interface DashboardData {
  period_days: number;
  orders: number;
  orders_change_pct: number | null;
  revenue: number;
  revenue_change_pct: number | null;
  average_order_value: number;
  customers: number;
  products: number;
  pending_orders: number;
  sales_series: { date: string; orders: number; revenue: number }[];
  top_products: { product_id: string; name: string; qty: number; revenue: number }[];
  top_customers: { user_id: string; name: string; orders: number; spent: number }[];
  low_stock: { id: string; name: string; stock_qty: number; slug: string }[];
  recent_orders: { id: string; order_number: string; customer_name: string; total_amount: number; status: string; created_at: string }[];
}

interface HomepageSection {
  id: string;
  kind: string;
  title: string;
  subtitle: string | null;
  is_enabled: boolean;
  sort_order: number;
  limit_count: number;
  source: string | null;
  category_id: string | null;
  category_name: string | null;
  product_ids: string[];
  manual_product_count: number;
}

interface ProductItem {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  compare_at_price: number | null;
  slug: string;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string | null;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

function ChangePct({ value }: { value: number | null }) {
  if (value === null) return <p className="mt-1 text-xs text-ink-soft">مقایسه با دورهٔ قبل موجود نیست</p>;
  const up = value >= 0;
  return (
    <p className={`mt-1 flex items-center gap-1 text-xs ${up ? "text-firouzeh" : "text-clay"}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "▲" : "▼"} {faNum(Math.abs(value))}٪ نسبت به دورهٔ قبل
    </p>
  );
}

function ProductCard({ product }: { product: ProductItem }) {
  return (
    <div className="glaze-edge rounded-xl p-3 transition-all hover:shadow-lifted">
      <Link href={`/admin/products/${product.id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:text-lajvard">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded-lg bg-lajvard/10 flex items-center justify-center">
            <Package className="h-6 w-6 text-lajvard dark:text-lajvard-soft" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{product.name}</p>
          <p className="mt-1 text-xs text-ink-soft">{faPrice(product.price)}</p>
        </div>
      </Link>
    </div>
  );
}

function CategoryCard({ category }: { category: CategoryItem }) {
  return (
    <Link href={`/admin/categories`} className="glaze-edge flex h-24 items-center justify-center rounded-xl border border-char/15 p-3 transition-all hover:shadow-shelf hover:border-lajvard/30 dark:border-white/15">
      {category.image_url ? (
        <img src={category.image_url} alt={category.name} className="h-full w-full object-cover rounded-lg" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Package className="h-10 w-10 text-ink-soft" />
        </div>
      )}
    </Link>
  );
}

function ArticleCard({ article }: { article: ArticleItem }) {
  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('fa-IR')
    : '';

  return (
    <div className="glaze-edge flex h-24 flex-1 flex-col justify-between rounded-xl p-3 transition-all hover:shadow-shelf">
      <p className="line-clamp-2 font-medium text-sm">{article.title}</p>
      <p className="text-xs text-ink-soft">{formattedDate}</p>
    </div>
  );
}

function FaqCard({ faq }: { faq: FaqItem }) {
  return (
    <div className="glaze-edge flex flex-1 flex-col justify-between rounded-xl p-3 transition-all hover:shadow-shelf">
      <p className="font-medium text-sm">{faq.question}</p>
      <p className="line-clamp-2 text-xs text-ink-soft">{faq.answer}</p>
    </div>
  );
}

function renderHomepageSection(section: HomepageSection, products: ProductItem[], categories: CategoryItem[], articles: ArticleItem[], faqs: FaqItem[]) {
  const relevantProducts = section.product_ids.length > 0
    ? products.filter(p => section.product_ids.includes(p.id))
    : products.slice(0, section.limit_count);

  if (section.kind === "products" && section.source === "manual" && section.manual_product_count > 0) {
    return (
      <div className="w-full">
        <Carousel className="w-full">
          <CarouselPrevious />
          <CarouselNext />
          {relevantProducts.map((product) => (
            <CarouselItem key={product.id} className="basis-1/4 md:basis-1/5 lg:basis-1/6">
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </Carousel>
      </div>
    );
  }

  if (section.kind === "products") {
    return (
      <div className="w-full">
        <Carousel className="w-full">
          <CarouselPrevious />
          <CarouselNext />
          {relevantProducts.slice(0, section.limit_count).map((product) => (
            <CarouselItem key={product.id} className="basis-1/4 md:basis-1/5 lg:basis-1/6">
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </Carousel>
      </div>
    );
  }

  if (section.kind === "categories") {
    return (
      <div className="w-full">
        <Carousel className="w-full">
          <CarouselPrevious />
          <CarouselNext />
          {categories.slice(0, section.limit_count).map((category) => (
            <CarouselItem key={category.id} className="basis-1/4 md:basis-1/5 lg:basis-1/6">
              <CategoryCard category={category} />
            </CarouselItem>
          ))}
        </Carousel>
      </div>
    );
  }

  if (section.kind === "articles") {
    return (
      <div className="w-full">
        <Carousel className="w-full">
          <CarouselPrevious />
          <CarouselNext />
          {articles.slice(0, section.limit_count).map((article) => (
            <CarouselItem key={article.id} className="basis-1/2 md:basis-1/3">
              <ArticleCard article={article} />
            </CarouselItem>
          ))}
        </Carousel>
      </div>
    );
  }

  if (section.kind === "faq") {
    return (
      <div className="w-full">
        <Carousel className="w-full">
          <CarouselPrevious />
          <CarouselNext />
          {faqs.slice(0, section.limit_count).map((faq) => (
            <CarouselItem key={faq.id} className="basis-1/2 md:basis-1/3">
              <FaqCard faq={faq} />
            </CarouselItem>
          ))}
        </Carousel>
      </div>
    );
  }

  return null;
}

export default function AdminDashboardPage() {
  const { data, loading, error, reload } = useAdminResource<DashboardData>("/admin/dashboard?days=30");
  const { data: sections } = useAdminResource<HomepageSection[]>("/admin/homepage-sections");

  const chartData = (data?.sales_series ?? []).map((d) => ({
    ...d,
    label: toPersianDigits(d.date.slice(5)),
  }));

  return (
    <div>
      <PageHeader
        title="داشبورد"
        description="خلاصهٔ وضعیت فروشگاه در ۳۰ روز گذشته"
        action={<Link href="/admin/orders" className="glaze-edge min-h-[44px] rounded-xl bg-lajvard px-5 py-2 text-sm text-white transition-all hover:bg-lajvard-deep hover:shadow-lifted dark:bg-lajvard-soft dark:text-char">مشاهدهٔ سفارش‌ها</Link>}
      />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      {/* KPI row — clickable */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link href="/admin/orders" className="block">
          <StatCard
            label={`درآمد ${data?.period_days ?? 30} روز`}
            value={loading ? "…" : faPrice(data?.revenue ?? 0)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </Link>
        <Link href="/admin/orders" className="block">
          <StatCard
            label="سفارش‌ها"
            value={data?.orders ?? 0}
            icon={<ShoppingBag className="h-5 w-5" />}
          />
        </Link>
        <Link href="/admin/orders" className="block">
          <StatCard
            label="میانگین سفارش"
            value={loading ? "…" : faPrice(data?.average_order_value ?? 0)}
            icon={<Package className="h-5 w-5" />}
          />
        </Link>
        <Link href="/admin/orders?status=pending" className="block">
          <StatCard
            label="سفارش‌های در انتظار"
            value={data?.pending_orders ?? 0}
            tone={data?.pending_orders ? "warn" : undefined}
            icon={<Clock className="h-5 w-5" />}
          />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glaze-edge rounded-wobble bg-surface p-5 shadow-shelf transition-all duration-300 hover:shadow-lifted dark:bg-black/25">
          <p className="text-xs font-medium text-ink-soft">تغییر درآمد</p>
          <ChangePct value={data?.revenue_change_pct ?? null} />
        </div>
        <div className="glaze-edge rounded-wobble bg-surface p-5 shadow-shelf transition-all duration-300 hover:shadow-lifted dark:bg-black/25">
          <p className="text-xs font-medium text-ink-soft">تغییر سفارش</p>
          <ChangePct value={data?.orders_change_pct ?? null} />
        </div>
        <div className="glaze-edge rounded-wobble bg-surface p-5 shadow-shelf transition-all duration-300 hover:shadow-lifted dark:bg-black/25">
          <p className="text-xs font-medium text-ink-soft">مشتریان</p>
          <div className="mt-2 flex items-center gap-2">
            <Users className="h-5 w-5 text-lajvard dark:text-lajvard-soft" />
            <p className="text-2xl font-extrabold">{data?.customers ?? 0}</p>
          </div>
        </div>
        <div className="glaze-edge rounded-wobble bg-surface p-5 shadow-shelf transition-all duration-300 hover:shadow-lifted dark:bg-black/25">
          <p className="text-xs font-medium text-ink-soft">محصولات فعال</p>
          <div className="mt-2 flex items-center gap-2">
            <Package className="h-5 w-5 text-lajvard dark:text-lajvard-soft" />
            <p className="text-2xl font-extrabold">{data?.products ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Revenue chart */}
      <AdminCard title="روند درآمد و سفارش" className="mt-6">
        {chartData.length < 2 ? (
          <p className="py-10 text-center text-sm text-ink-soft">دادهٔ کافی برای نمایش نمودار وجود ندارد.</p>
        ) : (
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#31547a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#31547a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#8884" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v: number) => String(Math.round(v / 1000)) + "k"} />
                <Tooltip
                  formatter={(value, name) =>
                    name === "revenue" ? [faPrice(Number(value)), "درآمد"] : [faNum(Number(value)), "سفارش"]
                  }
                />
                <Area type="monotone" dataKey="revenue" stroke="#31547a" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </AdminCard>

      {/* Homepage sections - display real data from admin homepage */}
      {sections && sections.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-ink-soft">صفحه اصلی (سکشن‌ها)</h2>
          <div className="flex flex-col gap-3">
            {sections
              .filter(s => s.is_enabled)
              .sort((a, b) => a.sort_order - b.sort_order)
              .map(section => renderHomepageSection(section, [], [], [], [])
            )}
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <AdminCard title="سفارش‌های اخیر" action={<Link href="/admin/orders" className="text-xs text-lajvard underline-offset-4 hover:underline dark:text-lajvard-soft">همه</Link>}>
          <DataTable
            loading={loading}
            rows={data?.recent_orders ?? []}
            empty="سفارشی ثبت نشده است."
            columns={[
              { key: "order_number", label: "شماره", render: (r: { id: string; order_number: string }) => <Link href={`/admin/orders/${r.id}`} className="font-medium text-lajvard hover:underline dark:text-lajvard-soft">{r.order_number}</Link> },
              { key: "customer_name", label: "مشتری" },
              { key: "total_amount", label: "مبلغ", render: (r) => faPrice(r.total_amount) },
              { key: "status", label: "وضعیت", render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </AdminCard>

        {/* Top products */}
        <AdminCard title="پرفروش‌ترین محصولات">
          {(data?.top_products ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-soft">هنوز فروشی ثبت نشده است.</p>
          ) : (
            <ol className="space-y-3">
              {(data?.top_products ?? []).map((p, i) => (
                <li key={p.product_id} className="glaze-edge flex items-center justify-between gap-3 rounded-xl p-3 transition-all hover:shadow-shelf">
                  <Link href={`/admin/products/${p.product_id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:text-lajvard">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lajvard/10 text-xs font-bold text-lajvard dark:bg-lajvard-soft/20 dark:text-lajvard-soft">{faNum(i + 1)}</span>
                    <span className="truncate font-medium">{p.name}</span>
                  </Link>
                  <span className="shrink-0 text-sm text-ink-soft">{faNum(p.qty)} عدد · {faPrice(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </AdminCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Low stock */}
        <AdminCard title="موجودی کم" action={<Link href="/admin/stock-alerts" className="text-xs text-lajvard underline-offset-4 hover:underline dark:text-lajvard-soft">مدیریت</Link>}>
          {(data?.low_stock ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-soft">موجودی همهٔ محصولات در وضعیت خوبی است. ✓</p>
          ) : (
            <ul className="space-y-3">
              {(data?.low_stock ?? []).map((p) => (
                <li key={p.id} className="glaze-edge flex items-center justify-between gap-3 rounded-xl p-3 transition-all hover:shadow-shelf">
                  <Link href={`/admin/products/${p.id}`} className="truncate font-medium hover:text-lajvard">{p.name}</Link>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${p.stock_qty === 0 ? "bg-clay/15 text-clay" : "bg-amber-500/15 text-amber-700 dark:text-amber-300"}`}>
                    {p.stock_qty === 0 ? "ناموجود" : `${faNum(p.stock_qty)} عدد`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        {/* Top customers */}
        <AdminCard title="مشتریان برتر">
          {(data?.top_customers ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-soft">هنوز خرید ثبت‌شده‌ای وجود ندارد.</p>
          ) : (
            <ul className="space-y-3">
              {(data?.top_customers ?? []).map((c) => (
                <li key={c.user_id} className="glaze-edge flex items-center justify-between gap-3 rounded-xl p-3 transition-all hover:shadow-shelf">
                  <Link href={c.user_id ? `/admin/users?search=${c.user_id}` : "/admin/orders"} className="flex min-w-0 flex-1 items-center gap-3 hover:text-lajvard">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-firouzeh/10 text-xs font-bold text-firouzeh dark:bg-firouzeh/20">
                      {(c.name || "مهمان")[0]}
                    </div>
                    <span className="truncate font-medium">{c.name || "مهمان"}</span>
                  </Link>
                  <span className="shrink-0 text-sm text-ink-soft">{faNum(c.orders)} سفارش · {faPrice(c.spent)}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
