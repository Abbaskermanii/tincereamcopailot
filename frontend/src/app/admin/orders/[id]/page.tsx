"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { AdminCard, Field, FormActions, PageHeader, SelectInput, StatusBadge, TextInput } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";
import { faNum, faPrice, toPersianDigits } from "@/lib/format";

interface OrderDetail {
  id: string; order_number: string; status: string;
  customer_name: string; phone: string; email: string | null;
  address: string; city: string; province: string; postal_code: string;
  total_amount: number; shipping_cost: number; discount_amount: number;
  campaign_discount_amount: number; coupon_code: string | null;
  gift_wrap: boolean; gift_note: string | null;
  shipping_method_name: string | null; tracking_code: string | null;
  carrier: string | null; admin_note: string | null;
  payment_authority: string | null; payment_ref_id: string | null;
  created_at: string; updated_at: string;
  items: { product_id: string; variant_name: string | null; product_name: string; unit_price: number; quantity: number; subtotal: number }[];
  history: { from: string; to: string; note: string; at: string }[];
  transactions: { id: string; gateway: string; status: string; ref_id: string; amount: number; message: string; at: string }[];
}

const STATUS_FLOW = ["pending", "paid", "processing", "shipped", "delivered"];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, loading, reload } = useAdminResource<OrderDetail>(`/admin/orders/${id}`);
  const { mutate, busy } = useAdminMutation();

  const [form, setForm] = useState({ status: "", tracking_code: "", carrier: "", admin_note: "" });
  const [showFulfil, setShowFulfil] = useState(false);

  const fulfil = async () => {
    const body: Record<string, string | null> = {};
    if (form.status) body.status = form.status;
    if (form.tracking_code) body.tracking_code = form.tracking_code;
    if (form.carrier) body.carrier = form.carrier;
    if (form.admin_note) body.admin_note = form.admin_note;
    if (Object.keys(body).length === 0) return;
    const ok = await mutate(`/admin/orders/${id}/fulfil`, { method: "PATCH", body: JSON.stringify(body), successMessage: "سفارش به‌روزرسانی شد." });
    if (ok) { setShowFulfil(false); setForm({ status: "", tracking_code: "", carrier: "", admin_note: "" }); void reload(); }
  };

  if (loading) return <div className="py-20 text-center text-ink-soft">در حال بارگذاری…</div>;
  if (!order) return <div className="py-20 text-center text-clay">سفارش یافت نشد.</div>;

  const statusIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-char/5 dark:hover:bg-white/10">
          <ArrowRight className="h-5 w-5" />
        </button>
        <PageHeader title={`سفارش #${order.order_number}`} description={`ثبت‌شده ${toPersianDigits(new Date(order.created_at).toLocaleDateString("fa-IR"))}`} />
      </div>

      {/* Status timeline */}
      <AdminCard title="وضعیت سفارش">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STATUS_FLOW.map((s, i) => {
            const labels: Record<string, string> = { pending: "در انتظار", paid: "پرداخت", processing: "پردازش", shipped: "ارسال", delivered: "تحویل" };
            const reached = i <= statusIndex;
            const current = i === statusIndex;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${current ? "bg-lajvard text-white dark:bg-lajvard-soft dark:text-char" : reached ? "bg-firouzeh/20 text-firouzeh" : "bg-char/10 text-char-soft dark:bg-white/10 dark:text-ink-soft"}`}>
                  {reached ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`whitespace-nowrap text-xs ${current ? "font-bold text-lajvard dark:text-lajvard-soft" : reached ? "text-firouzeh" : "text-ink-soft"}`}>{labels[s]}</span>
                {i < STATUS_FLOW.length - 1 && <div className={`mx-1 h-px w-6 ${i < statusIndex ? "bg-firouzeh" : "bg-char/15 dark:bg-white/15"}`} />}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <StatusBadge status={order.status} />
          <button type="button" onClick={() => setShowFulfil(!showFulfil)} className="min-h-[36px] rounded-lg bg-lajvard px-4 text-sm text-white hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char">به‌روزرسانی وضعیت</button>
        </div>
        {showFulfil && (
          <form onSubmit={(e) => { e.preventDefault(); void fulfil(); }} className="mt-4 grid gap-3 rounded-xl bg-char/5 p-4 dark:bg-white/5 sm:grid-cols-2">
            <Field label="وضعیت جدید">
              <SelectInput value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="">بدون تغییر</option>
                {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
                <option value="cancelled">cancelled</option>
              </SelectInput>
            </Field>
            <Field label="کد رهگیری">
              <TextInput value={form.tracking_code} onChange={(e) => setForm({ ...form, tracking_code: e.target.value })} placeholder="پستی یا پیک" />
            </Field>
            <Field label="شرکت حمل">
              <TextInput value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} />
            </Field>
            <Field label="یادداشت مدیر">
              <TextInput value={form.admin_note} onChange={(e) => setForm({ ...form, admin_note: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <FormActions onCancel={() => setShowFulfil(false)} busy={busy} saveLabel="ذخیره" />
            </div>
          </form>
        )}
      </AdminCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Customer info */}
        <AdminCard title="اطلاعات مشتری">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">نام</dt><dd>{order.customer_name}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">تلفن</dt><dd className="num-latin">{order.phone}</dd></div>
            {order.email && <div className="flex justify-between"><dt className="text-ink-soft">ایمیل</dt><dd className="num-latin">{order.email}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-soft">آدرس</dt><dd className="text-left max-w-[60%]">{order.address}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">شهر</dt><dd>{order.city}، {order.province}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">کد پستی</dt><dd className="num-latin">{order.postal_code}</dd></div>
          </dl>
        </AdminCard>

        {/* Payment info */}
        <AdminCard title="اطلاعات پرداخت">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">مبلغ کل</dt><dd className="font-bold">{faPrice(order.total_amount)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">هزینه ارسال</dt><dd>{faPrice(order.shipping_cost)}</dd></div>
            {order.discount_amount > 0 && <div className="flex justify-between"><dt className="text-ink-soft">تخفیف کد</dt><dd className="text-clay">{faPrice(order.discount_amount)}</dd></div>}
            {order.campaign_discount_amount > 0 && <div className="flex justify-between"><dt className="text-ink-soft">تخفیف کمپین</dt><dd className="text-clay">{faPrice(order.campaign_discount_amount)}</dd></div>}
            {order.coupon_code && <div className="flex justify-between"><dt className="text-ink-soft">کد تخفیف</dt><dd className="num-latin">{order.coupon_code}</dd></div>}
            {order.gift_wrap && <div className="flex justify-between"><dt className="text-ink-soft">بسته هدیه</dt><dd>✓</dd></div>}
            {order.gift_note && <div className="flex justify-between"><dt className="text-ink-soft">یادداشت هدیه</dt><dd className="text-left max-w-[60%]">{order.gift_note}</dd></div>}
            {order.payment_ref_id && <div className="flex justify-between"><dt className="text-ink-soft">کد پرداخت</dt><dd className="num-latin">{order.payment_ref_id}</dd></div>}
          </dl>
        </AdminCard>
      </div>

      {/* Items */}
      <AdminCard title="اقلام سفارش" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-right text-sm">
            <thead>
              <tr className="border-b border-char/10 text-xs text-ink-soft dark:border-white/10">
                <th className="p-3">محصول</th>
                <th className="p-3">وارینت</th>
                <th className="p-3">قیمت واحد</th>
                <th className="p-3">تعداد</th>
                <th className="p-3">جمع</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} className="border-b border-char/5 last:border-0 dark:border-white/5">
                  <td className="p-3 font-medium">{item.product_name}</td>
                  <td className="p-3 text-ink-soft">{item.variant_name ?? "—"}</td>
                  <td className="p-3 num-latin">{faPrice(item.unit_price)}</td>
                  <td className="p-3 num-latin">{faNum(item.quantity)}</td>
                  <td className="p-3 num-latin font-bold">{faPrice(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* Status history */}
      {order.history.length > 0 && (
        <AdminCard title="تاریخچه وضعیت" className="mt-6">
          <ol className="space-y-3">
            {order.history.map((h, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-lajvard dark:bg-lajvard-soft" />
                <div>
                  <span className="font-medium">{h.from ? `${h.from} → ` : ""}{h.to}</span>
                  {h.note && <span className="mr-2 text-ink-soft">— {h.note}</span>}
                  <span className="mr-2 num-latin text-ink-soft">{toPersianDigits(new Date(h.at).toLocaleString("fa-IR"))}</span>
                </div>
              </li>
            ))}
          </ol>
        </AdminCard>
      )}

      {/* Transactions */}
      {order.transactions.length > 0 && (
        <AdminCard title="تراکنش‌ها" className="mt-6">
          <ol className="space-y-2 text-sm">
            {order.transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg bg-char/5 px-3 py-2 dark:bg-white/5">
                <span>{t.gateway} — <StatusBadge status={t.status} /></span>
                <span className="num-latin">{faPrice(t.amount)}</span>
              </li>
            ))}
          </ol>
        </AdminCard>
      )}
    </div>
  );
}
