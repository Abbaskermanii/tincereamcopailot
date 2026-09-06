"use client";

import { useEffect, useState } from "react";
import { HelpCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { faNum } from "@/lib/format";

interface Question {
  id: string;
  author_name: string;
  question: string;
  answer: string | null;
  created_at: string;
}

function QuestionSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl bg-surface p-4 shadow-shelf dark:bg-black/25">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-char/10 dark:bg-white/10" />
        <div className="h-3 w-24 rounded bg-char/10 dark:bg-white/10" />
      </div>
      <div className="h-3 w-3/4 rounded bg-char/10 dark:bg-white/10" />
      <div className="h-3 w-1/2 rounded bg-char/10 dark:bg-white/10" />
    </div>
  );
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
    <div className="space-y-6" id="questions">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-extrabold">پرسش و پاسخ</h3>
        {questions.length > 0 && (
          <span className="text-sm text-char-soft dark:text-ink-soft">{faNum(questions.length)} پرسش</span>
        )}
      </div>

      {loading ? (
        <>
          <QuestionSkeleton />
          <QuestionSkeleton />
        </>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface p-6 text-center shadow-shelf dark:bg-black/25">
          <MessageSquare className="h-8 w-8 text-char/25 dark:text-white/20" strokeWidth={1.5} />
          <p className="text-sm text-ink-soft">هنوز پرسشی ثبت نشده؛ اولین نفر باشید.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <article key={q.id} className="rounded-2xl bg-surface p-4 shadow-shelf dark:bg-black/25">
              <div className="flex items-center gap-2 text-xs text-char-soft dark:text-ink-soft">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lajvard/10 dark:bg-lajvard-soft/15">
                  <HelpCircle size={15} className="text-lajvard dark:text-lajvard-soft" />
                </span>
                <span className="font-bold text-char dark:text-white">{q.author_name}</span>
                <span>—</span>
                <span>{new Date(q.created_at).toLocaleDateString("fa-IR")}</span>
              </div>
              <p className="mt-2.5 text-sm font-medium leading-7">{q.question}</p>
              {q.answer ? (
                <div className="mt-3 rounded-xl bg-lajvard/10 p-3 text-sm leading-7 dark:bg-lajvard-soft/10">
                  <span className="font-bold">پاسخ فروشگاه:</span> {q.answer}
                </div>
              ) : (
                <p className="mt-2 text-xs text-char-soft dark:text-ink-soft">در انتظار پاسخ کارشناس…</p>
              )}
            </article>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="rounded-2xl bg-surface p-5 shadow-shelf dark:bg-black/25">
        <h4 className="font-bold">پرسش خود را بپرسید</h4>
        <p className="mt-1 text-xs text-char-soft dark:text-ink-soft">
          پاسخ از طریق همین صفحه و اعلان‌ها نمایش داده می‌شود. پرسش مهمانان نیز ثبت می‌شود.
        </p>
        <div className="mt-3">
          <Field label="متن پرسش" required>
            <Textarea
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              required
              minLength={5}
              maxLength={1024}
              placeholder="مثلاً: این ماگ برای مایکروویو مناسب است؟"
            />
          </Field>
        </div>
        <div className="mt-2 text-left text-[11px] text-char-soft dark:text-ink-soft">{faNum(qText.length)}/{faNum(1024)}</div>
        <Button type="submit" disabled={submitting || qText.trim().length < 5} className="mt-3 w-full sm:w-auto">
          {submitting ? "در حال ارسال…" : "ثبت پرسش"}
        </Button>
      </form>
    </div>
  );
}