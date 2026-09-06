"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ThumbsUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Textarea, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { useAuth } from "@/lib/auth-context";
import { faNum } from "@/lib/format";

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

interface ReviewStats {
  total: number;
  average_rating: number;
  distribution: Record<string, number>;
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`امتیاز ${faNum(value)} از ۵`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= value ? "fill-amber-400 text-amber-500" : "text-char/25 dark:text-white/25"} />
      ))}
    </span>
  );
}

function ReviewSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl bg-surface p-4 shadow-shelf dark:bg-black/25">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-full bg-char/10 dark:bg-white/10" />
        <div className="space-y-1.5">
          <div className="h-3 w-24 rounded bg-char/10 dark:bg-white/10" />
          <div className="h-2.5 w-16 rounded bg-char/10 dark:bg-white/10" />
        </div>
      </div>
      <div className="h-3 w-3/4 rounded bg-char/10 dark:bg-white/10" />
      <div className="h-3 w-1/2 rounded bg-char/10 dark:bg-white/10" />
    </div>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function load() {
      try {
        const { apiFetch } = await import("@/lib/api-client");
        const res = await apiFetch(`/products/${productId}/reviews`, { signal: controller.signal } as RequestInit);
        if (!cancelled && res.ok) {
          const data = await res.json();
          setReviews(Array.isArray(data.items) ? data.items : []);
          setStats({
            total: data.total ?? 0,
            average_rating: data.average_rating ?? 0,
            distribution: data.distribution ?? {},
          });
          setLoadError(false);
        } else if (!cancelled && !res.ok) {
          setLoadError(true);
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; controller.abort(); };
  }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!isAuthenticated) {
      toast("برای ثبت نظر ابتدا وارد حساب خود شوید.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch(`/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, rating, title, body }),
        _noDedup: true,
        _noCache: true,
      } as RequestInit);
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error("نشست شما منقضی شده؛ دوباره وارد شوید.");
      if (res.status === 409) throw new Error("شما قبلاً برای این محصول نظر ثبت کرده‌اید.");
      if (!res.ok) throw new Error(data.detail || data.message || "خطا در ثبت نظر");
      toast("نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود.", "success");
      setTitle("");
      setBody("");
      setRating(5);
    } catch (err) {
      toast(err instanceof Error ? err.message : "خطا", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const toggleHelpful = useCallback(
    async (reviewId: string) => {
      if (!isAuthenticated) {
        toast("برای ثبت بازخورد وارد شوید.", "error");
        return;
      }
      const alreadyVoted = votedIds.has(reviewId);
      try {
        const { apiFetch } = await import("@/lib/api-client");
        const res = await apiFetch(`/reviews/${reviewId}/helpful`, {
          method: "POST",
          _noDedup: true,
          _noCache: true,
        } as RequestInit);
        if (res.status === 401) {
          toast("برای ثبت بازخورد وارد شوید.", "error");
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, helpful_count: data.helpful_count } : r)));
        setVotedIds((prev) => {
          const next = new Set(prev);
          if (alreadyVoted) next.delete(reviewId);
          else next.add(reviewId);
          return next;
        });
      } catch {
        /* silent — non-critical action */
      }
    },
    [isAuthenticated, votedIds, toast],
  );

  const activeRating = hoverRating || rating;

  return (
    <div className="space-y-6" id="reviews">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-extrabold">نظرات مشتریان</h3>
        {stats && stats.total > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-char-soft dark:text-ink-soft">
            <Stars value={Math.round(stats.average_rating)} />
            {faNum(stats.average_rating)} از {faNum(stats.total)} نظر
          </span>
        )}
      </div>

      {stats && stats.total > 0 && (
        <div className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-shelf dark:bg-black/25">
          <div className="text-center">
            <p className="text-3xl font-extrabold">{faNum(stats.average_rating)}</p>
            <p className="mt-1 text-xs text-char-soft dark:text-ink-soft">میانگین امتیاز</p>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((s) => {
              const count = stats.distribution[String(s)] ?? 0;
              return (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className="w-8 shrink-0 text-char-soft dark:text-ink-soft">{faNum(s)} ★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-char/10 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-lajvard transition-all dark:bg-lajvard-soft"
                      style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-left text-char-soft dark:text-ink-soft">{faNum(count)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <>
            <ReviewSkeleton />
            <ReviewSkeleton />
          </>
        ) : loadError ? (
          <p className="rounded-2xl bg-clay/10 p-4 text-sm text-clay">خطا در بارگذاری نظرات؛ دوباره تلاش کنید.</p>
        ) : reviews.length === 0 ? (
          <p className="rounded-2xl bg-surface p-5 text-sm text-ink-soft shadow-shelf dark:bg-black/25">
            هنوز نظری ثبت نشده؛ اولین نفر باشید.
          </p>
        ) : (
          reviews.map((r) => (
            <article key={r.id} className="rounded-2xl bg-surface p-4 shadow-shelf dark:bg-black/25">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-kiln-clay/25 to-lajvard/25 text-sm font-extrabold">
                  {(r.author_name || "م").trim()[0]}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{r.author_name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} size={12} />
                    {r.is_buyer && (
                      <span className="rounded-full bg-firouzeh/15 px-2 py-0.5 text-[10px] font-bold text-firouzeh">
                        خریدار تأییدشده
                      </span>
                    )}
                  </div>
                </div>
                <span className="mr-auto shrink-0 text-xs text-char-soft dark:text-ink-soft">
                  {new Date(r.created_at).toLocaleDateString("fa-IR")}
                </span>
              </div>
              {r.title && <p className="mt-3 text-sm font-bold">{r.title}</p>}
              <p className="mt-1.5 whitespace-pre-line text-sm leading-7 text-char-soft dark:text-ink-soft">{r.body}</p>
              {r.admin_reply && (
                <div className="mt-3 rounded-xl bg-lajvard/10 p-3 text-sm leading-7 dark:bg-lajvard-soft/10">
                  <span className="font-bold">پاسخ فروشگاه:</span> {r.admin_reply}
                </div>
              )}
              <button
                type="button"
                onClick={() => void toggleHelpful(r.id)}
                aria-pressed={votedIds.has(r.id)}
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
                  votedIds.has(r.id)
                    ? "bg-firouzeh/15 text-firouzeh"
                    : "text-char-soft hover:bg-char/5 hover:text-lajvard dark:text-ink-soft"
                }`}
              >
                <ThumbsUp size={13} className={votedIds.has(r.id) ? "fill-firouzeh/30" : ""} />
                مفید بود ({faNum(r.helpful_count)})
              </button>
            </article>
          ))
        )}
      </div>
      <form onSubmit={submit} className="rounded-2xl bg-surface p-5 shadow-shelf dark:bg-black/25">
        <h4 className="font-bold">نظر خود را بنویسید</h4>
        {!authLoading && !isAuthenticated && (
          <p className="mt-2 rounded-xl bg-kiln-clay/10 p-3 text-xs leading-6">
            برای ثبت نظر باید وارد حساب شوید.{" "}
            <Link href="/auth" className="font-bold text-lajvard underline underline-offset-4 dark:text-lajvard-soft">
              ورود / ثبت‌نام
            </Link>
          </p>
        )}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm font-medium">امتیاز شما:</span>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="انتخاب امتیاز">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} ستاره`}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(n)}
                className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lajvard"
              >
                <Star
                  size={22}
                  className={n <= activeRating ? "fill-amber-400 text-amber-500" : "text-char/25 dark:text-white/25"}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <Field label="عنوان (اختیاری)">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="متن نظر" required>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} required minLength={3} maxLength={4000} />
          </Field>
        </div>
        <Button type="submit" disabled={submitting || !isAuthenticated} className="mt-4 w-full sm:w-auto">
          {submitting ? "در حال ارسال…" : "ثبت نظر (پس از تأیید)"}
        </Button>
      </form>
    </div>
  );
}