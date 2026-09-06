"use client";

import { useState } from "react";
import { ScrollText, Plus } from "lucide-react";
import { ConfirmDialog, DataTable, DateInput, EmptyState, Field, FormActions, Modal, PageHeader, Pagination, TextInput, TextArea, Toolbar } from "@/components/admin/kit";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";
import { toPersianDigits } from "@/lib/format";
import { mediaUrl } from "@/lib/api";

interface Article {
  id: string; title: string; slug: string; excerpt: string | null;
  body: string; published_at: string | null; is_published: boolean;
  meta_title: string | null; meta_description: string | null; tags?: string[] | null;
  cover_url: string | null; category_id: string | null; category_name?: string | null;
}

interface ArticleForm {
  title: string; slug: string; excerpt: string; body: string;
  published_at: string; is_published: boolean;
  meta_title: string; meta_description: string; tags: string;
  cover_url: string | null; category_id: string;
}

export default function AdminArticlesPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "draft" | "published">("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState<Article | null>(null);
  const [form, setForm] = useState<ArticleForm>({ title: "", slug: "", excerpt: "", body: "", published_at: "", is_published: false, meta_title: "", meta_description: "", tags: "", cover_url: null, category_id: "" });

  const { data: articles, loading, reload } = useAdminResource<Article[]>("/admin/articles");
  const { data: articleCategories } = useAdminResource<Array<{ id: string; name: string; slug: string }>>("/admin/article-categories");
  const { mutate, busy } = useAdminMutation();

  const filtered = (articles ?? []).filter((a) => {
    if (tab === "draft" && a.is_published) return false;
    if (tab === "published" && !a.is_published) return false;
    if (search && !a.title.includes(search) && !a.slug.includes(search)) return false;
    return true;
  });

  const openCreate = () => { setForm({ title: "", slug: "", excerpt: "", body: "", published_at: "", is_published: false, meta_title: "", meta_description: "", tags: "", cover_url: null, category_id: "" }); setCreating(true); };
  const openEdit = (a: Article) => { setForm({ title: a.title, slug: a.slug, excerpt: a.excerpt ?? "", body: a.body, published_at: a.published_at ? a.published_at.slice(0, 10) : "", is_published: a.is_published, meta_title: a.meta_title ?? "", meta_description: a.meta_description ?? "", tags: (a.tags ?? []).join("، "), cover_url: a.cover_url ?? null, category_id: a.category_id ?? "" }); setEditing(a); };

  const submit = async () => {
    const body = { ...form, published_at: form.published_at || null, cover_url: form.cover_url || null, category_id: form.category_id || null };
    const ok = editing
      ? await mutate(`/admin/articles/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), successMessage: "مقاله ذخیره شد." })
      : await mutate("/admin/articles", { method: "POST", body: JSON.stringify(body), successMessage: "مقاله ایجاد شد." });
    if (ok) { setCreating(false); setEditing(null); void reload(); }
  };

  const softDelete = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/articles/${deleting.id}`, { method: "DELETE", successMessage: "مقاله حذف شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  return (
    <div>
      <PageHeader
        title="مقالات"
        description={`${filtered.length} مقاله`}
        action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char"><Plus className="ml-1 inline h-4 w-4" /> مقاله جدید</button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {(["all", "draft", "published"] as const).map((t) => {
          const labels = { all: "همه", draft: "پیش‌نویس", published: "منتشرشده" };
          const count = t === "all" ? (articles?.length ?? 0) : (articles ?? []).filter((a) => t === "draft" ? !a.is_published : a.is_published).length;
          return (
            <button key={t} type="button" onClick={() => setTab(t)} className={`min-h-[36px] rounded-lg px-3 text-sm ${tab === t ? "bg-lajvard text-white dark:bg-lajvard-soft dark:text-char" : "bg-char/5 text-ink-soft hover:bg-char/10 dark:bg-white/10"}`}>
              {labels[t]} ({count})
            </button>
          );
        })}
        <div className="mr-auto">
          <Toolbar search={search} onSearch={setSearch} />
        </div>
      </div>

      {filtered.length === 0 && !loading ? (
        <EmptyState icon={<ScrollText className="h-12 w-12" />} title="هنوز مقاله‌ای ندارید" description="مقالات به سئو و جذب مشتری کمک می‌کنند." action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char">+ نوشتن اولین مقاله</button>} />
      ) : (
        <DataTable
          loading={loading}
          rows={filtered}
          empty="مقاله‌ای یافت نشد."
          columns={[
            { key: "cover", label: "کاور", render: (r: Article) => r.cover_url ? <img src={mediaUrl(r.cover_url)} alt={r.title} className="h-10 w-14 rounded-lg object-cover" /> : <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-slip text-xs text-char-soft">—</span> },
            { key: "title", label: "عنوان", render: (r) => <span className="font-medium">{r.title}</span> },
            { key: "category", label: "دسته", render: (r: Article) => <span className="text-xs text-ink-soft">{r.category_name ?? "—"}</span> },
            { key: "slug", label: "شناسه", render: (r) => <span className="text-ink-soft">{r.slug}</span> },
            { key: "published_at", label: "تاریخ انتشار", render: (r) => r.published_at ? <span className="num-latin text-ink-soft">{toPersianDigits(r.published_at.slice(0, 10))}</span> : <span className="text-clay">پیش‌نویس</span> },
            { key: "is_published", label: "وضعیت", render: (r) => <span className={r.is_published ? "text-firouzeh" : "text-clay"}>{r.is_published ? "منتشرشده" : "پیش‌نویس"}</span> },
          ]}
          actions={(r) => (
            <>
              <button type="button" onClick={() => openEdit(r)} className="min-h-[36px] rounded-lg border border-char/20 px-3 py-1.5 text-sm dark:border-white/20">ویرایش</button>
              <button type="button" onClick={() => setDeleting(r)} className="min-h-[36px] rounded-lg px-3 py-1.5 text-sm text-clay hover:bg-clay/10">حذف</button>
            </>
          )}
        />
      )}

      <Pagination page={1} pages={1} onPage={() => {}} />

      <Modal open={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "ویرایش مقاله" : "مقاله جدید"} wide>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عنوان" required>
              <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} required />
            </Field>
            <Field label="شناسه (slug)" required>
              <TextInput value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="دسته مقاله">
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full min-h-[44px] rounded-xl border border-char/20 bg-surface px-3 py-2.5 text-sm outline-none dark:border-white/20 dark:bg-black/25">
                <option value="">— بدون دسته —</option>
                {(articleCategories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="تصویر کاور">
              <MediaUploader value={form.cover_url} onChange={(url) => setForm({ ...form, cover_url: url })} label="تصویر کاور" aspect="wide" />
            </Field>
          </div>
          <Field label="خلاصه">
            <TextArea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
          </Field>
          <RichTextEditor initialValue={form.body} onChange={(value) => setForm({ ...form, body: value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="تاریخ انتشار">
              <DateInput value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} />
            </Field>
            <div className="flex items-end">
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="h-4 w-4 rounded" />
                منتشر شود
              </label>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عنوان SEO">
              <TextInput value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} placeholder="خالی = عنوان مقاله" />
            </Field>
            <Field label="توضیحات SEO">
              <TextInput value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} placeholder="خالی = خلاصه مقاله" />
            </Field>
          </div>
          <Field label="برچسب‌ها" hint="با ویرگول جدا کنید — برای سئو و صفحهٔ مقاله">
            <TextInput value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="لقاب دست‌ساز، ماگ، کرج" />
          </Field>
          <FormActions onCancel={() => { setCreating(false); setEditing(null); }} busy={busy} />
        </form>
      </Modal>

      <ConfirmDialog open={deleting !== null} message={`مقاله «${deleting?.title}» حذف شود؟`} onConfirm={() => void softDelete()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[\s\u200c]+/g, "-").replace(/[^\p{L}\p{N}-]+/gu, "").replace(/-+/g, "-");
}
