"use client";

import { useState } from "react";
import { FolderTree, Plus } from "lucide-react";
import { ConfirmDialog, DataTable, EmptyState, ErrorBanner, Modal, PageHeader, TextInput, TextArea, Field, FormActions, Toolbar } from "@/components/admin/kit";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";
import { mediaUrl } from "@/lib/api";

interface Category {
  id: string; name: string; slug: string; description: string | null;
  image_url: string | null; parent_id: string | null;
  product_count: number; is_active: boolean; sort_order: number;
}

interface CategoryForm {
  name: string; slug: string; description: string; parent_id: string; image_url: string | null;
}

export default function AdminCategoriesPage() {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>({ name: "", slug: "", description: "", parent_id: "", image_url: null });

  const { data: categories, loading, error, reload } = useAdminResource<Category[]>("/admin/categories");
  const { mutate, busy } = useAdminMutation();

  const filtered = (categories ?? []).filter((c) =>
    !search || c.name.includes(search) || c.slug.includes(search)
  );

  const topLevel = filtered.filter((c) => !c.parent_id);
  const childrenMap = new Map<string, Category[]>();
  filtered.filter((c) => c.parent_id).forEach((c) => {
    const list = childrenMap.get(c.parent_id!) ?? [];
    list.push(c);
    childrenMap.set(c.parent_id!, list);
  });

  const openCreate = () => { setForm({ name: "", slug: "", description: "", parent_id: "", image_url: null }); setCreating(true); };
  const openEdit = (c: Category) => { setForm({ name: c.name, slug: c.slug, description: c.description ?? "", parent_id: c.parent_id ?? "", image_url: c.image_url }); setEditing(c); };

  const submit = async () => {
    const body = { ...form, parent_id: form.parent_id || null };
    const ok = editing
      ? await mutate(`/admin/categories/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), successMessage: "دسته‌بندی ذخیره شد." })
      : await mutate("/admin/categories", { method: "POST", body: JSON.stringify(body), successMessage: "دسته‌بندی ایجاد شد." });
    if (ok) { setCreating(false); setEditing(null); void reload(); }
  };

  const softDelete = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/categories/${deleting.id}`, { method: "DELETE", successMessage: "دسته‌بندی غیرفعال شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  const toggleActive = async (c: Category) => {
    await mutate(`/admin/categories/${c.id}`, { method: "PATCH", body: JSON.stringify({ is_active: !c.is_active }) });
    void reload();
  };

  const allRows = [...topLevel];
  topLevel.forEach((p) => { const ch = childrenMap.get(p.id); if (ch) allRows.push(...ch); });

  const columns = [
    {
      key: "image", label: "تصویر", render: (r: Category) => (
        r.image_url ? <img src={mediaUrl(r.image_url)} alt={r.name} className="h-10 w-10 rounded-xl object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slip text-xs text-char-soft">—</span>
      ),
    },
    {
      key: "name", label: "نام", render: (r: Category) => (
        <span className={r.parent_id ? "mr-6 text-sm text-char-soft" : "font-medium"}>
          {r.parent_id ? "└ " : ""}{r.name}
        </span>
      ),
    },
    { key: "slug", label: "شناسه", render: (r: Category) => <span className="text-ink-soft">{r.slug}</span> },
    { key: "product_count", label: "محصولات", render: (r: Category) => <span className="num-latin">{r.product_count}</span> },
    {
      key: "is_active", label: "وضعیت", render: (r: Category) => (
        <button type="button" onClick={() => void toggleActive(r)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${r.is_active ? "bg-firouzeh/20 text-firouzeh" : "bg-char/10 text-char-soft dark:bg-white/10 dark:text-ink-soft"}`}>
          {r.is_active ? "فعال" : "غیرفعال"}
        </button>
      ),
    },
    {
      key: "sort_order", label: "ترتیب", render: (r: Category) => (
        <span className="num-latin text-ink-soft">{r.sort_order}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="دسته‌بندی‌ها"
        description={`${filtered.length} دسته‌بندی`}
        action={<button type="button" onClick={openCreate} className="glaze-edge min-h-[44px] rounded-xl bg-lajvard px-5 text-sm text-white transition-all hover:bg-lajvard-deep hover:shadow-lifted dark:bg-lajvard-soft dark:text-char"><Plus className="ml-1 inline h-4 w-4" /> دسته جدید</button>}
      />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <Toolbar search={search} onSearch={setSearch} />

      {filtered.length === 0 && !loading ? (
        <EmptyState
          icon={<FolderTree className="h-12 w-12" />}
          title="هنوز دسته‌بندی‌ای ندارید"
          description="دسته‌بندی‌ها به شما کمک می‌کنند محصولات را سازمان‌دهی کنید."
          action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char">+ ایجاد اولین دسته</button>}
        />
      ) : (
        <DataTable
          loading={loading}
          rows={allRows}
          empty="دسته‌بندی یافت نشد."
          columns={columns}
          actions={(r) => (
            <div className="flex gap-1">
              <button type="button" onClick={() => openEdit(r)} className="glaze-edge min-h-[36px] rounded-lg border border-char/20 px-3 py-1.5 text-sm transition-all hover:shadow-shelf dark:border-white/20">ویرایش</button>
              <button type="button" onClick={() => setDeleting(r)} className="min-h-[36px] rounded-lg px-3 py-1.5 text-sm text-clay transition-colors hover:bg-clay/10">حذف</button>
            </div>
          )}
        />
      )}

      <Modal open={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"} wide>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام" required>
              <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} required />
            </Field>
            <Field label="شناسه (slug)" required>
              <TextInput value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </Field>
          </div>
          <Field label="دسته والد">
            <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="w-full min-h-[44px] rounded-xl border border-char/20 bg-surface px-3 py-2.5 text-sm outline-none dark:border-white/20 dark:bg-black/25">
              <option value="">— بدون والد (سطح بالا) —</option>
              {(categories ?? []).filter((c) => c.id !== editing?.id).map((c) => (
                <option key={c.id} value={c.id}>{c.parent_id ? `└ ${c.name}` : c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="تصویر دسته">
            <MediaUploader value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="تصویر دسته" aspect="wide" />
          </Field>
          <Field label="توضیحات">
            <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </Field>
          <FormActions onCancel={() => { setCreating(false); setEditing(null); }} busy={busy} />
        </form>
      </Modal>

      <ConfirmDialog open={deleting !== null} message={`دسته‌بندی «${deleting?.name}» غیرفعال شود؟`} onConfirm={() => void softDelete()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[\s\u200c]+/g, "-").replace(/[^\p{L}\p{N}-]+/gu, "").replace(/-+/g, "-");
}
