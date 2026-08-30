"use client";

import { useState } from "react";
import { ImageIcon, Plus } from "lucide-react";
import { ConfirmDialog, DataTable, EmptyState, Field, FormActions, Modal, PageHeader, TextInput, Toggle, Toolbar } from "@/components/admin/kit";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";

interface Carousel {
  id: string; title: string; subtitle: string | null;
  image_url: string; link_url: string | null;
  sort_order: number; is_active: boolean;
}

export default function AdminCarouselsPage() {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Carousel | null>(null);
  const [deleting, setDeleting] = useState<Carousel | null>(null);
  const [form, setForm] = useState({ title: "", subtitle: "", image_url: "", link_url: "", sort_order: 0, is_active: true });

  const { data: items, loading, reload } = useAdminResource<Carousel[]>("/admin/carousels");
  const { mutate, busy } = useAdminMutation();

  const filtered = (items ?? []).filter((c) => !search || c.title.includes(search));

  const openCreate = () => { setForm({ title: "", subtitle: "", image_url: "", link_url: "", sort_order: 0, is_active: true }); setCreating(true); };
  const openEdit = (c: Carousel) => { setForm({ title: c.title, subtitle: c.subtitle ?? "", image_url: c.image_url, link_url: c.link_url ?? "", sort_order: c.sort_order, is_active: c.is_active }); setEditing(c); };

  const submit = async () => {
    const body = { ...form, subtitle: form.subtitle || null, link_url: form.link_url || null };
    const ok = editing
      ? await mutate(`/admin/carousels/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), successMessage: "بنر ذخیره شد." })
      : await mutate("/admin/carousels", { method: "POST", body: JSON.stringify(body), successMessage: "بنر ایجاد شد." });
    if (ok) { setCreating(false); setEditing(null); void reload(); }
  };

  const softDelete = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/carousels/${deleting.id}`, { method: "DELETE", successMessage: "بنر حذف شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  return (
    <div>
      <PageHeader
        title="بنرهای اسلایدری"
        description="اسلایدر صفحهٔ اصلی"
        action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char"><Plus className="ml-1 inline h-4 w-4" /> بنر جدید</button>}
      />

      <Toolbar search={search} onSearch={setSearch} />

      {filtered.length === 0 && !loading ? (
        <EmptyState icon={<ImageIcon className="h-12 w-12" />} title="هنوز بنری ندارید" description="اسلایدرها به صفحهٔ اصلی جلوهٔ بصری می‌دهند." action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char">+ ایجاد اولین بنر</button>} />
      ) : (
        <DataTable
          loading={loading}
          rows={filtered}
          empty="بنری یافت نشد."
          columns={[
            { key: "title", label: "عنوان", render: (r) => <span className="font-medium">{r.title}</span> },
            { key: "subtitle", label: "زیرعنوان", render: (r) => <span className="text-ink-soft">{r.subtitle ?? "—"}</span> },
            { key: "sort_order", label: "ترتیب", render: (r) => <span className="num-latin text-ink-soft">{r.sort_order}</span> },
            { key: "is_active", label: "وضعیت", render: (r) => <span className={r.is_active ? "text-firouzeh" : "text-clay"}>{r.is_active ? "فعال" : "غیرفعال"}</span> },
          ]}
          actions={(r) => (
            <>
              <button type="button" onClick={() => openEdit(r)} className="min-h-[36px] rounded-lg border border-char/20 px-3 py-1.5 text-sm dark:border-white/20">ویرایش</button>
              <button type="button" onClick={() => setDeleting(r)} className="min-h-[36px] rounded-lg px-3 py-1.5 text-sm text-clay hover:bg-clay/10">حذف</button>
            </>
          )}
        />
      )}

      <Modal open={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "ویرایش بنر" : "بنر جدید"} wide>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عنوان" required>
              <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>
            <Field label="زیرعنوان">
              <TextInput value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </Field>
          </div>
          <Field label="تصویر بنر" required>
            <MediaUploader value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url ?? "" })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="لینک (اختیاری)">
              <TextInput value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/shop" />
            </Field>
            <Field label="ترتیب نمایش">
              <TextInput type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </Field>
          </div>
          <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="فعال باشد" />
          <FormActions onCancel={() => { setCreating(false); setEditing(null); }} busy={busy} />
        </form>
      </Modal>

      <ConfirmDialog open={deleting !== null} message={`بنر «${deleting?.title}» حذف شود؟`} onConfirm={() => void softDelete()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}
