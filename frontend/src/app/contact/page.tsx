"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";


export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim() || null,
      phone: String(form.get("phone") ?? "").trim() || null,
      subject: String(form.get("subject") ?? "").trim(),
      message: String(form.get("message") ?? "").trim(),
    };
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch(`/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        _noDedup: true,
        _noCache: true,
      } as RequestInit);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.detail ?? data.message ?? "ارسال پیام ناموفق بود. دوباره تلاش کنید.";
        // Handle FastAPI validation array
        const detailMsg = Array.isArray(data.detail) ? data.detail.map((d: { msg: string }) => d.msg).join("، ") : msg;
        toast(typeof detailMsg === "string" ? detailMsg : msg, "error");
        setSubmitting(false);
        return;
      }
      setSent(true);
      toast(data.message ?? "پیام شما دریافت شد؛ به‌زودی پاسخ می‌دهیم.", "success");
    } catch {
      toast("ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.", "error");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 md:px-6">
      <h1 className="text-3xl font-extrabold md:text-4xl">تماس با ما</h1>
      <p className="mt-4 leading-8 text-char-soft dark:text-ink-soft">
        سفارش سفارشی، عمده‌فروشی یا فقط سلام؟ خوشحال می‌شویم بشنویم.
      </p>

      <dl className="mt-8 grid gap-4 rounded-wobble bg-surface p-6 text-sm shadow-shelf sm:grid-cols-2">
        <div>
          <dt className="font-bold">ساعات کارگاه</dt>
          <dd className="mt-1 text-char-soft dark:text-ink-soft">شنبه تا چهارشنبه، ۹ تا ۱۷</dd>
        </div>
        <div>
          <dt className="font-bold">نشانی</dt>
          <dd className="mt-1 leading-7 text-char-soft dark:text-ink-soft">
            اصفهان، خیابان مشتاق دوم، کارگاه تن‌سِرام
          </dd>
        </div>
        <div>
          <dt className="font-bold">تلفن</dt>
          <dd className="num-latin mt-1" dir="ltr">031-3663-0000</dd>
        </div>
        <div>
          <dt className="font-bold">ایمیل</dt>
          <dd className="num-latin mt-1" dir="ltr">hello@tinceram.ir</dd>
        </div>
      </dl>

      {sent ? (
        <p role="status" className="mt-8 rounded-wobble bg-firouzeh/15 p-5 font-medium">
          پیام شما رسید؛ معمولاً ظرف یک روز کاری پاسخ می‌دهیم.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field label="نام" required>
            <Input name="name" required minLength={2} maxLength={128} autoComplete="name" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ایمیل (یا موبایل را پر کنید)" >
              <Input name="email" type="email" dir="ltr" placeholder="you@example.com" autoComplete="email" />
            </Field>
            <Field label="موبایل (اختیاری، 11 رقم)">
              <Input name="phone" dir="ltr" placeholder="09121234567" pattern="09\d{9}" inputMode="numeric" autoComplete="tel" />
            </Field>
          </div>
          <p className="text-xs text-char-soft dark:text-ink-soft">حداقل یکی از ایمیل یا موبایل معتبر (09xxxxxxxxx) الزامی است.</p>
          <Field label="موضوع (اختیاری)">
            <Input name="subject" maxLength={255} placeholder="در مورد سفارش، همکاری، …" />
          </Field>
          <Field label="پیام" required>
            <Textarea name="message" required minLength={10} maxLength={4000} placeholder="پیام خود را بنویسید…" />
          </Field>
          <Button type="submit" disabled={submitting} className="min-w-32">
            {submitting ? "در حال ارسال…" : "ارسال پیام"}
          </Button>
        </form>
      )}
    </div>
  );
}