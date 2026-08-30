"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Check,
  Clock,
  Home,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api-client";
import { faNum, faPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ---------- shape mirrors backend OrderStatusOut (app/schemas/store.py) ---------- */
interface OrderStatusEvent {
  status: string;
  at: string;
}
interface OrderItemLine {
  product_id: string;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  subtotal: number;
  variant_id: string | null;
  variant_name_snapshot: string | null;
}
interface OrderStatus {
  order_number: string;
  status: string;
  updated_at: string;
  total_amount: number;
  shipping_cost: number;
  discount_amount: number;
  tax_rate?: number;
  tax_amount: number;
  campaign_discount_amount?: number;
  tracking_code: string | null;
  carrier: string | null;
  shipping_method_name: string | null;
  items: OrderItemLine[];
  history: OrderStatusEvent[];
}

/* ---------- canonical forward path; cancelled renders separately ---------- */
const STEPS = [
  { key: "pending", label: "در انتظار پرداخت", icon: Clock },
  { key: "paid", label: "پرداخت شد", icon: BadgeCheck },
  { key: "processing", label: "در حال آماده‌سازی", icon: Package },
  { key: "shipped", label: "ارسال شد", icon: Truck },
  { key: "delivered", label: "تحویل شد", icon: Home },
] as const;

const CANCELLED = "cancelled";

const STATUS_LABELS: Record<string, string> = {
  ...Object.fromEntries(STEPS.map((s) => [s.key, s.label])),
  [CANCELLED]: "لغو شده",
};

/* fa-IR formats Jalali dates with Persian digits out of the box */
const faDateTime = new Intl.DateTimeFormat("fa-IR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function faWhen(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : faDateTime.format(d);
}

type LoadState = "loading" | "ready" | "not-found" | "error";

export default function TrackingPage() {
  const params = useParams<{ order_number: string }>();
  const router = useRouter();
  const orderNumber = decodeURIComponent(params.order_number ?? "");

  const [state, setState] = useState<LoadState>("loading");
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(() => {
    if (!orderNumber) {
      setState("not-found");
      return;
    }
    setState("loading");
    let disposed = false;
    apiFetch(`/orders/${encodeURIComponent(orderNumber)}/status`, {
      _noCache: true,
      _noDedup: true,
    } as RequestInit)
      .then(async (res) => {
        if (disposed) return;
        if (res.status === 404) {
          setState("not-found");
          return;
        }
        if (!res.ok) {
          setState("error");
          return;
        }
        setOrder((await res.json()) as OrderStatus);
        setState("ready");
      })
      .catch(() => {
        if (!disposed) setState("error");
      });
    return () => {
      disposed = true;
    };
  }, [orderNumber]);

  useEffect(() => load(), [load, attempt]);

  if (state === "loading") return <TrackingSkeleton />;
  if (state === "not-found") {
    return (
      <PageShell>
        <EmptyState
          title="سفارشی با این شماره پیدا نشد."
          description="شمارهٔ سفارش را از پیام تأیید خرید یا پنل حساب کاربری بررسی کنید."
          action={
            <Button onClick={() => router.push("/track")}>جست‌وجوی شمارهٔ دیگر</Button>
          }
        />
      </PageShell>
    );
  }
  if (state === "error" || !order) {
    return (
      <PageShell>
        <EmptyState
          title="ارتباط با سرور برقرار نشد."
          description="اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید."
          action={<Button onClick={() => setAttempt((n) => n + 1)}>تلاش دوباره</Button>}
        />
      </PageShell>
    );
  }

  const cancelled = order.status === CANCELLED;
  const activeIndex = STEPS.findIndex((s) => s.key === order.status);
  /* earliest event per status wins — a status should appear once */
  const whenByStatus = new Map<string, string>();
  for (const h of order.history ?? []) {
    if (!whenByStatus.has(h.status)) whenByStatus.set(h.status, h.at);
  }
  const itemsTotal = order.items.reduce((sum, i) => sum + i.subtotal, 0);
  const currentLabel = STATUS_LABELS[order.status] ?? order.status;

  return (
    <PageShell>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">پیگیری سفارش</h1>
          <p className="num-latin mt-2 text-sm font-bold text-lajvard dark:text-lajvard-soft" dir="ltr">
            {order.order_number}
          </p>
        </div>
        <Badge tone={cancelled ? "warm" : "brand"} className="px-3 py-1 text-sm">
          {currentLabel}
        </Badge>
      </header>

      {cancelled ? (
        <div
          role="status"
          className="glaze-edge mt-8 rounded-wobble bg-clay/10 p-5 dark:bg-clay-soft/10"
        >
          <div className="flex items-center gap-3">
            <XCircle size={24} aria-hidden="true" className="shrink-0 text-clay" />
            <p className="text-xl font-bold text-clay">این سفارش لغو شده است.</p>
          </div>
          <p className="mt-2 text-sm leading-7 text-char-soft dark:text-ink-soft">
            اگر وجه پرداخت شده باشد، مبلغ آن تا ۷۲ ساعت به حساب شما بازمی‌گردد.
          </p>
          {whenByStatus.get(CANCELLED) && (
            <p className="mt-1 text-xs text-char-soft dark:text-ink-soft">
              زمان لغو: {faWhen(whenByStatus.get(CANCELLED))}
            </p>
          )}
        </div>
      ) : (
        <ol className="mt-8 space-y-2 border-r-2 border-dashed border-firouzeh/50 pr-6 dark:border-firouzeh-soft/40">
          {STEPS.map((step, i) => {
            const done = i < activeIndex;
            const isCurrent = i === activeIndex;
            const Icon = step.icon;
            const when = whenByStatus.get(step.key);
            return (
              <li key={step.key} className="relative flex items-center gap-4 pb-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -right-[45px] flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-200",
                    done &&
                      "border-lajvard bg-lajvard text-white dark:border-firouzeh-soft dark:bg-firouzeh-soft dark:text-char",
                    isCurrent &&
                      "border-lajvard bg-surface text-lajvard dark:border-lajvard-soft dark:text-lajvard-soft",
                    !done && !isCurrent && "border-char/20 bg-surface text-char-soft/70 dark:border-white/20",
                  )}
                >
                  {done ? <Check size={16} /> : <Icon size={16} />}
                  {isCurrent && (
                    <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-lajvard dark:bg-lajvard-soft" />
                  )}
                </span>
                <div
                  className={cn(
                    "flex-1",
                    isCurrent &&
                      "glaze-edge is-active rounded-wobble bg-surface/70 px-4 py-3 shadow-shelf dark:bg-white/5",
                  )}
                >
                  <p
                    aria-current={isCurrent ? "step" : undefined}
                    className={cn(
                      "font-bold",
                      isCurrent
                        ? "text-lajvard dark:text-lajvard-soft"
                        : done
                          ? "text-ink"
                          : "text-char-soft dark:text-ink-soft",
                    )}
                  >
                    {step.label}
                  </p>
                  {(done || isCurrent) && when && (
                    <p className="mt-0.5 text-xs text-char-soft dark:text-ink-soft">{faWhen(when)}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {order.status === "pending" && (
        <div className="mt-6 rounded-wobble bg-lajvard/10 p-4 dark:bg-lajvard-soft/10">
          <p className="text-sm leading-7">این سفارش در انتظار پرداخت است؛ در صورت انصراف از پرداخت، پس از ۳۰ دقیقه به‌صورت خودکار لغو می‌شود.</p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => router.push(`/track?order=${encodeURIComponent(order.order_number)}`)}
          >
            پرداخت مجدد
          </Button>
        </div>
      )}

      {/* ——— order summary ——— */}
      <section
        aria-label="خلاصه سفارش"
        className="mt-8 rounded-wobble bg-surface p-6 shadow-shelf dark:bg-black/25"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">خلاصه سفارش</h2>
          {order.tracking_code && (
            <div className="flex items-center gap-2 text-sm">
              <Truck size={16} aria-hidden="true" className="text-char-soft dark:text-ink-soft" />
              <span className="text-char-soft dark:text-ink-soft">کد رهگیری:</span>
              <span className="num-latin font-bold text-lajvard dark:text-lajvard-soft" dir="ltr">
                {order.tracking_code}
              </span>
            </div>
          )}
        </div>

        <ul className="mt-4 divide-y divide-char/5 dark:divide-white/5">
          {order.items.map((item, idx) => (
            <li key={`${item.product_id}-${item.variant_id ?? idx}`} className="flex items-center justify-between gap-4 py-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {item.product_name_snapshot}
                  {item.variant_name_snapshot ? ` — ${item.variant_name_snapshot}` : ""}
                </span>
                <span className="num-latin text-xs text-char-soft dark:text-ink-soft">
                  {faNum(item.quantity)} عدد
                </span>
              </span>
              <span className="shrink-0 text-sm">{faPrice(item.subtotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-char/10 pt-4 text-sm dark:border-white/10">
          <div className="flex items-center justify-between">
            <dt className="text-char-soft dark:text-ink-soft">هزینه اقلام</dt>
            <dd>{faPrice(itemsTotal)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-char-soft dark:text-ink-soft">هزینه ارسال{order.shipping_method_name ? ` (${order.shipping_method_name})` : ""}</dt>
            <dd>{order.shipping_cost > 0 ? faPrice(order.shipping_cost) : "رایگان"}</dd>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-char-soft dark:text-ink-soft">تخفیف</dt>
              <dd>−{faPrice(order.discount_amount)}</dd>
            </div>
          )}
          {order.campaign_discount_amount && order.campaign_discount_amount > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-char-soft dark:text-ink-soft">تخفیف کمپین</dt>
              <dd>−{faPrice(order.campaign_discount_amount)}</dd>
            </div>
          )}
          {order.tax_amount > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-char-soft dark:text-ink-soft">مالیات بر ارزش افزوده</dt>
              <dd>{faPrice(order.tax_amount)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-char/10 pt-3 dark:border-white/10">
            <dt className="font-bold">مبلغ کل</dt>
            <dd className="text-lg font-bold text-lajvard dark:text-lajvard-soft">
              {faPrice(order.total_amount)}
            </dd>
          </div>
        </dl>

        {order.carrier && (
          <p className="mt-4 flex items-center gap-2 text-sm text-char-soft dark:text-ink-soft">
            <Truck size={16} aria-hidden="true" />
            حمل توسط: <span className="font-medium text-ink dark:text-ink">{order.carrier}</span>
          </p>
        )}
      </section>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">{children}</div>;
}

function TrackingSkeleton() {
  return (
    <PageShell>
      <div aria-busy="true" aria-label="در حال بارگیری وضعیت سفارش">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="mt-3 h-4 w-32" />
        <div className="mt-8 space-y-6 border-r-2 border-dashed border-firouzeh/50 pr-6 dark:border-firouzeh-soft/40">
          {STEPS.map((step) => (
            <div key={step.key} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-5 flex-1" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-8 h-72 w-full rounded-wobble" />
      </div>
    </PageShell>
  );
}
