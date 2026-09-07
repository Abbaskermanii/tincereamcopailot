"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast-provider";
import { useCart } from "@/lib/cart";
import { type ShippingMethod, mediaUrl } from "@/lib/api";
import { faPrice } from "@/lib/format";
import { Gift } from "lucide-react";

const FALLBACK_SHIPPING = 55000;

export default function CheckoutPage() {
  const { lines, subtotal, variantSelections } = useCart();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function loadShipping() {
      try {
        const { apiFetch } = await import("@/lib/api-client");
        const res = await apiFetch(`/shipping-methods`, { signal: controller.signal } as RequestInit);
        if (!cancelled && res.ok) {
          const data = (await res.json()) as ShippingMethod[];
          const active = data.filter((m) => m.is_active);
          setShippingMethods(active);
          if (active.length > 0 && active[0]) setSelectedShippingId(active[0].id);
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        /* fallback to empty -> use FALLBACK_SHIPPING */
      }
    }
    void loadShipping();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function loadSettings() {
      try {
        const { apiFetch } = await import("@/lib/api-client");
        const res = await apiFetch(`/settings/gift_fee`, { signal: controller.signal } as RequestInit);
        if (!cancelled && res.ok) {
          const data = (await res.json()) as { value: number };
          setGiftFee(data.value);
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        /* fallback to FALLBACK_SHIPPING */
      }
    }
    void loadSettings();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const [giftFee, setGiftFee] = useState(30000);
  const [taxRate, setTaxRate] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function loadTax() {
      try {
        const { apiFetch } = await import("@/lib/api-client");
        const res = await apiFetch(`/settings/tax_rate`, { signal: controller.signal } as RequestInit);
        if (!cancelled && res.ok) {
          const data = (await res.json()) as { value: unknown };
          const v = typeof data.value === "number" ? data.value : typeof data.value === "string" ? parseFloat(data.value) : 0;
          if (!Number.isNaN(v) && v >= 0 && v < 1) setTaxRate(v);
          else if (!Number.isNaN(v) && v >= 1 && v < 100) setTaxRate(v / 100);
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    void loadTax();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const selectedShipping = shippingMethods.find((m) => m.id === selectedShippingId) ?? null;
  const shippingCost = (() => {
    if (!selectedShipping) return FALLBACK_SHIPPING;
    if (selectedShipping.free_over_amount !== null && subtotal >= Number(selectedShipping.free_over_amount)) return 0;
    return Number(selectedShipping.cost);
  })();
  const taxable = Math.max(subtotal - discount, 0);
  const taxAmount = Math.round(taxable * taxRate);

  const [applyingCoupon, setApplyingCoupon] = useState(false);
  async function applyCoupon() {
    if (!coupon.trim() || applyingCoupon) return;
    setApplyingCoupon(true);
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch(`/coupons/validate`, {
        method: "POST",
        body: JSON.stringify({ code: coupon, order_total: subtotal }),
        _noDedup: true,
        _noCache: true,
      } as RequestInit);
      const data = await res.json();
      setDiscount(data.discount_amount ?? 0);
      setCouponMsg(data.message ?? "");
      toast(data.message ?? "", data.valid ? "success" : "error");
    } catch (e) {
      toast((e as Error).message || "خطا در اعتبارسنجی", "error");
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch(`/orders`, {
        method: "POST",
        body: JSON.stringify({
          items: lines.map((l) => ({ product_id: l.productId, quantity: l.qty, variant_id: l.variantId ?? null })),
          customer_name: form.get("customer_name"),
          phone: form.get("phone"),
          email: form.get("email") || null,
          address: form.get("address"),
          city: form.get("city"),
          province: form.get("province"),
          postal_code: String(form.get("postal_code") ?? "").replace(
            /[۰-۹]/g,
            (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)),
          ),
          coupon_code: coupon.trim() || null,
          gift_wrap: giftWrap,
          gift_note: giftWrap ? form.get("gift_note") || null : null,
          shipping_method_id: selectedShippingId,
          variant_selections: Object.keys(variantSelections).length > 0 ? variantSelections : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.detail ?? "خطا در ثبت سفارش", "error");
        setSubmitting(false);
        return;
      }
      // Persist order info for the confirmation page
      sessionStorage.setItem(
        "tinceram.last-order",
        JSON.stringify({ ...data, placedAt: Date.now() }),
      );
      // C5 fix: do NOT permanently clear the cart before payment is confirmed.
      // Keep the cart in localStorage so the user can retry after a failure or
      // cancellation. Snapshot the pending cart for recovery if needed.
      try {
        sessionStorage.setItem("tinceram.pending-cart", JSON.stringify(lines));
      } catch {
        /* ignore quota errors */
      }
      // Redirect to the payment gateway when a payment_url is provided.
      // Otherwise fall back to the confirmation page (e.g. for COD flows).
      if (data.payment_url) {
        window.location.href = data.payment_url;
        return;
      }
      router.push(`/order/confirmation?order=${data.order_number}`);
    } catch {
      toast("ارتباط با سرور برقرار نشد", "error");
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          title="برای تسویه، سبد باید پر باشد"
          action={<Button onClick={() => router.push("/")}>رفتن به فروشگاه</Button>}
        />
      </div>
    );
  }

  const total = Math.max(subtotal - discount + shippingCost + (giftWrap ? giftFee : 0) + taxAmount, 0);

  return (
    <form onSubmit={submit} className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="mb-8 text-3xl font-extrabold">تسویه حساب</h1>
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        {/* customer info */}
        <section aria-labelledby="ci-h" className="space-y-4">
          <h2 id="ci-h" className="sr-only">اطلاعات خریدار</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام و نام خانوادگی" required>
              <Input name="customer_name" required minLength={2} autoComplete="name" />
            </Field>
            <Field label="شمارهٔ موبایل" required>
              <Input name="phone" required pattern="09\d{9}" inputMode="numeric" dir="ltr" placeholder="09xxxxxxxxx" autoComplete="tel" />
            </Field>
          </div>
          <Field label="ایمیل (اختیاری)">
            <Input name="email" type="email" dir="ltr" autoComplete="email" />
          </Field>
          <Field label="نشانی کامل" required>
            <Textarea name="address" required minLength={10} autoComplete="street-address" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="استان" required>
              <Input name="province" required />
            </Field>
            <Field label="شهر" required>
              <Input name="city" required />
            </Field>
            <Field label="کد پستی" required>
              <Input name="postal_code" required pattern="\d{10}" inputMode="numeric" dir="ltr" />
            </Field>
          </div>

          {/* shipping method */}
          {shippingMethods.length > 0 ? (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-bold">
                <Truck size={18} className="text-lajvard" /> روش ارسال
              </h3>
              <div className="grid gap-2">
                {shippingMethods.map((m) => {
                  const cost = Number(m.cost);
                  const freeOver = m.free_over_amount !== null ? Number(m.free_over_amount) : null;
                  const isFree = freeOver !== null && subtotal >= freeOver;
                  return (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${selectedShippingId === m.id ? "border-lajvard bg-lajvard/10 dark:border-lajvard-soft dark:bg-lajvard-soft/10" : "border-char/15 bg-surface dark:border-white/15"}`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping_method"
                          checked={selectedShippingId === m.id}
                          onChange={() => setSelectedShippingId(m.id)}
                          className="h-4 w-4 accent-[#31547A]"
                        />
                        <span>
                          <span className="block text-sm font-medium">{m.name}</span>
                          <span className="block text-xs text-char-soft dark:text-ink-soft">
                            {m.estimated_days_min}–{m.estimated_days_max} روز کاری
                            {freeOver !== null ? ` — رایگان بالای ${faPrice(freeOver)}` : ""}
                          </span>
                        </span>
                      </span>
                      <span className="text-sm font-bold">{isFree ? "رایگان" : cost === 0 ? "رایگان" : faPrice(cost)}</span>
                    </label>
                  );
                })}
              </div>
              {selectedShipping &&
                selectedShipping.free_over_amount !== null &&
                subtotal >= Number(selectedShipping.free_over_amount) && (
                  <p className="text-xs font-medium text-firouzeh">✓ ارسال رایگان برای این سفارش اعمال شد</p>
                )}
            </div>
          ) : (
            <p className="text-xs text-char-soft dark:text-ink-soft">هزینهٔ ارسال: {faPrice(FALLBACK_SHIPPING)} — پس از انتخاب روش ارسال به‌روز می‌شود</p>
          )}

          {/* gift options */}
          <div className="glaze-edge rounded-wobble bg-surface p-5">
            <label className="flex cursor-pointer items-center gap-3 font-medium">
              <input
                type="checkbox"
                checked={giftWrap}
                onChange={(e) => setGiftWrap(e.target.checked)}
                className="h-5 w-5 accent-[#31547A]"
              />
              <Gift size={18} className="text-clay" />
              بسته‌بندی هدیه (+{faPrice(giftFee)})
            </label>
            {giftWrap && (
              <div className="mt-3">
                <Field label="یادداشت هدیه">
                  <Textarea name="gift_note" placeholder="برای همکار عزیزم که…" maxLength={512} />
                </Field>
              </div>
            )}
          </div>

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? "در حال انتقال به درگاه…" : "پرداخت امن با زرین‌پال"}
          </Button>
          <p className="text-center text-xs text-char-soft dark:text-ink-soft">
            پس از ثبت، به درگاه زرین‌پال منتقل می‌شوید و بلافاصله به فروشگاه بازمی‌گردید.
          </p>
        </section>

        {/* summary */}
        <aside aria-labelledby="sum-h" className="lg:sticky lg:top-28 lg:self-start">
          <div className="space-y-4 rounded-wobble bg-surface p-6 shadow-shelf">
            <h2 id="sum-h" className="font-extrabold">خلاصهٔ سفارش</h2>
            <ul className="max-h-56 space-y-3 overflow-auto pl-1">
              {lines.map((l) => (
                <li key={`${l.productId}-${l.variantId ?? ""}`} className="flex items-center gap-3 text-sm">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slip dark:bg-surface">
                    {l.imageUrl && (
                      <Image src={mediaUrl(l.imageUrl)} alt="" fill sizes="48px" className="object-cover" />
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate">{l.name}</span>
                  <span className="num-latin text-xs text-char-soft" aria-label={`تعداد ${l.qty}`}>
                    ×{new Intl.NumberFormat("fa-IR").format(l.qty)}
                  </span>
                  <span>{faPrice(l.price * l.qty)}</span>
                </li>
              ))}
            </ul>

            {/* coupon */}
            <div className="border-t border-char/10 pt-4 dark:border-white/10">
              <label htmlFor="cpn" className="mb-2 block text-sm font-medium">کد تخفیف</label>
              <div className="flex gap-2">
                <Input
                  id="cpn"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="مثلاً WELCOME15"
                  dir="ltr"
                />
                <Button type="button" variant="secondary" onClick={applyCoupon} disabled={applyingCoupon}>
                  {applyingCoupon ? "..." : "اعمال"}
                </Button>
              </div>
              {couponMsg && <p className="mt-2 text-xs text-char-soft dark:text-ink-soft">{couponMsg}</p>}
            </div>

            <dl className="space-y-2 border-t border-char/10 pt-4 text-sm dark:border-white/10">
              <div className="flex justify-between"><dt>جمع کالاها</dt><dd>{faPrice(subtotal)}</dd></div>
              {discount > 0 && (
                <div className="flex justify-between text-firouzeh"><dt>تخفیف</dt><dd>−{faPrice(discount)}</dd></div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between"><dt>مالیات ({Math.round(taxRate * 100)}٪)</dt><dd>{faPrice(taxAmount)}</dd></div>
              )}
              <div className="flex justify-between">
                <dt>ارسال{selectedShipping ? ` (${selectedShipping.name})` : ""}</dt>
                <dd>{shippingCost === 0 ? "رایگان" : faPrice(shippingCost)}</dd>
              </div>
              {giftWrap && (
                <div className="flex justify-between"><dt>بسته‌بندی هدیه</dt><dd>{faPrice(giftFee)}</dd></div>
              )}
              <div className="flex justify-between border-t border-char/10 pt-2 text-base font-extrabold dark:border-white/10">
                <dt>قابل پرداخت</dt>
                <dd className="text-lajvard dark:text-lajvard-soft">{faPrice(total)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </form>
  );
}
