import { apiGet } from "@/lib/api";
import { toPersianDigits, faNum, faPrice } from "@/lib/format";
import { Check, Receipt, Package, Truck, BadgeCheck, Home, Clock, XCircle } from "lucide-react";

const STEPS = [
  { key: "pending", label: "در انتظار پرداخت", icon: Clock },
  { key: "paid", label: "پرداخت شد", icon: BadgeCheck },
  { key: "processing", label: "در حال آماده‌سازی", icon: Package },
  { key: "shipped", label: "ارسال شد", icon: Truck },
  { key: "delivered", label: "تحویل شد", icon: Home },
];

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  pending: { title: "سفارش شما ثبت شده", body: "سفارش شما با موفقیت ثبت شد و منتظر پرداخت است." },
  paid: { title: "پرداخت شما ثبت شد", body: "پرداخت سفارش شما با موفقیت انجام شد. همکاران ما در اسرع وقت سفارش شما را ارسال خواهند کرد." },
  processing: { title: "سفارش شما در حال آماده‌سازی است", body: "تیم ما مشغول آماده‌سازی سفارش شماست." },
  shipped: { title: "سفارش شما ارسال شد", body: "سفارش شما در مسیر ارسال است. با کد رهگیری زیر وضعیت مرسوله را پیگیری کنید." },
  delivered: { title: "سفارش شما تحویل شد", body: "سفارش شما با موفقیت تحویل داده شد. ممنون از اعتماد شما." },
  cancelled: { title: "سفارش لغو شده", body: "این سفارش لغو شده است. اگر وجهی کسر شده باشد تا ۷۲ ساعت بازمی‌گردد." },
};

interface OrderStatusData {
  order_number: string;
  status: string;
  total_amount: number;
  shipping_cost: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  campaign_discount_amount: number;
  tracking_code: string | null;
  carrier: string | null;
  shipping_method_name: string | null;
  admin_note: string | null;
  items: { product_name_snapshot: string; variant_name_snapshot: string | null; unit_price_snapshot: number; quantity: number }[];
}

export default async function TrackingPage({ params }: { params: { order_number: string } }) {
  let data: OrderStatusData | null = null;
  let error = "";
  try {
    data = await apiGet<OrderStatusData>(`/orders/${encodeURIComponent(params.order_number)}/status`, 30);
  } catch {
    error = "سفارشی با این شماره پیدا نشد.";
  }

  const status = data?.status ?? null;
  const cancelled = status === "cancelled";
  const activeIndex = status ? STEPS.findIndex((s) => s.key === status) : -1;
  const msg = status ? STATUS_MESSAGES[status] : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-lajvard/10 dark:bg-lajvard-soft/10">
          <Receipt className="h-8 w-8 text-lajvard dark:text-lajvard-soft" />
        </div>
        <h1 className="font-display text-char dark:text-white">پیگیری سفارش</h1>
        <p className="mt-2 num-latin text-char-soft dark:text-ink-soft" dir="ltr">{params.order_number}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-clay/20 bg-clay/5 p-6 text-center dark:border-clay-soft/20 dark:bg-clay-soft/5">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-clay/10 dark:bg-clay-soft/10">
            <XCircle className="h-6 w-6 text-clay dark:text-clay-soft" />
          </div>
          <p className="font-bold text-clay dark:text-clay-soft">{error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6 animate-fade-in">
          {/* Status message */}
          {msg && (
            <div className={"rounded-2xl border p-6 " + (cancelled ? "border-clay/20 bg-clay/5 dark:border-clay-soft/20 dark:bg-clay-soft/5" : "border-firouzeh/20 bg-firouzeh/5 dark:border-firouzeh-soft/20 dark:bg-firouzeh-soft/5")}>
              <h2 className={"text-lg font-extrabold " + (cancelled ? "text-clay dark:text-clay-soft" : "text-firouzeh dark:text-firouzeh-soft")}>{msg.title}</h2>
              <p className="mt-2 text-sm leading-7 text-char-soft dark:text-ink-soft">{msg.body}</p>
              {data.tracking_code && (
                <div className="mt-4 rounded-xl border border-firouzeh/30 bg-white/50 p-4 dark:bg-white/5">
                  <p className="text-xs text-char-soft dark:text-ink-soft">کد رهگیری مرسوله</p>
                  <p className="mt-1 num-latin text-xl font-extrabold tracking-wider text-char dark:text-white" dir="ltr">{data.tracking_code}</p>
                  {data.carrier && <p className="mt-1 text-sm text-char-soft dark:text-ink-soft">شرکت حمل: <span className="font-bold">{data.carrier}</span></p>}
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          {!cancelled && (
            <div className="rounded-2xl border border-char/10 bg-surface p-6 shadow-shelf dark:border-white/10 dark:bg-[#262320]">
              <ol className="relative space-y-1">
                {STEPS.map((step, i) => {
                  const done = i <= activeIndex;
                  const isCurrent = i === activeIndex;
                  const isLast = i === STEPS.length - 1;
                  const Icon = step.icon;
                  return (
                    <li key={step.key} className="relative flex items-start gap-4 pb-6 last:pb-0">
                      {!isLast && <div className={"absolute right-[15px] top-9 h-full w-0.5 " + (done && !isCurrent ? "bg-firouzeh dark:bg-firouzeh-soft" : "bg-char/10 dark:bg-white/10")} />}
                      <span aria-hidden className={"relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm " + (done ? isCurrent ? "border-lajvard bg-lajvard text-white dark:border-lajvard-soft dark:bg-lajvard-soft dark:text-char" : "border-firouzeh bg-firouzeh text-white dark:border-firouzeh-soft dark:bg-firouzeh-soft dark:text-char" : "border-char/15 bg-surface text-char-soft dark:border-white/15 dark:bg-[#262320] dark:text-ink-soft")}>
                        {done && !isCurrent ? <Check size={14} /> : <Icon size={14} />}
                      </span>
                      <div className="pt-0.5">
                        <p className={"text-sm font-bold " + (isCurrent ? "text-lajvard dark:text-lajvard-soft" : done ? "text-char dark:text-white" : "text-char-soft/50 dark:text-ink-soft/50")}>{step.label}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Admin note */}
          {data.admin_note && (
            <div className="rounded-2xl border border-lajvard/15 bg-lajvard/5 p-5 dark:border-lajvard-soft/15 dark:bg-lajvard-soft/5">
              <p className="text-sm font-bold text-lajvard dark:text-lajvard-soft">یادداشت فروشگاه</p>
              <p className="mt-2 text-sm leading-7 text-char-soft dark:text-ink-soft">{data.admin_note}</p>
            </div>
          )}

          {/* Items */}
          {data.items.length > 0 && (
            <div className="rounded-2xl border border-char/10 bg-surface p-6 shadow-shelf dark:border-white/10 dark:bg-[#262320]">
              <h3 className="mb-4 font-extrabold text-char dark:text-white">اقلام سفارش</h3>
              <div className="space-y-2">
                {data.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-char/5 bg-white/50 p-3 dark:border-white/5 dark:bg-white/5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-char dark:text-white">{item.product_name_snapshot}</p>
                      {item.variant_name_snapshot && <p className="text-xs text-char-soft dark:text-ink-soft">{item.variant_name_snapshot}</p>}
                    </div>
                    <p className="num-latin text-sm font-bold text-char dark:text-white">{faNum(item.quantity)} × {faPrice(item.unit_price_snapshot)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price summary */}
          <div className="rounded-2xl border border-char/10 bg-surface p-6 shadow-shelf dark:border-white/10 dark:bg-[#262320]">
            <dl className="space-y-2.5 text-sm">
              {data.shipping_cost > 0 && (
                <div className="flex justify-between"><dt className="text-char-soft dark:text-ink-soft">هزینه ارسال</dt><dd className="num-latin font-medium">{faPrice(data.shipping_cost)}</dd></div>
              )}
              {data.discount_amount > 0 && (
                <div className="flex justify-between"><dt className="text-char-soft dark:text-ink-soft">تخفیف</dt><dd className="num-latin font-medium text-clay dark:text-clay-soft">−{faPrice(data.discount_amount)}</dd></div>
              )}
              {data.campaign_discount_amount > 0 && (
                <div className="flex justify-between"><dt className="text-char-soft dark:text-ink-soft">تخفیف کمپین</dt><dd className="num-latin font-medium text-clay dark:text-clay-soft">−{faPrice(data.campaign_discount_amount)}</dd></div>
              )}
              {data.tax_amount > 0 && (
                <div className="flex justify-between"><dt className="text-char-soft dark:text-ink-soft">مالیات ({toPersianDigits(String(Math.round(data.tax_rate * 100)))}%)</dt><dd className="num-latin font-medium">{faPrice(data.tax_amount)}</dd></div>
              )}
              <div className="my-2 border-t border-char/10 dark:border-white/10" />
              <div className="flex justify-between"><dt className="font-extrabold text-char dark:text-white">مبلغ کل</dt><dd className="num-latin text-lg font-extrabold text-lajvard dark:text-lajvard-soft">{faPrice(data.total_amount)}</dd></div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
