"use client";

import { useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import { ConfirmDialog, DataTable, DateInput, EmptyState, ErrorBanner, Field, FormActions, Modal, PageHeader, SelectInput, TextInput, TextArea, Toggle, Toolbar } from "@/components/admin/kit";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";

interface Campaign {
  id: string; name: string; slug: string; discount_type: string;
  discount_value: number; max_discount_amount: number | null;
  description: string | null; applies_to_all: boolean;
  banner_url: string | null; category_ids: string | null;
  starts_at: string | null; ends_at: string | null; is_active: boolean;
}

export default function AdminCampaignsPage() {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState<Campaign | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", discount_type: "percentage", discount_value: "",
    max_discount_amount: "", description: "", banner_url: null as string | null, applies_to_all: true, category_ids: [] as string[], starts_at: "", ends_at: "", is_active: true,
  });

  const { data: campaigns, loading, error, reload } = useAdminResource<Campaign[]>("/admin/campaigns");
  const { data: categories } = useAdminResource<Array<{ id: string; name: string }>>("/admin/categories");
  const { mutate, busy } = useAdminMutation();

  const filtered = (campaigns ?? []).filter((c) => !search || c.name.includes(search));

  const openCreate = () => { setForm({ name: "", slug: "", discount_type: "percentage", discount_value: "", max_discount_amount: "", description: "", banner_url: null, applies_to_all: true, category_ids: [], starts_at: "", ends_at: "", is_active: true }); setCreating(true); };
  const openEdit = (c: Campaign) => {
    let catIds: string[] = [];
    try { catIds = c.category_ids ? JSON.parse(c.category_ids) : []; } catch { catIds = []; }
    setForm({ name: c.name, slug: c.slug, discount_type: c.discount_type, discount_value: String(c.discount_value), max_discount_amount: c.max_discount_amount ? String(c.max_discount_amount) : "", description: c.description ?? "", banner_url: c.banner_url ?? null, applies_to_all: c.applies_to_all, category_ids: catIds, starts_at: c.starts_at ? c.starts_at.slice(0, 10) : "", ends_at: c.ends_at ? c.ends_at.slice(0, 10) : "", is_active: c.is_active }); setEditing(c);
  };

  const submit = async () => {
    const body = {
      ...form, discount_value: Number(form.discount_value),
      max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
      starts_at: form.starts_at || null, ends_at: form.ends_at || null,
      description: form.description || null,
      banner_url: form.banner_url || null,
      category_ids: form.applies_to_all ? [] : form.category_ids,
    };
    const ok = editing
      ? await mutate(`/admin/campaigns/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), successMessage: "کمپین ذخیره شد." })
      : await mutate("/admin/campaigns", { method: "POST", body: JSON.stringify(body), successMessage: "کمپین ایجاد شد." });
    if (ok) { setCreating(false); setEditing(null); void reload(); }
  };

  const softDelete = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/campaigns/${deleting.id}`, { method: "DELETE", successMessage: "کمپین حذف شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  return (
    <div>
      <PageHeader
        title="کمپین‌ها"
        description="کمپین‌های تخفیفی و تبلیغاتی"
        action={<button type="button" onClick={openCreate} className="glaze-edge min-h-[44px] rounded-xl bg-lajvard px-5 text-sm text-white transition-all hover:bg-lajvard-deep hover:shadow-lifted dark:bg-lajvard-soft dark:text-char"><Plus className="ml-1 inline h-4 w-4" /> کمپین جدید</button>}
      />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <Toolbar search={search} onSearch={setSearch} />

      {filtered.length === 0 && !loading ? (
        <EmptyState icon={<Megaphone className="h-12 w-12" />} title="هنوز کمپینی ندارید" description="کمپین‌ها امکان اعمال تخفیف روی دسته‌بندی یا کل فروشگاه را فراهم می‌کنند." action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char">+ ایجاد کمپین</button>} />
      ) : (
        <DataTable
          loading={loading}
          rows={filtered}
          empty="کمپینی یافت نشد."
          columns={[
            { key: "name", label: "نام", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "discount_type", label: "نوع", render: (r) => <span className="text-ink-soft">{r.discount_type === "percentage" ? "درصدی" : "مبلغ ثابت"}</span> },
            { key: "discount_value", label: "مقدار", render: (r) => <span className="num-latin font-bold">{r.discount_type === "percentage" ? `${r.discount_value}%` : r.discount_value.toLocaleString("fa-IR") + " تومان"}</span> },
            { key: "applies_to_all", label: "دامنه", render: (r) => <span className="text-ink-soft">{r.applies_to_all ? "کل فروشگاه" : "انتخابی"}</span> },
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

      <Modal open={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "ویرایش کمپین" : "کمپین جدید"} wide>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام کمپین" required>
              <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} required />
            </Field>
            <Field label="شناسه (slug)" required>
              <TextInput value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نوع تخفیف" required>
              <SelectInput value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                <option value="percentage">درصدی</option>
                <option value="fixed">مبلغ ثابت</option>
              </SelectInput>
            </Field>
            <Field label="مقدار تخفیف" required>
              <TextInput type="number" min={0} value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} required />
            </Field>
          </div>
          <Field label="توضیحات">
            <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </Field>
          <Field label="بنر کمپین">
            <MediaUploader value={form.banner_url} onChange={(url) => setForm({ ...form, banner_url: url })} label="بنر کمپین" aspect="wide" />
          </Field>
          <div className="glaze-edge rounded-wobble bg-slip/50 p-4 dark:bg-white/5">
            <Toggle checked={form.applies_to_all} onChange={(v) => setForm({ ...form, applies_to_all: v })} label="اعمال روی کل فروشگاه" />
            {!form.applies_to_all && (
              <Field label="دسته‌های مشمول (انتخاب چندتایی)">
                <div className="grid max-h-40 gap-1 overflow-auto rounded-xl border border-char/20 p-2 dark:border-white/15">
                  {(categories ?? []).map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-lajvard/5">
                      <input type="checkbox" checked={form.category_ids.includes(c.id)} onChange={(e) => setForm({ ...form, category_ids: e.target.checked ? [...form.category_ids, c.id] : form.category_ids.filter((id) => id !== c.id) })} className="h-4 w-4 accent-[#31547A]" />
                      <span className="text-sm">{c.name}</span>
                    </label>
                  ))}
                  {(categories ?? []).length === 0 && <span className="text-xs text-char-soft">دسته‌ای یافت نشد</span>}
                </div>
              </Field>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="تاریخ شروع">
              <DateInput value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </Field>
            <Field label="تاریخ پایان">
              <DateInput value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </Field>
          </div>
          <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="فعال باشد" />
          <FormActions onCancel={() => { setCreating(false); setEditing(null); }} busy={busy} />
        </form>
      </Modal>

      <ConfirmDialog open={deleting !== null} message={`کمپین «${deleting?.name}» حذف شود؟`} onConfirm={() => void softDelete()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[\s\u200c]+/g, "-").replace(/[^\p{L}\p{N}-]+/gu, "").replace(/-+/g, "-");
}
