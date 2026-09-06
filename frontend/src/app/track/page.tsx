"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Package,
  Truck,
  BadgeCheck,
  Home,
  Clock,
  XCircle,
  Copy,
  CheckCheck,
  Search,
  ShoppingBag,
  Receipt,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toPersianDigits, faNum, faPrice } from "@/lib/format";

/* ── Status steps ────────────────────────────────────────────────── */
const STEPS = [
  { key: "pending", label: "در انتظار پرداخت", icon: Clock },
  { key: "paid", label: "پرداخت شد", icon: BadgeCheck },
  { key: "processing", label: "در حال آماده‌سازی", icon: Package },
  { key: "shipped", label: "ارسال شد", icon: Truck },
  { key: "delivered", label: "تحویل شد", icon: Home },
] as const;

/* ── Status-specific friendly messages ───────────────────────────── */
const STATUS_MESSAGES: Record<string, { title: string; body: string; accent?: boolean }> = {
  pending: {
    title: "سفارش شما ثبت شده ✨",
    body: "سفارش شما با موفقیت ثبت شد و منتظر پرداخت است. لطفاً هرچه سریع‌تر پرداخت را انجام دهید تا فرآیند آماده‌سازی آغاز شود.",
  },
  paid: {
    title: "پرداخت شما ثبت شد 🎉",
    body: "پرداخت سفارش شما با موفقیت انجام شد. همکاران ما در اسرع وقت سفارش شما را آماده و ارسال خواهند کرد.",
    accent: true,
  },
  processing: {
    title: "سفارش شما در حال آماده‌سازی است 📦",
    body: "تیم ما مشغول آماده‌سازی سفارش شماست. به‌محض آماده شدن، سفارش به شرکت حمل تحویل داده خواهد شد.",
  },
  shipped: {
    title: "سفارش شما ارسال شد 🚚",
    body: "سفارش شما به شرکت حمل تحویل داده شد و در مسیر ارسال است. با کد رهگیری زیر می‌توانید وضعیت مرسوله را پیگیری کنید.",
    accent: true,
  },
  delivered: {
    title: "سفارش شما تحویل شد ✅",
    body: "سفارش شما با موفقیت تحویل داده شد. امیدواریم از خرید خود راضی باشید. ممنون از اعتماد شما.",
  },
  cancelled: {
    title: "سفارش شما لغو شده است",
    body: "این سفارش لغو شده است. اگر وجهی کسر شده باشد، تا ۷۲ ساعت به حساب شما بازمی‌گردد.",
  },
};

interface OrderData {
  order_number: string;
  status: string;
  updated_at: string;
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
  items: {
    product_id: string;
    product_name_snapshot: string;
    unit_price_snapshot: number;
    quantity: number;
    subtotal: number;
    variant_name_snapshot: string | null;
  }[];
}

/* ── Copy button ─────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-firouzeh/30 bg-firouzeh/10 px-3 py-1.5 text-sm text-firouzeh transition-colors hover:bg-firouzeh/20 dark:border-firouzeh-soft/30 dark:bg-firouzeh-soft/10 dark:text-firouzeh-soft dark:hover:bg-firouzeh-soft/20"
    >
      {copied ? (
        <>
          <CheckCheck className="h-3.5 w-3.5" />
          کپی شد
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          کپی کد
        </>
      )}
    </button>
  );
}

/* ── Main tracking page ──────────────────────────────────────────── */
function TrackInner() {
  const params = useSearchParams();
  const [orderNo, setOrderNo] = useState(params.get("order") ?? "");
  const [data, setData] = useState<OrderData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  const lookup = useCallback(async (no: string) => {
    if (!no.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch(`/orders/${encodeURIComponent(no.trim())}/status`, {
        _noCache: true,
        _noDedup: true,
      } as RequestInit);
      if (!res.ok) {
        setError("سفارشی با این شماره پیدا نشد.");
      } else {
        const json = await res.json();
        setData(json);
      }
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const initial = params.get("order");
    if (initial) {
      setOrderNo(initial);
      void lookup(initial);
    }
  }, [params, lookup]);

  const retryPay = useCallback(async () => {
    if (!orderNo.trim() || paying) return;
    setPaying(true);
    setError("");
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch(`/orders/${encodeURIComponent(orderNo.trim())}/pay`, {
        _noCache: true,
        _noDedup: true,
      } as RequestInit);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.detail || json.message || "پرداخت مجدد ممکن نشد.");
      } else if (json.payment_url) {
        window.location.href = json.payment_url;
        return;
      }
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setPaying(false);
    }
  }, [orderNo, paying]);

  const status = data?.status ?? null;
  const cancelled = status === "cancelled";
  const activeIndex = status ? STEPS.findIndex((s) => s.key === status) : -1;
  const msg = status ? STATUS_MESSAGES[status] : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-lajvard/10 dark:bg-lajvard-soft/10">
          <Receipt className="h-8 w-8 text-lajvard dark:text-lajvard-soft" />
        </div>
        <h1 className="font-display text-char dark:text-white">پیگیری سفارش</h1>
        <p className="mt-2 text-char-soft dark:text-ink-soft">
          شماره سفارش خود را وارد کنید تا وضعیت آن را مشاهده کنید
        </p>
      </div>

      {/* ── Search form ────────────────────────────────────── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(orderNo);
        }}
        className="mb-10"
      >
        <div className="flex gap-2 rounded-2xl border border-char/10 bg-surface p-2 shadow-shelf dark:border-white/10 dark:bg-[#262320]">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-char-soft dark:text-ink-soft" />
            <Input
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="مثال: TC-260906-7QQNDD"
              dir="ltr"
              aria-label="شماره سفارش"
              className="h-12 border-0 bg-transparent pr-10 text-base focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          <Button type="submit" disabled={loading} size="lg" className="shrink-0 rounded-xl px-6">
            {loading ? "در حال جست‌وجو..." : "جست‌وجو"}
          </Button>
        </div>
      </form>

      {/* ── Loading skeleton ───────────────────────────────── */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────── */}
      {error && !loading && (
        <div className="rounded-2xl border border-clay/20 bg-clay/5 p-6 text-center dark:border-clay-soft/20 dark:bg-clay-soft/5">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-clay/10 dark:bg-clay-soft/10">
            <XCircle className="h-6 w-6 text-clay dark:text-clay-soft" />
          </div>
          <p className="font-bold text-clay dark:text-clay-soft">{error}</p>
          <p className="mt-1 text-sm text-char-soft dark:text-ink-soft">
            لطفاً شماره سفارش را بررسی کنید و دوباره تلاش کنید.
          </p>
        </div>
      )}

      {/* ── Order result ───────────────────────────────────── */}
      {data && !loading && (
        <div className="space-y-6 animate-fade-in">
          {/* Status message card */}
          {msg && (
            <div
              className={
                "rounded-2xl border p-6 " +
                (cancelled
                  ? "border-clay/20 bg-clay/5 dark:border-clay-soft/20 dark:bg-clay-soft/5"
                  : msg.accent
                    ? "border-firouzeh/20 bg-firouzeh/5 dark:border-firouzeh-soft/20 dark:bg-firouzeh-soft/5"
                    : "border-lajvard/15 bg-lajvard/5 dark:border-lajvard-soft/15 dark:bg-lajvard-soft/5")
              }
            >
              <h2
                className={
                  "text-lg font-extrabold " +
                  (cancelled
                    ? "text-clay dark:text-clay-soft"
                    : msg.accent
                      ? "text-firouzeh dark:text-firouzeh-soft"
                      : "text-lajvard dark:text-lajvard-soft")
                }
              >
                {msg.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-char-soft dark:text-ink-soft">
                {msg.body}
              </p>

              {/* Tracking code - prominent display */}
              {data.tracking_code && (
                <div className="mt-4 rounded-xl border border-firouzeh/30 bg-white/50 p-4 dark:bg-white/5">
                  <div className="flex items-center gap-2 text-xs text-char-soft dark:text-ink-soft">
                    <Info className="h-3.5 w-3.5" />
                    کد رهگیری مرسوله
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span
                      className="num-latin text-xl font-extrabold tracking-wider text-char dark:text-white"
                      dir="ltr"
                    >
                      {data.tracking_code}
                    </span>
                    <CopyButton text={data.tracking_code} />
                  </div>
                  {data.carrier && (
                    <p className="mt-2 text-sm text-char-soft dark:text-ink-soft">
                      شرکت حمل: <span className="font-bold">{data.carrier}</span>
                    </p>
                  )}
                  {data.shipping_method_name && (
                    <p className="text-sm text-char-soft dark:text-ink-soft">
                      روش ارسال: <span className="font-bold">{data.shipping_method_name}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Retry payment for pending */}
              {status === "pending" && (
                <div className="mt-4">
                  <Button onClick={() => void retryPay()} disabled={paying} variant="secondary">
                    {paying ? "در حال اتصال به درگاه..." : "پرداخت مجدد"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Timeline ────────────────────────────────────── */}
          {!cancelled && (
            <div className="rounded-2xl border border-char/10 bg-surface p-6 shadow-shelf dark:border-white/10 dark:bg-[#262320]">
              <h3 className="mb-5 font-extrabold text-char dark:text-white">وضعیت سفارش</h3>
              <ol className="relative space-y-1">
                {STEPS.map((step, i) => {
                  const done = i <= activeIndex;
                  const isCurrent = i === activeIndex;
                  const isLast = i === STEPS.length - 1;
                  const Icon = step.icon;
                  return (
                    <li key={step.key} className="relative flex items-start gap-4 pb-6 last:pb-0">
                      {/* Connector line */}
                      {!isLast && (
                        <div
                          className={
                            "absolute right-[15px] top-9 h-full w-0.5 " +
                            (done && !isCurrent
                              ? "bg-firouzeh dark:bg-firouzeh-soft"
                              : "bg-char/10 dark:bg-white/10")
                          }
                        />
                      )}
                      {/* Circle */}
                      <span
                        aria-hidden
                        className={
                          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm transition-colors " +
                          (done
                            ? isCurrent
                              ? "border-lajvard bg-lajvard text-white dark:border-lajvard-soft dark:bg-lajvard-soft dark:text-char"
                              : "border-firouzeh bg-firouzeh text-white dark:border-firouzeh-soft dark:bg-firouzeh-soft dark:text-char"
                            : "border-char/15 bg-surface text-char-soft dark:border-white/15 dark:bg-[#262320] dark:text-ink-soft")
                        }
                      >
                        {done && !isCurrent ? <Check size={14} /> : <Icon size={14} />}
                      </span>
                      {/* Label */}
                      <div className="pt-0.5">
                        <p
                          className={
                            "text-sm font-bold " +
                            (isCurrent
                              ? "text-lajvard dark:text-lajvard-soft"
                              : done
                                ? "text-char dark:text-white"
                                : "text-char-soft/50 dark:text-ink-soft/50")
                          }
                          aria-current={isCurrent ? "step" : undefined}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="mt-0.5 text-xs text-char-soft dark:text-ink-soft">
                            به‌روزرسانی: {toPersianDigits(new Date(data.updated_at).toLocaleString("fa-IR"))}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* ── Admin note ──────────────────────────────────── */}
          {data.admin_note && (
            <div className="rounded-2xl border border-lajvard/15 bg-lajvard/5 p-5 dark:border-lajvard-soft/15 dark:bg-lajvard-soft/5">
              <div className="flex items-center gap-2 text-sm font-bold text-lajvard dark:text-lajvard-soft">
                <Info className="h-4 w-4" />
                یادداشت فروشگاه
              </div>
              <p className="mt-2 text-sm leading-7 text-char-soft dark:text-ink-soft">
                {data.admin_note}
              </p>
            </div>
          )}

          {/* ── Order items ─────────────────────────────────── */}
          {data.items.length > 0 && (
            <div className="rounded-2xl border border-char/10 bg-surface p-6 shadow-shelf dark:border-white/10 dark:bg-[#262320]">
              <h3 className="mb-4 flex items-center gap-2 font-extrabold text-char dark:text-white">
                <ShoppingBag className="h-4 w-4" />
                اقلام سفارش
              </h3>
              <div className="space-y-3">
                {data.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-xl border border-char/5 bg-white/50 p-3 dark:border-white/5 dark:bg-white/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-char dark:text-white">
                        {item.product_name_snapshot}
                      </p>
                      {item.variant_name_snapshot && (
                        <p className="mt-0.5 text-xs text-char-soft dark:text-ink-soft">
                          {item.variant_name_snapshot}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-left">
                      <p className="num-latin text-sm font-bold text-char dark:text-white">
                        {faNum(item.quantity)} × {faPrice(item.unit_price_snapshot)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Price summary ───────────────────────────────── */}
          <div className="rounded-2xl border border-char/10 bg-surface p-6 shadow-shelf dark:border-white/10 dark:bg-[#262320]">
            <h3 className="mb-4 flex items-center gap-2 font-extrabold text-char dark:text-white">
              <Receipt className="h-4 w-4" />
              خلاصه پرداخت
            </h3>
            <dl className="space-y-2.5 text-sm">
              {data.shipping_cost > 0 && (
                <div className="flex justify-between">
                  <dt className="text-char-soft dark:text-ink-soft">هزینه ارسال</dt>
                  <dd className="num-latin font-medium">{faPrice(data.shipping_cost)}</dd>
                </div>
              )}
              {data.discount_amount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-char-soft dark:text-ink-soft">تخفیف</dt>
                  <dd className="num-latin font-medium text-clay dark:text-clay-soft">
                    −{faPrice(data.discount_amount)}
                  </dd>
                </div>
              )}
              {data.campaign_discount_amount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-char-soft dark:text-ink-soft">تخفیف کمپین</dt>
                  <dd className="num-latin font-medium text-clay dark:text-clay-soft">
                    −{faPrice(data.campaign_discount_amount)}
                  </dd>
                </div>
              )}
              {data.tax_amount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-char-soft dark:text-ink-soft">
                    مالیات ({toPersianDigits(String(Math.round(data.tax_rate * 100)))}%)
                  </dt>
                  <dd className="num-latin font-medium">{faPrice(data.tax_amount)}</dd>
                </div>
              )}
              <div className="my-2 border-t border-char/10 dark:border-white/10" />
              <div className="flex justify-between">
                <dt className="font-extrabold text-char dark:text-white">مبلغ کل</dt>
                <dd className="num-latin text-lg font-extrabold text-lajvard dark:text-lajvard-soft">
                  {faPrice(data.total_amount)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* ── Empty state (no search yet) ────────────────────── */}
      {!data && !loading && !error && (
        <div className="mt-8 text-center">
          <p className="text-sm text-char-soft dark:text-ink-soft">
            شماره سفارش خود را در کادر بالا وارد کنید
          </p>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto my-14 h-64 max-w-2xl rounded-2xl" />}>
      <TrackInner />
    </Suspense>
  );
}
