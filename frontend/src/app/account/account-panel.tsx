"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

export function AccountPanel({ section = "profile" }: { section?: string }) {
  const [data, setData] = useState<unknown>(null); const [error, setError] = useState(false);
  useEffect(() => { const token = localStorage.getItem("access_token"); fetch(`${API_URL}/${section === "orders" ? "orders/me" : section === "addresses" ? "users/me/addresses" : section === "wishlist" ? "wishlist" : "auth/me"}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r => r.ok ? r.json() : Promise.reject()).then(setData).catch(() => setError(true)); }, [section]);
  return <div className="mx-auto max-w-5xl px-4 py-10 md:px-6"><div className="flex flex-wrap gap-2 border-b border-char/10 pb-4 dark:border-white/10">{[["profile","پروفایل"],["addresses","نشانی‌ها"],["orders","سفارش‌ها"],["wishlist","علاقه‌مندی‌ها"]].map(([key,label]) => <Link key={key} href={`/account/${key}`} className={`rounded-full px-4 py-2 text-sm ${section === key ? "bg-lajvard text-white" : "bg-char/8 dark:bg-white/10"}`}>{label}</Link>)}</div><h1 className="mt-9 text-3xl font-extrabold">{section === "profile" ? "پروفایل من" : section === "addresses" ? "نشانی‌های من" : section === "orders" ? "سفارش‌های من" : "علاقه‌مندی‌ها"}</h1>{error ? <p className="mt-6 rounded-2xl bg-kiln-clay/15 p-5">برای مشاهده‌ی این بخش وارد حساب شوید.</p> : !data ? <p className="mt-6 text-ink-soft">در حال بارگذاری…</p> : <pre className="mt-6 overflow-auto rounded-2xl bg-surface p-5 text-sm dark:bg-white/5" dir="ltr">{JSON.stringify(data, null, 2)}</pre>}</div>;
}
