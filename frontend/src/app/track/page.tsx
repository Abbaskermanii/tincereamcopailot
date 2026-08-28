"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Package, Truck, BadgeCheck, Home, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { API_URL } from "@/lib/api";
import { toPersianDigits, faNum } from "@/lib/format";

const STEPS = [
  { key: "pending", label: "در انتظار پرداخت", icon: Clock },
  { key: "paid", label: "پرداخت شد", icon: BadgeCheck },
  { key: "processing", label: "در حال آماده‌سازی", icon: Package },
  { key: "shipped", label: "ارسال شد", icon: Truck },
  { key: "delivered", label: "تحویل شد", icon: Home },
] as const;

const CANCELLED = "cancelled";

function TrackInner() {
  const params = useSearchParams();
  const [orderNo, setOrderNo] = useState(params.get("order") ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (no: string) => {
    if (!no.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/orders/${encodeURIComponent(no.trim())}/status`);
      if (!res.ok) {
        setStatus(null);
        setError("سفارشی با این شماره پیدا نشد.");
      } else {
        const data = await res.json();
        setStatus(data.status);
        setTotal(data.total_amount ?? null);
      }
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const initial = params.get("order");
    if (initial) void lookup(initial);
  }, [params, lookup]);

  const activeIndex = status ? STEPS.findIndex((s) => s.key === status) : -1;
  const cancelled = status === CANCELLED;

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="mb-3 text-3xl font-extrabold">پیگیری سفارش</h1>
      <p className="mb-8 text-char-soft dark:text-ink-soft">
        شمارهٔ سفارش را وارد کنید؛ نمونه: TC-260826-XY2SYJ
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(orderNo);
        }}
        className="flex gap-2"
      >
        <Input
          value={orderNo}
          onChange={(e) => setOrderNo(e.target.value)}
          placeholder="TC-…"
          dir="ltr"
          aria-label="شمارهٔ سفارش"
        />
        <Button type="submit" disabled={loading}>
          جست‌وجو
        </Button>
      </form>

      {loading && (
        <div className="mt-10 space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {error && !loading && (
        <p role="alert" className="mt-8 rounded-wobble bg-clay/10 p-4 text-sm text-clay">
          {error}
        </p>
      )}

      {status && !cancelled && !loading && (
        <div className="mt-12">
          <ol className="relative space-y-8 border-r-2 border-dashed border-firouzeh/50 pr-6">
            {STEPS.map((step, i) => {
              const done = i <= activeIndex;
              const isCurrent = i === activeIndex;
              const Icon = step.icon;
              return (
                <li key={step.key} className="relative flex items-center gap-4">
                  <span
                    aria-hidden
                    className={
                      "absolute -right-[37px] flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors " +
                      (done
                        ? "border-firouzeh bg-firouzeh text-white"
                        : "border-char/20 bg-surface text-char-soft dark:bg-black/25")
                    }
                  >
                    {done ? <Check size={16} /> : <Icon size={16} />}
                  </span>
                  <div>
                    <p
                      className={
                        "font-bold " +
                        (isCurrent ? "text-lajvard dark:text-lajvard-soft" : done ? "" : "text-char-soft dark:text-ink-soft")
                      }
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      {step.label}
                    </p>
                    {isCurrent && total !== null && step.key !== "pending" && (
                      <p className="text-xs text-char-soft dark:text-ink-soft">
                        مبلغ سفارش: {faNum(total)} تومان
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {cancelled && !loading && (
        <div role="status" className="mt-10 rounded-wobble bg-clay/10 p-5">
          <p className="font-bold text-clay">این سفارش لغو شده است.</p>
          <p className="mt-2 text-sm text-char-soft dark:text-ink-soft">
            اگر وجه کسر شده باشد تا ۷۲ ساعت به حساب شما بازمی‌گردد.
          </p>
        </div>
      )}

      {!status && !loading && (
        <p className="num-latin mt-6 text-xs text-char-soft" dir="ltr">
          {toPersianDigits("")}
        </p>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto my-14 h-64 max-w-2xl" />}>
      <TrackInner />
    </Suspense>
  );
}
