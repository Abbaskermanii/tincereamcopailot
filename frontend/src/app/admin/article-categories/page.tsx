"use client";

import { useState } from "react";
import { FolderTree, Plus } from "lucide-react";
import { ConfirmDialog, DataTable, EmptyState, Field, FormActions, Modal, PageHeader, TextInput, Toolbar } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";

interface ArticleCategory {
  id: string; name: string; slug: string; description: string | null;
}

export default function AdminArticleCategoriesPage() {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ArticleCategory | null>(null);
  const [deleting, setDeleting] = useState<ArticleCategory | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const { data: categories, loading, reload } = useAdminResource<ArticleCategory[]>("/admin/article-categories");
  const { mutate, busy } = useAdminMutation();

  const filtered = (categories ?? []).filter((c) => !search || c.name.includes(search) || c.slug.includes(search));

  const openCreate = () => { setForm({ name: "", slug: "", description: "" }); setCreating(true); };
  const openEdit = (c: ArticleCategory) => { setForm({ name: c.name, slug: c.slug, description: c.description ?? "" }); setEditing(c); };

  const submit = async () => {
    const ok = editing
      ? await mutate(`/admin/article-categories/${editing.id}`, { method: "PATCH", body: JSON.stringify(form), successMessage: "دسته ذخیره شد." })
      : await mutate("/admin/article-categories", { method: "POST", body: JSON.stringify(form), successMessage: "دسته ایجاد شد." });
    if (ok) { setCreating(false); setEditing(null); void reload(); }
  };

  const softDelete = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/article-categories/${deleting.id}`, { method: "DELETE", successMessage: "دسته حذف شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  return (
    <div>
      <PageHeader
        title="دسته‌بندی مقالات"
        description={`${filtered.length} دسته`}
        action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char"><Plus className="ml-1 inline h-4 w-4" /> دسته جدید</button>}
      />

      <Toolbar search={search} onSearch={setSearch} />

      {filtered.length === 0 && !loading ? (
        <EmptyState icon={<FolderTree className="h-12 w-12" />} title="هنوز دسته‌بندی ندارید" action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char">+ ایجاد دسته</button>} />
      ) : (
        <DataTable
          loading={loading}
          rows={filtered}
          empty="دسته‌ای یافت نشد."
          columns={[
            { key: "name", label: "نام", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "slug", label: "شناسه", render: (r) => <span className="text-ink-soft">{r.slug}</span> },
            { key: "description", label: "توضیحات", render: (r) => <span className="line-clamp-1 text-ink-soft">{r.description ?? "—"}</span> },
          ]}
          actions={(r) => (
            <>
              <button type="button" onClick={() => openEdit(r)} className="min-h-[36px] rounded-lg border border-char/20 px-3 py-1.5 text-sm dark:border-white/20">ویرایش</button>
              <button type="button" onClick={() => setDeleting(r)} className="min-h-[36px] rounded-lg px-3 py-1.5 text-sm text-clay hover:bg-clay/10">حذف</button>
            </>
          )}
        />
      )}

      <Modal open={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "ویرایش دسته" : "دسته جدید"}>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
          <Field label="نام" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} required />
          </Field>
          <Field label="شناسه (slug)" required>
            <TextInput value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          </Field>
          <Field label="توضیحات">
            <TextInput value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <FormActions onCancel={() => { setCreating(false); setEditing(null); }} busy={busy} />
        </form>
      </Modal>

      <ConfirmDialog open={deleting !== null} message={`دسته «${deleting?.name}» حذف شود؟`} onConfirm={() => void softDelete()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[\s\u200c]+/g, "-").replace(/[^\p{L}\p{N}-]+/gu, "").replace(/-+/g, "-");
}
