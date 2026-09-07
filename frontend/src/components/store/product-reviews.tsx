"use client";

import React, { useEffect, useState } from "react";
import { fetchProductReviews, submitProductReview, type ProductReview } from "@/lib/store-api";
import { StarIcon, ChatIcon, CheckIcon } from "./icons";

const fmt = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

function faDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

const getName = (r: ProductReview) =>
  r.name || r.user_name || r.author_name || "کاربر تن‌سرام";
const getText = (r: ProductReview) => r.text || r.comment || r.body || "";
const getRating = (r: ProductReview) => {
  const n = Number(r.rating ?? 0);
  return Number.isFinite(n) ? Math.min(5, Math.max(0, Math.round(n))) : 0;
};

function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  return (
    <span className="flex items-center gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} filled={i <= value} className={className} />
      ))}
    </span>
  );
}

interface Props {
  productId: number | string;
  onCountChange?: (count: number) => void;
}

export function ProductReviews({ productId, onCountChange }: Props) {
  const [items, setItems] = useState<ProductReview[] | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ✅ فچ نظرات همین محصول با productId
  useEffect(() => {
    let cancelled = false;
    setItems(null);
    fetchProductReviews(productId)
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    if (items) onCountChange?.(items.length);
  }, [items, onCountChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("لطفاً نام خود را وارد کنید.");
      return;
    }
    if (rating === 0) {
      setFormError("لطفاً امتیاز خود را انتخاب کنید.");
      return;
    }
    if (text.trim().length < 3) {
      setFormError("متن نظر خیلی کوتاه است.");
      return;
    }

    setSending(true);
    try {
      const created = await submitProductReview({
        productId,
        name: name.trim(),
        rating,
        text: text.trim(),
      });
      const newItem: ProductReview =
        created && (created.id || created.text)
          ? created
          : {
              id: Date.now(),
              name: name.trim(),
              rating,
              text: text.trim(),
              created_at: new Date().toISOString(),
            };
      setItems((prev) => [newItem, ...(prev ?? [])]);
      setText("");
      setRating(0);
      setName("");
      setSuccessMsg("نظر شما با موفقیت ثبت شد. سپاس از همراهی‌تان 🙏");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      setFormError("ثبت نظر با خطا مواجه شد. لطفاً دوباره تلاش کنید.");
    } finally {
      setSending(false);
    }
  }

  const list = items ?? [];
  const average = list.length ? list.reduce((s, r) => s + getRating(r), 0) / list.length : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-black text-stone-900 dark:text-white/90">نظرات مشتریان</h3>
          {list.length > 0 && (
            <span className="flex items-center gap-2">
              <Stars value={Math.round(average)} />
              <span className="text-sm font-bold text-stone-700 dark:text-stone-200">
                {fmt(Math.round(average * 10) / 10)}
              </span>
              <span className="text-xs text-stone-400 dark:text-stone-500">({fmt(list.length)} نظر)</span>
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-xl border border-stone-200 dark:border-white/15 px-4 py-2 text-sm font-bold text-stone-700 dark:text-stone-200 transition hover:border-stone-900 dark:hover:border-white/40 hover:bg-stone-900 hover:text-white"
        >
          {showForm ? "بستن فرم" : "ثبت نظر جدید"}
        </button>
      </div>

      {successMsg && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          <CheckIcon className="h-4 w-4" />
          {successMsg}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 rounded-2xl border border-stone-200 dark:border-white/15 bg-stone-50/70 dark:bg-white/5 p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-200">نام شما</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-stone-200 dark:border-white/15 bg-white dark:bg-char px-4 py-2.5 text-sm outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10"
                placeholder="مثلاً عباس"
              />
            </label>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-200">امتیاز شما</span>
              <div className="flex items-center gap-1 pt-1" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHoverRating(i)}
                    aria-label={`${i} ستاره`}
                    className="p-0.5 transition hover:scale-110"
                  >
                    <StarIcon
                      filled={i <= (hoverRating || rating)}
                      className="h-6 w-6 text-amber-500"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-200">نظر شما</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-stone-200 dark:border-white/15 bg-white dark:bg-char px-4 py-2.5 text-sm leading-7 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10"
              placeholder="تجربه‌تان از این محصول را بنویسید..."
            />
          </label>
          {formError && <p className="mt-3 text-sm font-medium text-red-500 dark:text-red-400">{formError}</p>}
          <button
            type="submit"
            disabled={sending}
            className="mt-4 rounded-xl bg-stone-900 dark:bg-white/90 dark:text-char px-6 py-2.5 text-sm font-bold text-white transition hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-50"
          >
            {sending ? "در حال ثبت..." : "ثبت نظر"}
          </button>
        </form>
      )}

      {items === null ? (
        <div className="mt-6 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-white/10" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-200 dark:border-white/15 py-10 text-center">
          <ChatIcon className="h-8 w-8 text-stone-300 dark:text-stone-600" />
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
            هنوز نظری برای این محصول ثبت نشده است.
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500">اولین نفر باشید و نظر خود را ثبت کنید.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((r, i) => (
            <li
              key={r.id ?? i}
              className="rounded-2xl border border-stone-100 dark:border-white/10 bg-white dark:bg-char p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-400/15 text-sm font-black text-amber-900 dark:text-amber-300">
                    {getName(r).trim().charAt(0) || "؟"}
                  </span>
                  <div>
                    <span className="block text-sm font-bold text-stone-800 dark:text-white/85">{getName(r)}</span>
                    {faDate(r.created_at ?? r.date) && (
                      <span className="block text-[11px] text-stone-400 dark:text-stone-500">
                        {faDate(r.created_at ?? r.date)}
                      </span>
                    )}
                  </div>
                </div>
                <Stars value={getRating(r)} />
              </div>
              {getText(r) && <p className="mt-3 text-sm leading-7 text-stone-600 dark:text-stone-300">{getText(r)}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
