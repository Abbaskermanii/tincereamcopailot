"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Textarea, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";

interface Review {
  id: string;
  author_name: string;
  rating: number;
  title: string;
  body: string;
  is_buyer: boolean;
  helpful_count: number;
  admin_reply: string | null;
  created_at: string;
}

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{ total: number; average_rating: number; distribution: Record<string, number> } | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function load() {
      try {
        // کش 60s + dedup via apiFetch
        const { apiFetch } = await import("@/lib/api-client");
        const res = await apiFetch(`/products/${productId}/reviews`, { signal: controller.signal } as RequestInit);
        if (!cancelled && res.ok) {
          const data = await res.json();
          setReviews(data.items);
          setStats({ total: data.total, average_rating: data.average_rating, distribution: data.distribution });
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    void load();
    return () => { cancelled = true; controller.abort(); };
  }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast("برای ثبت نظر وارد شوید.", "error");
      setSubmitting(false);
      return;
    }
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch(`/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, rating, title, body }),
        // POST هرگز کش نمی‌شود و dedup نمی‌شود
        _noDedup: true,
        _noCache: true,
      } as RequestInit);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.message || "خطا");
      toast("نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود.", "success");
      setTitle(""); setBody("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "خطا", "error");
    } finally { setSubmitting(false); }
  }

  async function toggleHelpful(reviewId: string) {
    const token = localStorage.getItem("access_token");
    if (!token) { toast("برای امتیازدهی وارد شوید.", "error"); return; }
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch(`/reviews/${reviewId}/helpful`, {
        method: "POST",
        _noDedup: true,
        _noCache: true,
      } as RequestInit);
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, helpful_count: data.helpful_count } : r)));
      }
    } catch {}
  }

  return (
    <div className="mt-12 space-y-6">
      <h3 className="text-xl font-extrabold">نظرات مشتریان</h3>
      {stats && (
        <div className="flex items-center gap-4 rounded-2xl bg-surface p-4">
          <div className="text-center">
            <p className="text-3xl font-extrabold">{stats.average_rating.toFixed(1)}</p>
            <p className="text-xs text-char-soft">از {stats.total} نظر</p>
          </div>
          <div className="flex-1 space-y-1">
            {[5,4,3,2,1].map((s) => (
              <div key={s} className="flex items-center gap-2 text-xs">
                <span className="w-6">{s}★</span>
                <div className="h-2 flex-1 rounded-full bg-char/10 dark:bg-white/10">
                  <div className="h-2 rounded-full bg-lajvard" style={{ width: `${stats.total ? ( (stats.distribution[String(s)]||0) / stats.total)*100 : 0}%` }} />
                </div>
                <span className="w-6 text-char-soft">{stats.distribution[String(s)]||0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-4">
        {reviews.length === 0 ? <p className="text-sm text-ink-soft">هنوز نظری ثبت نشده.</p> : reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-surface p-4 shadow-shelf">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{r.author_name}</span>
              {r.is_buyer && <span className="rounded-full bg-firouzeh/15 px-2 py-0.5 text-xs">خریدار تأییدشده</span>}
              <span className="mr-auto text-xs text-char-soft">{new Date(r.created_at).toLocaleDateString("fa-IR")}</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm text-amber-500">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)} <span className="mr-2 font-medium text-char">{r.title}</span></div>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-char-soft dark:text-ink-soft">{r.body}</p>
            {r.admin_reply && <div className="mt-3 rounded-xl bg-lajvard/10 p-3 text-sm dark:bg-lajvard-soft/10"><span className="font-bold">پاسخ فروشگاه:</span> {r.admin_reply}</div>}
            <button onClick={() => void toggleHelpful(r.id)} className="mt-3 text-xs text-char-soft hover:text-lajvard">مفید بود ({r.helpful_count})</button>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="rounded-2xl bg-surface p-5 shadow-shelf">
        <h4 className="font-bold">نظر خود را بنویسید</h4>
        <div className="mt-3 flex items-center gap-2">
          <label className="text-sm">امتیاز:</label>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-lg border p-1">
            {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} ستاره</option>)}
          </select>
        </div>
        <Field label="عنوان (اختیاری)"><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} /></Field>
        <Field label="متن نظر" required><Textarea value={body} onChange={(e) => setBody(e.target.value)} required minLength={3} maxLength={4000} /></Field>
        <Button type="submit" disabled={submitting} className="mt-3">{submitting ? "در حال ارسال…" : "ثبت نظر (پس از تأیید)"}</Button>
      </form>
    </div>
  );
}