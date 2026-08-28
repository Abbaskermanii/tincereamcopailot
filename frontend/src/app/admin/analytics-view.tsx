"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { API_URL } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { faNum } from "@/lib/format";

const OrdersChart = dynamic(() => import("../admin-analytics/orders-chart"), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full" />,
});

interface OrderRow {
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export function AnalyticsView() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch(`${API_URL}/admin/stats`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setOrders(data.recent_orders ?? []))
      .catch(() => setError("برای مشاهدهٔ تحلیل‌ها وارد حساب مدیر شوید."));
  }, []);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => !["pending", "cancelled"].includes(o.status));
    const revenue = paid.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const byDay = new Map<string, number>();
    orders.forEach((order) => byDay.set(order.created_at.slice(0, 10), (byDay.get(order.created_at.slice(0, 10)) ?? 0) + 1));
    return { revenue, series: Array.from(byDay.entries()).sort().map(([day, count]) => ({ day, count })) };
  }, [orders]);

  if (error) return <p className="mt-8 rounded-2xl bg-kiln-clay/15 p-5">{error}</p>;
  return (
    <div className="mt-8 space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="درآمد پرداخت‌شده" value={`${faNum(stats.revenue)} ت`} />
        <Stat label="تعداد سفارش‌ها" value={faNum(orders.length)} />
        <Stat label="سفارش‌های موفق" value={faNum(orders.filter((o) => !["pending", "cancelled"].includes(o.status)).length)} />
      </div>
      <section className="rounded-wobble bg-surface p-6 shadow-shelf dark:bg-black/25">
        <h2 className="mb-4 font-bold">سفارش‌ها به تفکیک روز</h2>
        <OrdersChart data={stats.series} />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-wobble bg-surface p-6 shadow-shelf dark:bg-black/25"><p className="text-xs text-ink-soft">{label}</p><p className="mt-2 text-2xl font-extrabold text-lajvard dark:text-lajvard-soft">{value}</p></div>;
}
