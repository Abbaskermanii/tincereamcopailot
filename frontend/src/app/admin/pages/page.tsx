"use client";

import { useState } from "react";
import { ScrollText, Plus } from "lucide-react";
import { ConfirmDialog, DataTable, EmptyState, Field, FormActions, Modal, PageHeader, TextInput, TextArea, Toggle, Toolbar } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";

interface StaticPage {
  id: string; title: string; slug: string; content: string;
  meta_title: string | null; meta_description: string | null;
  is_published: boolean; sort_order: number;
}

export default function AdminPagesPage() {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<StaticPage | null>(null);
  const [deleting, setDeleting] = useState<StaticPage | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", content: "", meta_title: "", meta_description: "", is_published: false, sort_order: 0 });

  const { data: pages, loading, reload } = useAdminResource<StaticPage[]>("/admin/pages");
  const { mutate, busy } = useAdminMutation();

  const filtered = (pages ?? []).filter((p) => !search || p.title.includes(search) || p.slug.includes(search));

  const openCreate = () => { setForm({ title: "", slug: "", content: "", meta_title: "", meta_description: "", is_published: false, sort_order: 0 }); setCreating(true); };
  const openEdit = (p: StaticPage) => { setForm({ title: p.title, slug: p.slug, content: p.content, meta_title: p.meta_title ?? "", meta_description: p.meta_description ?? "", is_published: p.is_published, sort_order: p.sort_order }); setEditing(p); };

  const submit = async () => {
    const ok = editing
      ? await mutate(`/admin/pages/${editing.id}`, { method: "PATCH", body: JSON.stringify(form), successMessage: "صفحه ذخیره شد." })
      : await mutate("/admin/pages", { method: "POST", body: JSON.stringify(form), successMessage: "صفحه ایجاد شد." });
    if (ok) { setCreating(false); setEditing(null); void reload(); }
  };

  const softDelete = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/pages/${deleting.id}`, { method: "DELETE", successMessage: "صفحه حذف شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  return (
    <div>
      <PageHeader
        title="صفحات"
        description="صفحات ثابت (درباره ما، شرایط و قوانین و ...)"
        action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char"><Plus className="ml-1 inline h-4 w-4" /> صفحه جدید</button>}
      />

      <Toolbar search={search} onSearch={setSearch} />

      {filtered.length === 0 && !loading ? (
        <EmptyState icon={<ScrollText className="h-12 w-12" />} title="هنوز صفحه‌ای ندارید" action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char">+ ایجاد صفحه</button>} />
      ) : (
        <DataTable
          loading={loading}
          rows={filtered}
          empty="صفحه‌ای یافت نشد."
          columns={[
            { key: "title", label: "عنوان", render: (r) => <span className="font-medium">{r.title}</span> },
            { key: "slug", label: "شناسه", render: (r) => <span className="text-ink-soft">/{r.slug}</span> },
            { key: "sort_order", label: "ترتیب", render: (r) => <span className="num-latin text-ink-soft">{r.sort_order}</span> },
            { key: "is_published", label: "وضعیت", render: (r) => <span className={r.is_published ? "text-firouzeh" : "text-clay"}>{r.is_published ? "منتشر" : "پیش‌نویس"}</span> },
          ]}
          actions={(r) => (
            <>
              <button type="button" onClick={() => openEdit(r)} className="min-h-[36px] rounded-lg border border-char/20 px-3 py-1.5 text-sm dark:border-white/20">ویرایش</button>
              <button type="button" onClick={() => setDeleting(r)} className="min-h-[36px] rounded-lg px-3 py-1.5 text-sm text-clay hover:bg-clay/10">حذف</button>
            </>
          )}
        />
      )}

      <Modal open={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "ویرایش صفحه" : "صفحه جدید"} wide>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عنوان" required>
              <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} required />
            </Field>
            <Field label="شناسه (slug)" required>
              <TextInput value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </Field>
          </div>
          <Field label="محتوا" required>
            <TextArea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12} className="min-h-48" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عنوان SEO">
              <TextInput value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} />
            </Field>
            <Field label="توضیحات SEO">
              <TextInput value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ترتیب نمایش">
              <TextInput type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </Field>
            <div className="flex items-end">
              <Toggle checked={form.is_published} onChange={(v) => setForm({ ...form, is_published: v })} label="منتشر شود" />
            </div>
          </div>
          <FormActions onCancel={() => { setCreating(false); setEditing(null); }} busy={busy} />
        </form>
      </Modal>

      <ConfirmDialog open={deleting !== null} message={`صفحه «${deleting?.title}» حذف شود؟`} onConfirm={() => void softDelete()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[\s\u200c]+/g, "-").replace(/[^\p{L}\p{N}-]+/gu, "").replace(/-+/g, "-");
}
