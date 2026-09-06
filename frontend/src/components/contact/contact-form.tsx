"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";

export function ContactForm() {
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

  if (sent) {
    return (
      <div
        role="status"
        className="flex h-full flex-col items-center justify-center rounded-3xl bg-firouzeh/10 p-10 text-center dark:bg-firouzeh/15"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-firouzeh/20 text-firouzeh">
          <Send className="h-6 w-6" />
        </span>
        <p className="mt-4 text-lg font-extrabold">پیام شما رسید!</p>
        <p className="mt-2 max-w-sm text-sm leading-7 text-char-soft dark:text-white/55">
          ممنون که نوشتید؛ معمولاً ظرف یک روز کاری پاسخ می‌دهیم.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-wobble-card border border-char/10 bg-surface p-6 shadow-shelf dark:border-white/10 dark:bg-[#262320] md:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نام" required>
          <Input name="name" required minLength={2} maxLength={128} autoComplete="name" />
        </Field>
        <Field label="موضوع (اختیاری)">
          <Input name="subject" maxLength={255} placeholder="در مورد سفارش، همکاری، …" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ایمیل (یا موبایل را پر کنید)">
          <Input name="email" type="email" dir="ltr" placeholder="you@example.com" autoComplete="email" />
        </Field>
        <Field label="موبایل (اختیاری، ۱۱ رقم)">
          <Input name="phone" dir="ltr" placeholder="09121234567" pattern="09\d{9}" inputMode="numeric" autoComplete="tel" />
        </Field>
      </div>
      <p className="text-xs text-char-soft dark:text-white/40">
        حداقل یکی از ایمیل یا موبایل معتبر (09xxxxxxxxx) الزامی است.
      </p>
      <Field label="پیام" required>
        <Textarea name="message" required minLength={10} maxLength={4000} placeholder="پیام خود را بنویسید…" rows={6} />
      </Field>
      <Button type="submit" disabled={submitting} className="min-w-40">
        {submitting ? "در حال ارسال…" : "ارسال پیام"}
      </Button>
    </form>
  );
}
