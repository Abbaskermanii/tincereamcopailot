import { apiGet } from "@/lib/api";

export default async function TrackingPage({ params }: { params: { order_number: string } }) {
  const status = await apiGet<{ order_number: string; status: string; payment_status?: string }>(`/orders/${encodeURIComponent(params.order_number)}/status`, 30);
  return <div className="mx-auto max-w-xl px-4 py-12 md:px-6"><h1 className="text-3xl font-extrabold">پیگیری سفارش</h1><p className="mt-2 text-sm text-ink-soft" dir="ltr">{params.order_number}</p><div className="mt-8 rounded-2xl bg-surface p-6 shadow-shelf dark:bg-white/5">{status ? <><p className="text-lg font-bold">وضعیت: {status.status}</p>{status.payment_status && <p className="mt-2 text-ink-soft">پرداخت: {status.payment_status}</p>}</> : <p className="text-ink-soft">سفارشی با این شماره پیدا نشد.</p>}</div></div>;
}
