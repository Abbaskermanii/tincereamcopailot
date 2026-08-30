"use client";

import { useState } from "react";
import { Ticket, Plus } from "lucide-react";
import { ConfirmDialog, DataTable, DateInput, EmptyState, ErrorBanner, Field, FormActions, Modal, PageHeader, SelectInput, TextInput, Toolbar } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";
import { faNum, faPrice } from "@/lib/format";

interface Coupon {
  id: string; code: string; discount_type: string; discount_value: number;
  max_discount_amount: number | null; min_order_amount: number | null;
  max_uses: number | null; used_count: number;
  expires_at: string | null; is_active: boolean;
}

export default function AdminCouponsPage() {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: "", discount_type: "percentage", discount_value: "",
    max_discount_amount: "", min_order_amount: "", max_uses: "",
    expires_at: "", is_active: true,
  });

  const { data: coupons, loading, error, reload } = useAdminResource<Coupon[]>("/admin/coupons");
  const { mutate, busy } = useAdminMutation();

  const filtered = (coupons ?? []).filter((c) => !search || c.code.includes(search));

  const openCreate = () => { setForm({ code: "", discount_type: "percentage", discount_value: "", max_discount_amount: "", min_order_amount: "", max_uses: "", expires_at: "", is_active: true }); setCreating(true); };
  const openEdit = (c: Coupon) => { setForm({ code: c.code, discount_type: c.discount_type, discount_value: String(c.discount_value), max_discount_amount: c.max_discount_amount ? String(c.max_discount_amount) : "", min_order_amount: c.min_order_amount ? String(c.min_order_amount) : "", max_uses: c.max_uses ? String(c.max_uses) : "", expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "", is_active: c.is_active }); setEditing(c); };

  const submit = async () => {
    const body = {
      code: form.code, discount_type: form.discount_type, discount_value: Number(form.discount_value),
      max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
      min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null, is_active: form.is_active,
    };
    const ok = editing
      ? await mutate(`/admin/coupons/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), successMessage: "کد تخفیف ذخیره شد." })
      : await mutate("/admin/coupons", { method: "POST", body: JSON.stringify(body), successMessage: "کد تخفیف ایجاد شد." });
    if (ok) { setCreating(false); setEditing(null); void reload(); }
  };

  const softDelete = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/coupons/${deleting.id}`, { method: "DELETE", successMessage: "کد تخفیف حذف شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  return (
    <div>
      <PageHeader
        title="کدهای تخفیف"
        description={`${filtered.length} کد`}
        action={<button type="button" onClick={openCreate} className="glaze-edge min-h-[44px] rounded-xl bg-lajvard px-5 text-sm text-white transition-all hover:bg-lajvard-deep hover:shadow-lifted dark:bg-lajvard-soft dark:text-char"><Plus className="ml-1 inline h-4 w-4" /> کد جدید</button>}
      />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <Toolbar search={search} onSearch={setSearch} />

      {filtered.length === 0 && !loading ? (
        <EmptyState icon={<Ticket className="h-12 w-12" />} title="هنوز کد تخفیفی ندارید" action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char">+ ایجاد کد</button>} />
      ) : (
        <DataTable
          loading={loading}
          rows={filtered}
          empty="کدی یافت نشد."
          columns={[
            { key: "code", label: "کد", render: (r) => <span className="num-latin font-bold">{r.code}</span> },
            { key: "discount_type", label: "نوع", render: (r) => <span className="text-ink-soft">{r.discount_type === "percentage" ? "درصدی" : "مبلغ ثابت"}</span> },
            { key: "discount_value", label: "مقدار", render: (r) => r.discount_type === "percentage" ? <span className="num-latin">{faNum(r.discount_value)}٪</span> : <span className="num-latin">{faPrice(r.discount_value)}</span> },
            { key: "used_count", label: "مصرف", render: (r) => <span className="num-latin">{faNum(r.used_count)}{r.max_uses ? ` / ${faNum(r.max_uses)}` : ""}</span> },
            { key: "expires_at", label: "انقضا", render: (r) => r.expires_at ? <span className="num-latin text-ink-soft">{r.expires_at.slice(0, 10)}</span> : <span className="text-ink-soft">بدون محدودیت</span> },
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

      <Modal open={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "ویرایش کد تخفیف" : "کد تخفیف جدید"} wide>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="کد تخفیف" required>
              <TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required className="num-latin" />
            </Field>
            <Field label="نوع تخفیف" required>
              <SelectInput value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                <option value="percentage">درصدی</option>
                <option value="fixed">مبلغ ثابت</option>
              </SelectInput>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="مقدار تخفیف" required>
              <TextInput type="number" min={0} value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} required />
            </Field>
            <Field label="حداکثر تخفیف">
              <TextInput type="number" min={0} value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })} placeholder="نامحدود" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="حداقل مبلغ سفارش">
              <TextInput type="number" min={0} value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} />
            </Field>
            <Field label="حداکثر دفعات مصرف">
              <TextInput type="number" min={0} value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="نامحدود" />
            </Field>
          </div>
          <Field label="تاریخ انقضا">
            <DateInput value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
          </Field>
          <FormActions onCancel={() => { setCreating(false); setEditing(null); }} busy={busy} />
        </form>
      </Modal>

      <ConfirmDialog open={deleting !== null} message={`کد «${deleting?.code}» حذف شود؟`} onConfirm={() => void softDelete()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}
