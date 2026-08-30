"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";

interface Question {
  id: string;
  author_name: string;
  question: string;
  answer: string | null;
  created_at: string;
}

export function ProductQuestions({ productId }: { productId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qText, setQText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function load() {
      try {
        const { apiFetch } = await import("@/lib/api-client");
        const res = await apiFetch(`/products/${productId}/questions`, { signal: controller.signal } as RequestInit);
        if (!cancelled && res.ok) setQuestions(await res.json());
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
      if (!cancelled) setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || qText.trim().length < 5) return;
    setSubmitting(true);
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch(`/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, question: qText.trim() }),
        _noDedup: true,
        _noCache: true,
      } as RequestInit);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.message || "خطا در ثبت پرسش");
      toast(data.message ?? "پرسش شما ثبت شد و پس از بررسی پاسخ داده می‌شود.", "success");
      setQText("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "خطا", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-12 space-y-6">
      <h3 className="text-xl font-extrabold">پرسش و پاسخ</h3>
      {loading ? (
        <p className="text-sm text-ink-soft">در حال بارگذاری پرسش‌ها…</p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-ink-soft">هنوز پرسشی ثبت نشده؛ اولین نفر باشید.</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="rounded-2xl bg-surface p-4 shadow-shelf">
              <div className="flex items-center gap-2 text-xs text-char-soft dark:text-ink-soft">
                <span className="font-bold text-char dark:text-white">{q.author_name}</span>
                <span>—</span>
                <span>{new Date(q.created_at).toLocaleDateString("fa-IR")}</span>
              </div>
              <p className="mt-2 text-sm font-medium leading-7">{q.question}</p>
              {q.answer ? (
                <div className="mt-3 rounded-xl bg-lajvard/10 p-3 text-sm leading-7 dark:bg-lajvard-soft/10">
                  <span className="font-bold">پاسخ فروشگاه:</span> {q.answer}
                </div>
              ) : (
                <p className="mt-2 text-xs text-char-soft dark:text-ink-soft">در انتظار پاسخ کارشناس…</p>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="rounded-2xl bg-surface p-5 shadow-shelf">
        <h4 className="font-bold">پرسش خود را بپرسید</h4>
        <p className="mt-1 text-xs text-char-soft dark:text-ink-soft">پاسخ از طریق همین صفحه و اعلان‌ها نمایش داده می‌شود.</p>
        <Field label="متن پرسش" required>
          <Textarea value={qText} onChange={(e) => setQText(e.target.value)} required minLength={5} maxLength={1024} placeholder="مثلاً: این ماگ برای مایکروویو مناسب است؟" />
        </Field>
        <Button type="submit" disabled={submitting || qText.trim().length < 5} className="mt-3">
          {submitting ? "در حال ارسال…" : "ثبت پرسش"}
        </Button>
      </form>
    </div>
  );
}