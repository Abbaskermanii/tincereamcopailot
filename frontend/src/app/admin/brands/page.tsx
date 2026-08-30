"use client";

import { useState } from "react";
import { Tags, Plus } from "lucide-react";
import { ConfirmDialog, DataTable, EmptyState, ErrorBanner, Field, FormActions, Modal, PageHeader, TextInput, TextArea, Toolbar } from "@/components/admin/kit";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";
import Image from "next/image";
import { mediaUrl } from "@/lib/api";

interface Brand {
  id: string; name: string; slug: string; description: string | null;
  logo_url: string | null; is_active: boolean;
}

export default function AdminBrandsPage() {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", logo_url: "" as string | null });

  const { data: brands, loading, error, reload } = useAdminResource<Brand[]>("/admin/brands");
  const { mutate, busy } = useAdminMutation();

  const filtered = (brands ?? []).filter((b) => !search || b.name.includes(search) || b.slug.includes(search));

  const openCreate = () => { setForm({ name: "", slug: "", description: "", logo_url: "" }); setCreating(true); };
  const openEdit = (b: Brand) => { setForm({ name: b.name, slug: b.slug, description: b.description ?? "", logo_url: b.logo_url ?? "" }); setEditing(b); };

  const submit = async () => {
    const ok = editing
      ? await mutate(`/admin/brands/${editing.id}`, { method: "PATCH", body: JSON.stringify(form), successMessage: "برند ذخیره شد." })
      : await mutate("/admin/brands", { method: "POST", body: JSON.stringify(form), successMessage: "برند ایجاد شد." });
    if (ok) { setCreating(false); setEditing(null); void reload(); }
  };

  const softDelete = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/brands/${deleting.id}`, { method: "DELETE", successMessage: "برند حذف شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  return (
    <div>
      <PageHeader
        title="برندها"
        description={`${filtered.length} برند`}
        action={<button type="button" onClick={openCreate} className="glaze-edge min-h-[44px] rounded-xl bg-lajvard px-5 text-sm text-white transition-all hover:bg-lajvard-deep hover:shadow-lifted dark:bg-lajvard-soft dark:text-char"><Plus className="ml-1 inline h-4 w-4" /> برند جدید</button>}
      />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <Toolbar search={search} onSearch={setSearch} />

      {filtered.length === 0 && !loading ? (
        <EmptyState icon={<Tags className="h-12 w-12" />} title="هنوز برندی ندارید" description="برندها به مشتریان کمک می‌کنند محصولات مورد نظرشان را سریع‌تر پیدا کنند." action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char">+ ایجاد اولین برند</button>} />
      ) : (
        <DataTable
          loading={loading}
          rows={filtered}
          empty="برندی یافت نشد."
          columns={[
            { key: "logo", label: "لوگو", render: (r: Brand) => r.logo_url ? <Image src={mediaUrl(r.logo_url)} alt={r.name} width={40} height={40} unoptimized className="h-10 w-10 rounded-xl object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slip text-xs text-char-soft">—</span> },
            { key: "name", label: "نام", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "slug", label: "شناسه", render: (r) => <span className="text-ink-soft">{r.slug}</span> },
            { key: "description", label: "توضیحات", render: (r) => <span className="line-clamp-1 text-ink-soft">{r.description ?? "—"}</span> },
            { key: "is_active", label: "وضعیت", render: (r) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.is_active ? "bg-firouzeh/20 text-firouzeh" : "bg-char/10 text-char-soft dark:bg-white/10 dark:text-ink-soft"}`}>{r.is_active ? "فعال" : "غیرفعال"}</span> },
          ]}
          actions={(r) => (
            <div className="flex gap-1">
              <button type="button" onClick={() => openEdit(r)} className="glaze-edge min-h-[36px] rounded-lg border border-char/20 px-3 py-1.5 text-sm transition-all hover:shadow-shelf dark:border-white/20">ویرایش</button>
              <button type="button" onClick={() => setDeleting(r)} className="min-h-[36px] rounded-lg px-3 py-1.5 text-sm text-clay transition-colors hover:bg-clay/10">حذف</button>
            </div>
          )}
        />
      )}

      <Modal open={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "ویرایش برند" : "برند جدید"} wide>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام برند" required>
              <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} required />
            </Field>
            <Field label="شناسه (slug)" required>
              <TextInput value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </Field>
          </div>
          <Field label="لوگوی برند">
            <MediaUploader value={form.logo_url ?? null} onChange={(url) => setForm({ ...form, logo_url: url ?? "" })} label="لوگوی برند" aspect="square" />
          </Field>
          <Field label="توضیحات">
            <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </Field>
          <FormActions onCancel={() => { setCreating(false); setEditing(null); }} busy={busy} />
        </form>
      </Modal>

      <ConfirmDialog open={deleting !== null} message={`برند «${deleting?.name}» حذف شود؟`} onConfirm={() => void softDelete()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[\s\u200c]+/g, "-").replace(/[^\p{L}\p{N}-]+/gu, "").replace(/-+/g, "-");
}
