"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { AnalyticsView } from "../analytics-view";

type Row = Record<string, unknown>;
type Field = { key: string; label: string; type?: "number" | "textarea" | "checkbox" };

const configs: Record<string, { title: string; endpoint: string; fields: Field[]; columns: string[]; deletable?: boolean }> = {
  products: {
    title: "محصولات", endpoint: "admin/products", deletable: true,
    fields: [
      { key: "name", label: "نام" }, { key: "slug", label: "شناسه (slug)" },
      { key: "category_id", label: "شناسه دسته" }, { key: "sku", label: "SKU" },
      { key: "price", label: "قیمت", type: "number" }, { key: "stock_qty", label: "موجودی", type: "number" },
      { key: "description", label: "توضیحات", type: "textarea" }, { key: "is_active", label: "فعال", type: "checkbox" },
    ], columns: ["name", "sku", "price", "stock_qty", "is_active"],
  },
  categories: {
    title: "دسته‌بندی محصولات", endpoint: "admin/categories", deletable: true,
    fields: [{ key: "name", label: "نام" }, { key: "slug", label: "شناسه (slug)" }, { key: "description", label: "توضیحات", type: "textarea" }],
    columns: ["name", "slug", "parent_id"],
  },
  "product-categories": {
    title: "دسته‌بندی محصولات", endpoint: "admin/categories", deletable: true,
    fields: [{ key: "name", label: "نام" }, { key: "slug", label: "شناسه (slug)" }, { key: "description", label: "توضیحات", type: "textarea" }],
    columns: ["name", "slug", "parent_id"],
  },
  "blog-categories": {
    title: "دسته‌بندی مقالات", endpoint: "admin/article-categories", deletable: true,
    fields: [{ key: "name", label: "نام" }, { key: "slug", label: "شناسه (slug)" }], columns: ["name", "slug"],
  },
  "article-categories": {
    title: "دسته‌بندی مقالات", endpoint: "admin/article-categories", deletable: true,
    fields: [{ key: "name", label: "نام" }, { key: "slug", label: "شناسه (slug)" }], columns: ["name", "slug"],
  },
  articles: {
    title: "مقالات", endpoint: "admin/articles", deletable: true,
    fields: [{ key: "title", label: "عنوان" }, { key: "slug", label: "شناسه (slug)" }, { key: "excerpt", label: "خلاصه", type: "textarea" }, { key: "body", label: "متن", type: "textarea" }, { key: "category_id", label: "شناسه دسته" }, { key: "is_published", label: "منتشر شده", type: "checkbox" }],
    columns: ["title", "slug", "is_published", "published_at"],
  },
  orders: {
    title: "سفارش‌ها", endpoint: "admin/orders",
    fields: [{ key: "status", label: "وضعیت" }], columns: ["order_number", "customer_name", "total_amount", "status", "created_at"],
  },
};

const labels: Record<string, string> = { analytics: "تحلیل‌ها", users: "کاربران" };
const statuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

function authHeaders(json = false): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const basic = typeof window !== "undefined" ? localStorage.getItem("admin_authorization") : null;
  return { ...(json ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : basic ? { Authorization: basic } : {}) };
}

export default function AdminPage({ params }: { params: { section: string[] } }) {
  const section = params.section.at(-1) ?? "analytics";
  const config = configs[section];
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!config) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/${config.endpoint}`, { headers: authHeaders() });
      if (!response.ok) throw new Error("دریافت داده‌ها ناموفق بود");
      const data = await response.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) { setError(e instanceof Error ? e.message : "خطا"); }
    finally { setLoading(false); }
  }, [config]);
  useEffect(() => { void load(); }, [load]);

  const startCreate = () => { setEditing(null); setForm(config?.fields.reduce((a, f) => ({ ...a, [f.key]: f.type === "checkbox" ? true : "" }), {}) ?? {}); };
  const startEdit = (row: Row) => { setEditing(row); setForm({ ...row }); };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    const isOrder = section === "orders";
    const endpoint = editing?.id ? `${config!.endpoint}/${editing.id}${isOrder ? "/status" : ""}` : config!.endpoint;
    const response = await fetch(`${API_URL}/${endpoint}`, { method: editing ? "PATCH" : "POST", headers: authHeaders(true), body: JSON.stringify(isOrder ? { status: form.status } : form) });
    if (!response.ok) { setError(await response.text() || "ذخیره ناموفق بود"); return; }
    setEditing(null); setForm({}); await load();
  };
  const remove = async (row: Row) => {
    if (!row.id || !window.confirm("این مورد حذف شود؟")) return;
    const response = await fetch(`${API_URL}/${config!.endpoint}/${row.id}`, { method: "DELETE", headers: authHeaders() });
    if (!response.ok) { setError(await response.text() || "حذف ناموفق بود"); return; }
    await load();
  };

  const title = config?.title ?? labels[section] ?? "پنل مدیریت";
  const isOrder = section === "orders";
  const visibleRows = useMemo(() => rows, [rows]);
  if (section === "analytics") {
    return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6" dir="rtl"><p className="text-sm text-ink-soft">پنل مدیریت</p><h1 className="mt-2 text-4xl font-extrabold">تحلیل‌ها</h1><AnalyticsView /></main>;
  }
  if (!config) return <main className="mx-auto max-w-7xl px-4 py-10"><h1 className="text-4xl font-extrabold">{title}</h1><p className="mt-8 text-ink-soft">این بخش هنوز پیاده‌سازی نشده است.</p></main>;

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-ink-soft">پنل مدیریت</p><h1 className="mt-2 text-4xl font-extrabold">{title}</h1></div>{!isOrder && <button onClick={startCreate} className="rounded-xl bg-ink px-4 py-2 text-white">افزودن</button>}</div>
    {error && <p className="mt-5 rounded-xl bg-kiln-clay/15 p-3 text-sm">{error}</p>}
    {(editing || (!isOrder && Object.keys(form).length > 0 && !editing)) && <form onSubmit={submit} className="mt-6 grid gap-4 rounded-2xl bg-surface p-5 shadow-shelf md:grid-cols-2">
      {config.fields.map((field) => <label key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>{field.type === "checkbox" ? <span className="flex gap-2"><input type="checkbox" checked={Boolean(form[field.key])} onChange={e => setForm({ ...form, [field.key]: e.target.checked })} />{field.label}</span> : field.key === "status" ? <select className="mt-1 w-full rounded-lg border p-2" value={String(form[field.key] ?? "")} onChange={e => setForm({ ...form, [field.key]: e.target.value })}>{statuses.map(s => <option key={s}>{s}</option>)}</select> : field.type === "textarea" ? <textarea className="mt-1 min-h-24 w-full rounded-lg border p-2" value={String(form[field.key] ?? "")} onChange={e => setForm({ ...form, [field.key]: e.target.value })} /> : <input required={!["category_id", "description"].includes(field.key)} type={field.type ?? "text"} className="mt-1 w-full rounded-lg border p-2" value={String(form[field.key] ?? "")} onChange={e => setForm({ ...form, [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value })} />}</label>)}
      <div className="flex gap-2 md:col-span-2"><button className="rounded-xl bg-ink px-4 py-2 text-white">ذخیره</button><button type="button" onClick={() => { setEditing(null); setForm({}); }} className="rounded-xl border px-4 py-2">انصراف</button></div>
    </form>}
    {loading ? <p className="mt-8 text-ink-soft">در حال بارگذاری…</p> : <div className="mt-8 overflow-x-auto rounded-2xl bg-surface shadow-shelf"><table className="w-full text-right text-sm"><thead><tr className="border-b">{config.columns.map(c => <th key={c} className="whitespace-nowrap p-4">{c}</th>)}<th className="p-4">عملیات</th></tr></thead><tbody>{visibleRows.map(row => <tr key={String(row.id)} className="border-b last:border-0">{config.columns.map(c => <td key={c} className="max-w-xs truncate p-4">{typeof row[c] === "boolean" ? (row[c] ? "بله" : "خیر") : String(row[c] ?? "—")}</td>)}<td className="whitespace-nowrap p-4"><button onClick={() => startEdit(row)} className="ml-3 underline">ویرایش</button>{config.deletable && <button onClick={() => void remove(row)} className="text-kiln-clay underline">حذف</button>}</td></tr>)}</tbody></table>{!visibleRows.length && <p className="p-8 text-center text-ink-soft">داده‌ای وجود ندارد.</p>}</div>}
  </main>;
}
