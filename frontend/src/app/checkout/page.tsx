"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast-provider";
import { useCart } from "@/lib/cart";
import { API_URL } from "@/lib/api";
import { faPrice } from "@/lib/format";
import { mediaUrl } from "@/lib/api";

const SHIPPING = 55000;
const GIFT_FEE = 30000;

export default function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function applyCoupon() {
    if (!coupon.trim()) return;
    const res = await fetch(`${API_URL}/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon, order_total: subtotal }),
    });
    const data = await res.json();
    setDiscount(data.discount_amount ?? 0);
    setCouponMsg(data.message ?? "");
    toast(data.message ?? "", data.valid ? "success" : "error");
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.detail ?? "خطا در ثبت سفارش", "error");
        setSubmitting(false);
        return;
      }
      sessionStorage.setItem(
        "tinceram.last-order",
        JSON.stringify({ ...data, placedAt: Date.now() }),
      );
      clear();
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

  const total = Math.max(subtotal - discount + SHIPPING + (giftWrap ? GIFT_FEE : 0), 0);

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

          {/* gift options */}
          <div className="glaze-edge rounded-wobble bg-surface p-5 dark:bg-black/25">
            <label className="flex cursor-pointer items-center gap-3 font-medium">
              <input
                type="checkbox"
                checked={giftWrap}
                onChange={(e) => setGiftWrap(e.target.checked)}
                className="h-5 w-5 accent-[#31547A]"
              />
              <Gift size={18} className="text-clay" />
              بسته‌بندی هدیه (+{faPrice(GIFT_FEE)})
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
          <div className="space-y-4 rounded-wobble bg-surface p-6 shadow-shelf dark:bg-black/25">
            <h2 id="sum-h" className="font-extrabold">خلاصهٔ سفارش</h2>
            <ul className="max-h-56 space-y-3 overflow-auto pl-1">
              {lines.map((l) => (
                <li key={l.productId} className="flex items-center gap-3 text-sm">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slip dark:bg-black/30">
                    {l.imageUrl && (
                      <Image src={mediaUrl(l.imageUrl)} alt="" fill sizes="48px" className="object-cover" />
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate">{l.name}</span>
                  <span className="num-latin text-xs text-char-soft" aria-label={`تعداد ${l.quantity}`}>
                    ×{new Intl.NumberFormat("fa-IR").format(l.quantity)}
                  </span>
                  <span>{faPrice(l.price * l.quantity)}</span>
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
                <Button type="button" variant="secondary" onClick={applyCoupon}>
                  اعمال
                </Button>
              </div>
              {couponMsg && <p className="mt-2 text-xs text-char-soft dark:text-ink-soft">{couponMsg}</p>}
            </div>

            <dl className="space-y-2 border-t border-char/10 pt-4 text-sm dark:border-white/10">
              <div className="flex justify-between"><dt>جمع کالاها</dt><dd>{faPrice(subtotal)}</dd></div>
              {discount > 0 && (
                <div className="flex justify-between text-firouzeh"><dt>تخفیف</dt><dd>−{faPrice(discount)}</dd></div>
              )}
              <div className="flex justify-between"><dt>ارسال</dt><dd>{faPrice(SHIPPING)}</dd></div>
              {giftWrap && (
                <div className="flex justify-between"><dt>بسته‌بندی هدیه</dt><dd>{faPrice(GIFT_FEE)}</dd></div>
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

