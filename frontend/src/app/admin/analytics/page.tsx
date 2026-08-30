"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminCard, PageHeader, StatCard } from "@/components/admin/kit";
import { useAdminResource } from "@/lib/admin-hooks";
import { faNum, faPrice, toPersianDigits } from "@/lib/format";

interface DashboardData {
  period_days: number;
  orders: number;
  revenue: number;
  average_order_value: number;
  customers: number;
  status_counts: Record<string, number>;
  sales_series: { date: string; orders: number; revenue: number }[];
  top_products: { product_id: string; name: string; qty: number; revenue: number }[];
  top_customers: { user_id: string; name: string; orders: number; spent: number }[];
}

const PERIODS = [
  { days: 7, label: "۷ روز" },
  { days: 30, label: "۳۰ روز" },
  { days: 90, label: "۹۰ روز" },
  { days: 365, label: "۱ سال" },
];

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار",
  paid: "پرداخت‌شده",
  processing: "پردازش",
  shipped: "ارسال",
  delivered: "تحویل",
  cancelled: "لغو",
};

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, loading } = useAdminResource<DashboardData>(`/admin/dashboard?days=${days}`, [days]);

  const series = (data?.sales_series ?? []).map((d) => ({ ...d, label: toPersianDigits(d.date.slice(5)) }));

  return (
    <div>
      <PageHeader
        title="تحلیل‌ها"
        description="عملکرد فروشگاه در بازه‌های زمانی مختلف"
        action={
          <div className="flex gap-1 rounded-xl bg-char/5 p-1 dark:bg-white/10">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => setDays(p.days)}
                className={`min-h-[36px] rounded-lg px-3 text-sm ${days === p.days ? "bg-lajvard text-white dark:bg-lajvard-soft dark:text-char" : "text-ink-soft"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="درآمد" value={loading ? "…" : faPrice(data?.revenue ?? 0)} />
        <StatCard label="سفارش‌ها" value={data?.orders ?? 0} />
        <StatCard label="میانگین سفارش" value={loading ? "…" : faPrice(data?.average_order_value ?? 0)} />
        <StatCard label="مشتریان" value={data?.customers ?? 0} />
      </div>

      <AdminCard title="درآمد روزانه" className="mt-6">
        {series.length < 2 ? (
          <p className="py-10 text-center text-sm text-ink-soft">دادهٔ کافی برای نمایش نمودار وجود ندارد.</p>
        ) : (
          <div className="h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="anl-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7a9e93" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#7a9e93" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#8884" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v: number) => String(Math.round(v / 1000)) + "k"} />
                <Tooltip formatter={(v) => faPrice(Number(v))} />
                <Area type="monotone" dataKey="revenue" stroke="#7a9e93" fill="url(#anl-rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </AdminCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AdminCard title="سفارش‌ها به تفکیک روز">
          {series.length < 2 ? (
            <p className="py-10 text-center text-sm text-ink-soft">دادهٔ کافی موجود نیست.</p>
          ) : (
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#8884" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={40} allowDecimals={false} />
                  <Tooltip formatter={(v) => faNum(Number(v))} />
                  <Bar dataKey="orders" fill="#31547a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </AdminCard>

        <AdminCard title="توزیع وضعیت سفارش‌ها">
          {loading ? (
            <p className="py-10 text-center text-sm text-ink-soft">…</p>
          ) : (
            <ul className="space-y-3">
              {Object.entries(data?.status_counts ?? {}).map(([status, count]) => {
                const max = Math.max(...Object.values(data?.status_counts ?? { x: 1 }));
                return (
                  <li key={status} className="text-sm">
                    <div className="mb-1 flex justify-between">
                      <span>{STATUS_LABELS[status] ?? status}</span>
                      <span className="text-ink-soft">{faNum(count)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-char/10 dark:bg-white/10">
                      <div className="h-full rounded-full bg-lajvard dark:bg-lajvard-soft" style={{ width: `${max ? (count / max) * 100 : 0}%` }} />
                    </div>
                  </li>
                );
              })}
              {!Object.keys(data?.status_counts ?? {}).length && (
                <p className="py-10 text-center text-sm text-ink-soft">سفارشی ثبت نشده است.</p>
              )}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
