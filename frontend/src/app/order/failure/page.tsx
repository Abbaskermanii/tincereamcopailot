"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RestoreCartOnFailure } from "./restore-cart";
import { Button } from "@/components/ui/button";

export default function OrderFailure() {
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("tinceram.last-order");
      if (raw) {
        const j = JSON.parse(raw);
        if (j.order_number) setOrderNumber(j.order_number);
      }
    } catch {}
  }, []);

  async function retry() {
    if (!orderNumber || paying) return;
    setPaying(true);
    setErr("");
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch(`/orders/${encodeURIComponent(orderNumber)}/pay`, {
        _noCache: true,
        _noDedup: true,
      } as RequestInit);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setErr(data.detail || "پرداخت مجدد ممکن نشد.");
      else if (data.payment_url) window.location.href = data.payment_url;
    } catch {
      setErr("ارتباط با سرور برقرار نشد.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <RestoreCartOnFailure />
      <h1 className="text-3xl font-extrabold">پرداخت انجام نشد</h1>
      <p className="mt-3 text-ink-soft">تراکنش ناموفق بود؛ سبد خرید شما حفظ شده است.</p>
      {orderNumber ? (
        <div className="mt-8 space-y-3">
          <p className="text-sm text-char-soft">شماره سفارش: <span dir="ltr" className="font-mono">{orderNumber}</span></p>
          <Button onClick={() => void retry()} disabled={paying} className="w-full">
            {paying ? "در حال اتصال..." : "تلاش مجدد پرداخت"}
          </Button>
          {err && <p className="text-sm text-clay">{err}</p>}
          <Link href="/track" className="block text-sm underline">پیگیری سفارش</Link>
        </div>
      ) : (
        <Link href="/checkout" className="mt-8 inline-flex min-h-11 items-center rounded-xl bg-lajvard px-6 text-white">
          بازگشت به پرداخت
        </Link>
      )}
    </div>
  );
}
