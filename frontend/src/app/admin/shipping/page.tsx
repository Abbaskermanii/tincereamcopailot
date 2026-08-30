"use client";

import { useState } from "react";
import { Truck, Plus } from "lucide-react";
import { ConfirmDialog, DataTable, EmptyState, Field, FormActions, Modal, PageHeader, TextInput, Toggle } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";
import { faNum, faPrice } from "@/lib/format";

interface ShippingMethod {
  id: string; name: string; code: string; cost: number;
  free_over_amount: number | null;
  estimated_days_min: number; estimated_days_max: number;
  is_active: boolean; sort_order: number;
}

export default function AdminShippingPage() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ShippingMethod | null>(null);
  const [deleting, setDeleting] = useState<ShippingMethod | null>(null);
  const [form, setForm] = useState({ name: "", code: "", cost: "", free_over_amount: "", estimated_days_min: "2", estimated_days_max: "5", is_active: true, sort_order: "0" });

  const { data: methods, loading, reload } = useAdminResource<ShippingMethod[]>("/admin/shipping-methods");
  const { mutate, busy } = useAdminMutation();

  const openCreate = () => { setForm({ name: "", code: "", cost: "", free_over_amount: "", estimated_days_min: "2", estimated_days_max: "5", is_active: true, sort_order: "0" }); setCreating(true); };
  const openEdit = (m: ShippingMethod) => { setForm({ name: m.name, code: m.code, cost: String(m.cost), free_over_amount: m.free_over_amount ? String(m.free_over_amount) : "", estimated_days_min: String(m.estimated_days_min), estimated_days_max: String(m.estimated_days_max), is_active: m.is_active, sort_order: String(m.sort_order) }); setEditing(m); };

  const submit = async () => {
    const body = {
      ...form, cost: Number(form.cost),
      free_over_amount: form.free_over_amount ? Number(form.free_over_amount) : null,
      estimated_days_min: Number(form.estimated_days_min),
      estimated_days_max: Number(form.estimated_days_max),
      sort_order: Number(form.sort_order),
    };
    const ok = editing
      ? await mutate(`/admin/shipping-methods/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), successMessage: "روش ارسال ذخیره شد." })
      : await mutate("/admin/shipping-methods", { method: "POST", body: JSON.stringify(body), successMessage: "روش ارسال ایجاد شد." });
    if (ok) { setCreating(false); setEditing(null); void reload(); }
  };

  const softDelete = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/shipping-methods/${deleting.id}`, { method: "DELETE", successMessage: "روش ارسال حذف شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  return (
    <div>
      <PageHeader
        title="روش‌های ارسال"
        description="روش‌های ارسال و حمل‌ونقل"
        action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char"><Plus className="ml-1 inline h-4 w-4" /> روش جدید</button>}
      />

      {(!methods?.length && !loading) ? (
        <EmptyState icon={<Truck className="h-12 w-12" />} title="هنوز روش ارسالی ندارید" action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char">+ ایجاد روش ارسال</button>} />
      ) : (
        <DataTable
          loading={loading}
          rows={methods ?? []}
          empty="روشی یافت نشد."
          columns={[
            { key: "name", label: "نام", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "code", label: "کد", render: (r) => <span className="num-latin text-ink-soft">{r.code}</span> },
            { key: "cost", label: "هزینه", render: (r) => r.cost === 0 ? <span className="text-firouzeh">رایگان</span> : <span className="num-latin">{faPrice(r.cost)}</span> },
            { key: "free_over_amount", label: "ارسال رایگان از", render: (r) => r.free_over_amount ? <span className="num-latin">{faPrice(r.free_over_amount)}</span> : <span className="text-ink-soft">—</span> },
            { key: "estimated_days_min", label: "زمان تقریبی", render: (r) => <span className="num-latin">{faNum(r.estimated_days_min)} تا {faNum(r.estimated_days_max)} روز</span> },
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

      <Modal open={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "ویرایش روش ارسال" : "روش ارسال جدید"} wide>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام" required>
              <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="کد" required>
              <TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required className="num-latin" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="هزینه (تومان)">
              <TextInput type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </Field>
            <Field label="ارسال رایگان از (تومان)">
              <TextInput type="number" min={0} value={form.free_over_amount} onChange={(e) => setForm({ ...form, free_over_amount: e.target.value })} placeholder="بدون محدودیت" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="حداقل روز ارسال">
              <TextInput type="number" min={1} value={form.estimated_days_min} onChange={(e) => setForm({ ...form, estimated_days_min: e.target.value })} />
            </Field>
            <Field label="حداکثر روز ارسال">
              <TextInput type="number" min={1} value={form.estimated_days_max} onChange={(e) => setForm({ ...form, estimated_days_max: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ترتیب نمایش">
              <TextInput type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            </Field>
            <div className="flex items-end">
              <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="فعال باشد" />
            </div>
          </div>
          <FormActions onCancel={() => { setCreating(false); setEditing(null); }} busy={busy} />
        </form>
      </Modal>

      <ConfirmDialog open={deleting !== null} message={`روش «${deleting?.name}» حذف شود؟`} onConfirm={() => void softDelete()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}
