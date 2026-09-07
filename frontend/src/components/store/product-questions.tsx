"use client";

import React, { useEffect, useState } from "react";
import {
  fetchProductQuestions,
  submitProductQuestion,
  type ProductQuestion,
} from "@/lib/store-api";
import { ChatIcon, CheckIcon } from "./icons";

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

const getName = (q: ProductQuestion) =>
  q.name || q.user_name || q.author_name || "کاربر تن‌سرام";
const getQText = (q: ProductQuestion) => q.text || q.question || q.body || "";
const getAnswer = (q: ProductQuestion) => q.answer || q.reply || q.answer_text || "";

interface Props {
  productId: number | string;
  onCountChange?: (count: number) => void;
}

export function ProductQuestions({ productId, onCountChange }: Props) {
  const [items, setItems] = useState<ProductQuestion[] | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ✅ فچ پرسش‌های همین محصول با productId
  useEffect(() => {
    let cancelled = false;
    setItems(null);
    fetchProductQuestions(productId)
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
    if (text.trim().length < 3) {
      setFormError("متن پرسش خیلی کوتاه است.");
      return;
    }

    setSending(true);
    try {
      const created = await submitProductQuestion({
        productId,
        name: name.trim(),
        text: text.trim(),
      });
      const newItem: ProductQuestion =
        created && (created.id || created.text)
          ? created
          : {
              id: Date.now(),
              name: name.trim(),
              text: text.trim(),
              created_at: new Date().toISOString(),
            };
      setItems((prev) => [newItem, ...(prev ?? [])]);
      setText("");
      setName("");
      setSuccessMsg("پرسش شما ثبت شد و به‌زودی پاسخ داده می‌شود.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      setFormError("ثبت پرسش با خطا مواجه شد. لطفاً دوباره تلاش کنید.");
    } finally {
      setSending(false);
    }
  }

  const list = items ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-lg font-black text-stone-900 dark:text-white/90">پرسش و پاسخ</h3>
          {list.length > 0 && (
            <span className="rounded-full bg-stone-100 dark:bg-white/10 px-2.5 py-0.5 text-xs font-bold text-stone-500 dark:text-stone-400">
              {fmt(list.length)} پرسش
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-xl border border-stone-200 dark:border-white/15 px-4 py-2 text-sm font-bold text-stone-700 dark:text-stone-200 transition hover:border-stone-900 dark:hover:border-white/40 hover:bg-stone-900 hover:text-white"
        >
          {showForm ? "بستن فرم" : "پرسش جدید"}
        </button>
      </div>

      {successMsg && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          <CheckIcon className="h-4 w-4" />
          {successMsg}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-5 rounded-2xl border border-stone-200 dark:border-white/15 bg-stone-50/70 dark:bg-white/5 p-5">
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
          </div>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-200">پرسش شما</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-stone-200 dark:border-white/15 bg-white dark:bg-char px-4 py-2.5 text-sm leading-7 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10"
              placeholder="سؤال‌تان درباره این محصول را بنویسید..."
            />
          </label>
          {formError && <p className="mt-3 text-sm font-medium text-red-500 dark:text-red-400">{formError}</p>}
          <button
            type="submit"
            disabled={sending}
            className="mt-4 rounded-xl bg-stone-900 dark:bg-white/90 dark:text-char px-6 py-2.5 text-sm font-bold text-white transition hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-50"
          >
            {sending ? "در حال ثبت..." : "ثبت پرسش"}
          </button>
        </form>
      )}

      {items === null ? (
        <div className="mt-6 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-stone-100 dark:bg-white/10" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-200 dark:border-white/15 py-10 text-center">
          <ChatIcon className="h-8 w-8 text-stone-300 dark:text-stone-600" />
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">هنوز پرسشی درباره این محصول ثبت نشده است.</p>
          <p className="text-xs text-stone-400 dark:text-stone-500">سؤال‌تان را بپرسید، سریع پاسخ می‌دهیم.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((q, i) => (
            <li key={q.id ?? i} className="rounded-2xl border border-stone-100 dark:border-white/10 bg-white dark:bg-char p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-400/15 text-amber-900 dark:text-amber-300">
                  <ChatIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-stone-800 dark:text-white/85">{getName(q)}</span>
                    {faDate(q.created_at ?? q.date) && (
                      <span className="text-[11px] text-stone-400 dark:text-stone-500">{faDate(q.created_at ?? q.date)}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm leading-7 text-stone-600 dark:text-stone-300">{getQText(q)}</p>
                </div>
              </div>

              {getAnswer(q) && (
                <div className="mt-3 mr-11 flex items-start gap-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-500/10 p-3.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-300">پاسخ فروشگاه</span>
                    <p className="mt-1 text-sm leading-7 text-stone-600 dark:text-stone-300">{getAnswer(q)}</p>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}