"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Truck, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast-provider";
import { useCart } from "@/lib/cart";
import { type ShippingMethod, mediaUrl } from "@/lib/api";
import { faPrice } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { Gift } from "lucide-react";

type Address = {
  id: string;
  title: string;
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  is_default: boolean;
};

type AddressCreatePayload = {
  title?: string;
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  is_default: boolean;
};

const FALLBACK_SHIPPING = 55000;

/* ── skeleton while auth is loading ── */
function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 animate-pulse">
      <div className="mb-8 h-10 w-48 rounded bg-char/10" />
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-char/10" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-char/10" />
      </div>
    </div>
  );
}

/* ── inline address form ── */
function AddressFormInline({
  onSave,
  onCancel,
  saving,
  isFirst,
}: {
  onSave: (data: AddressCreatePayload) => void;
  onCancel: () => void;
  saving: boolean;
  isFirst: boolean;
}) {
  const [title, setTitle] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isDefault, setIsDefault] = useState(isFirst);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({
      ...(title ? { title } : {}),
      recipient_name: recipientName,
      phone,
      address: addr,
      province,
      city,
      postal_code: postalCode.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))),
      is_default: isDefault,
    });
  }

  return (
    <div className="rounded-2xl border border-lajvard/30 bg-lajvard/5 p-5 dark:border-lajvard-soft/30 dark:bg-lajvard-soft/5">
      <h3 className="mb-4 flex items-center gap-2 font-bold text-lajvard dark:text-lajvard-soft">
        <Plus size={18} /> ثبت آدرس جدید
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="عنوان (اختیاری)">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً خانه" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نام گیرنده" required>
            <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required minLength={2} />
          </Field>
          <Field label="شماره تماس" required>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} required pattern="09\d{9}" inputMode="numeric" dir="ltr" placeholder="09xxxxxxxxx" />
          </Field>
        </div>
        <Field label="آدرس کامل" required>
          <Textarea value={addr} onChange={(e) => setAddr(e.target.value)} required minLength={10} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="استان" required>
            <Input value={province} onChange={(e) => setProvince(e.target.value)} required />
          </Field>
          <Field label="شهر" required>
            <Input value={city} onChange={(e) => setCity(e.target.value)} required />
          </Field>
          <Field label="کد پستی" required>
            <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required pattern="\d{10}" inputMode="numeric" dir="ltr" />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="h-4 w-4 accent-[#31547A]" />
          آدرس پیش‌فرض
        </label>
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "در حال ذخیره…" : "ذخیره و استفاده"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            انصراف
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
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

  /* ── address state ── */
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [redirected, setRedirected] = useState(false);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;

  /* ── auth guard ── */
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated && !redirected) {
      setRedirected(true);
      router.replace("/auth?redirect=/checkout");
    }
  }, [authLoading, isAuthenticated, redirected, router]);

  /* ── fetch addresses once authenticated ── */
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const controller = new AbortController();
    async function load() {
      setAddrLoading(true);
      try {
        const { apiFetch } = await import("@/lib/api-client");
        const res = await apiFetch("/users/me/addresses", {
          signal: controller.signal,
        } as RequestInit);
        if (!cancelled && res.ok) {
          const data = (await res.json()) as Address[];
          setAddresses(data);
          // auto-select default or first
          const def = data.find((a) => a.is_default);
          setSelectedAddressId(def?.id ?? (data[0]?.id ?? null));
          // if no addresses, auto-open form
          if (data.length === 0) setShowNewForm(true);
        } else if (!cancelled) {
          setAddresses([]);
        }
      } catch {
        if (!cancelled) setAddresses([]);
      } finally {
        if (!cancelled) setAddrLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isAuthenticated]);

  /* ── save new address ── */
  const handleSaveAddress = useCallback(
    async (data: AddressCreatePayload) => {
      setSavingAddr(true);
      try {
        const { apiFetch } = await import("@/lib/api-client");
        const res = await apiFetch("/users/me/addresses", {
          method: "POST",
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast(
            typeof err.detail === "string" ? err.detail : "خطا در ثبت آدرس",
            "error"
          );
          return;
        }
        const newAddr = (await res.json()) as Address;
        // refresh list
        const listRes = await apiFetch("/users/me/addresses");
        if (listRes.ok) {
          const list = (await listRes.json()) as Address[];
          setAddresses(list);
        } else {
          setAddresses((prev) => [...prev, newAddr]);
        }
        setSelectedAddressId(newAddr.id);
        setShowNewForm(false);
        toast("آدرس با موفقیت ثبت شد.", "success");
      } catch {
        toast("ارتباط با سرور برقرار نشد", "error");
      } finally {
        setSavingAddr(false);
      }
    },
    [toast]
  );

  /* ── shipping methods ── */
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
      }
    }
    void loadShipping();
    return () => { cancelled = true; controller.abort(); };
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
      }
    }
    void loadSettings();
    return () => { cancelled = true; controller.abort(); };
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
    return () => { cancelled = true; controller.abort(); };
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
    if (lines.length === 0) {
      toast("سبد خرید خالی است", "error");
      return;
    }

    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const { apiFetch } = await import("@/lib/api-client");

      // Build address payload
      let payloadAddress: Record<string, unknown> = {};
      if (selectedAddress) {
        payloadAddress = {
          address_id: selectedAddress.id,
          customer_name: selectedAddress.recipient_name,
          phone: selectedAddress.phone,
          address: selectedAddress.address,
          city: selectedAddress.city,
          province: selectedAddress.province,
          postal_code: selectedAddress.postal_code,
        };
      } else {
        // inline address fields (fallback when no address selected)
        payloadAddress = {
          customer_name: form.get("customer_name"),
          phone: form.get("phone"),
          address: form.get("address"),
          city: form.get("city"),
          province: form.get("province"),
          postal_code: String(form.get("postal_code") ?? "").replace(
            /[۰-۹]/g,
            (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)),
          ),
        };
      }

      const res = await apiFetch(`/orders`, {
        method: "POST",
        body: JSON.stringify({
          items: lines.map((l) => ({
            product_id: String(l.productId),
            quantity: l.qty,
            variant_id: l.variantId != null ? String(l.variantId) : null,
          })),
          ...payloadAddress,
          email: form.get("email") || null,
          coupon_code: coupon.trim() || null,
          gift_wrap: giftWrap,
          gift_note: giftWrap ? form.get("gift_note") || null : null,
          shipping_method_id: selectedShippingId,
          variant_selections: (() => {
            const clean: Record<string, string> = {};
            for (const [k, v] of Object.entries(variantSelections)) {
              if (k && k !== "NaN" && v != null && v !== "NaN") clean[k] = v;
            }
            return Object.keys(clean).length > 0 ? clean : undefined;
          })(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          toast("لطفاً ابتدا وارد حساب کاربری شوید.", "error");
          router.replace("/auth?redirect=/checkout");
          setSubmitting(false);
          return;
        }
        toast(
          Array.isArray(data.detail)
            ? data.detail.map((d: { msg: string }) => d.msg).join(" ")
            : typeof data.detail === "string"
              ? data.detail
              : "خطا در ثبت سفارش",
          "error"
        );
        setSubmitting(false);
        return;
      }

      // Persist order info + address snapshot for confirmation page
      const addressSnapshot = selectedAddress
        ? {
            recipient_name: selectedAddress.recipient_name,
            phone: selectedAddress.phone,
            address: selectedAddress.address,
            city: selectedAddress.city,
            province: selectedAddress.province,
            postal_code: selectedAddress.postal_code,
          }
        : null;
      sessionStorage.setItem(
        "tinceram.last-order",
        JSON.stringify({
          ...data,
          placedAt: Date.now(),
          address: addressSnapshot,
        }),
      );

      try {
        sessionStorage.setItem("tinceram.pending-cart", JSON.stringify(lines));
      } catch {
        /* ignore quota errors */
      }

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

  /* ── auth loading ── */
  if (authLoading) return <CheckoutSkeleton />;

  /* ── guest ── */
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          title="برای ثبت سفارش ابتدا وارد حساب کاربری شوید"
          description="پس از ورود، آدرس‌های ذخیره‌شده شما نمایش داده می‌شود."
          action={
            <Button onClick={() => router.push("/auth?redirect=%2Fcheckout")}>
              ورود / ثبت‌نام
            </Button>
          }
        />
      </div>
    );
  }

  /* ── empty cart ── */
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

          {/* ── address selector ── */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-bold">
              <MapPin size={18} className="text-lajvard" /> آدرس تحویل
            </h3>

            {/* skeleton while addresses loading */}
            {addrLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-char/10" />
                ))}
              </div>
            ) : addresses.length === 0 && !showNewForm ? (
              /* no addresses → EmptyState + button */
              <>
                <EmptyState
                  title="هنوز آدرسی ثبت نکرده‌اید"
                  description="یک آدرس جدید ثبت کنید تا سفارش شما ارسال شود."
                />
                <Button
                  variant="secondary"
                  onClick={() => setShowNewForm(true)}
                  className="mt-3"
                >
                  <Plus size={16} className="ml-1" /> ثبت آدرس جدید
                </Button>
              </>
            ) : (
              <>
                {/* radio list of saved addresses */}
                {addresses.length > 0 && (
                  <div className="space-y-2">
                    {addresses.map((a) => (
                      <label
                        key={a.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                          selectedAddressId === a.id
                            ? "border-lajvard bg-lajvard/10 dark:border-lajvard-soft dark:bg-lajvard-soft/10"
                            : "border-char/15 bg-surface dark:border-white/15"
                        }`}
                      >
                        <input
                          type="radio"
                          name="address_id"
                          value={a.id}
                          checked={selectedAddressId === a.id}
                          onChange={() => setSelectedAddressId(a.id)}
                          className="mt-1 h-4 w-4 accent-[#31547A]"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">
                            {a.title || a.recipient_name}{" "}
                            {a.is_default && (
                              <span className="mr-2 inline-block rounded-full bg-firouzeh/20 px-2 py-0.5 text-xs font-normal text-firouzeh">
                                پیش‌فرض
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-char-soft dark:text-ink-soft">
                            {a.recipient_name} — {a.phone}
                          </p>
                          <p className="text-sm text-char-soft dark:text-ink-soft">
                            {a.address} — {a.city}، {a.province} — {a.postal_code}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* + new address button */}
                {!showNewForm && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowNewForm(true)}
                  >
                    <Plus size={16} className="ml-1" /> ثبت آدرس جدید
                  </Button>
                )}
              </>
            )}

            {/* inline new-address form */}
            {showNewForm && (
              <AddressFormInline
                saving={savingAddr}
                isFirst={addresses.length === 0}
                onSave={handleSaveAddress}
                onCancel={() => setShowNewForm(false)}
              />
            )}
          </div>

          {/* When a saved address is selected, hide inline address fields.
              When no address is selected, show the traditional inline fields. */}
          {!selectedAddress && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="نام و نام خانوادگی" required>
                  <Input name="customer_name" required minLength={2} autoComplete="name" />
                </Field>
                <Field label="شمارهٔ موبایل" required>
                  <Input name="phone" required pattern="09\d{9}" inputMode="numeric" dir="ltr" placeholder="09xxxxxxxxx" autoComplete="tel" />
                </Field>
              </div>
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
            </>
          )}

          {/* email — always shown (optional) */}
          <Field label="ایمیل (اختیاری)">
            <Input name="email" type="email" dir="ltr" autoComplete="email" />
          </Field>

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

          <Button type="submit" size="lg" disabled={submitting || (!selectedAddress && addresses.length > 0)} className="w-full">
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
