"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { DataTable, EmptyState, ErrorBanner, Field, FormActions, Modal, PageHeader, SelectInput, StatusBadge, TextInput, Toolbar } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";
import { faPrice, toPersianDigits } from "@/lib/format";

interface ReturnRequest {
  id: string; order_id: string; order_number: string | null;
  reason: string; status: string; admin_note: string | null;
  refund_amount: number; created_at: string; resolved_at: string | null;
}

export default function AdminReturnsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<ReturnRequest | null>(null);
  const [form, setForm] = useState({ status: "", admin_note: "", refund_amount: "" });

  const { data: items, loading, error, reload } = useAdminResource<ReturnRequest[]>(`/admin/returns${status ? `?status=${status}` : ""}`, [status]);
  const { mutate, busy } = useAdminMutation();

  const filtered = (items ?? []).filter((r) => !search || (r.order_number ?? "").includes(search) || r.reason.includes(search));

  const openEdit = (r: ReturnRequest) => { setForm({ status: r.status, admin_note: r.admin_note ?? "", refund_amount: String(r.refund_amount) }); setEditing(r); };

  const submit = async () => {
    if (!editing) return;
    const body: Record<string, string | number | null> = {};
    if (form.status) body.status = form.status;
    if (form.admin_note) body.admin_note = form.admin_note;
    if (form.refund_amount) body.refund_amount = Number(form.refund_amount);
    const ok = await mutate(`/admin/returns/${editing.id}`, { method: "PATCH", body: JSON.stringify(body), successMessage: "درخواست مرجوعی به‌روزرسانی شد." });
    if (ok) { setEditing(null); void reload(); }
  };

  return (
    <div>
      <PageHeader
        title="مرجوعی‌ها"
        description={`${filtered.length} درخواست مرجوعی`}
      />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <Toolbar search={search} onSearch={setSearch}>
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[160px]">
          <option value="">همه وضعیت‌ها</option>
          <option value="requested">ثبت‌شده</option>
          <option value="approved">تأییدشده</option>
          <option value="rejected">ردشده</option>
          <option value="received">دریافت‌شده</option>
          <option value="refunded">بازگشت وجه</option>
        </SelectInput>
      </Toolbar>

      {filtered.length === 0 && !loading ? (
        <EmptyState icon={<RotateCcw className="h-12 w-12" />} title="درخواست مرجوعی وجود ندارد" description="مرجوعی‌های مشتریان اینجا نمایش داده می‌شوند." />
      ) : (
        <DataTable
          loading={loading}
          rows={filtered}
          empty="درخواستی یافت نشد."
          columns={[
            { key: "order_number", label: "شماره سفارش", render: (r) => <span className="num-latin font-medium">#{r.order_number ?? "—"}</span> },
            { key: "reason", label: "دلیل", render: (r) => <span className="line-clamp-1">{r.reason}</span> },
            { key: "refund_amount", label: "مبلغ بازگشت", render: (r) => <span className="num-latin font-bold">{faPrice(r.refund_amount)}</span> },
            { key: "status", label: "وضعیت", render: (r) => <StatusBadge status={r.status} /> },
            { key: "created_at", label: "تاریخ", render: (r) => <span className="num-latin text-ink-soft">{toPersianDigits(new Date(r.created_at).toLocaleDateString("fa-IR"))}</span> },
          ]}
          actions={(r) => (
            <button type="button" onClick={() => openEdit(r)} className="glaze-edge min-h-[36px] rounded-lg border border-char/20 px-3 py-1.5 text-sm transition-all hover:shadow-shelf dark:border-white/20">بررسی</button>
          )}
        />
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="بررسی درخواست مرجوعی" wide>
        {editing && (
          <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
            <div className="glaze-edge rounded-xl bg-char/5 p-4 text-sm dark:bg-white/5">
              <p><strong>سفارش:</strong> #{editing.order_number}</p>
              <p className="mt-1"><strong>دلیل:</strong> {editing.reason}</p>
            </div>
            <Field label="وضعیت">
              <SelectInput value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="requested">ثبت‌شده</option>
                <option value="approved">تأیید</option>
                <option value="rejected">رد</option>
                <option value="received">دریافت شده</option>
                <option value="refunded">بازگشت وجه</option>
              </SelectInput>
            </Field>
            <Field label="مبلغ بازگشت (تومان)">
              <TextInput type="number" min={0} value={form.refund_amount} onChange={(e) => setForm({ ...form, refund_amount: e.target.value })} className="num-latin" />
            </Field>
            <Field label="یادداشت مدیر">
              <TextInput value={form.admin_note} onChange={(e) => setForm({ ...form, admin_note: e.target.value })} />
            </Field>
            <FormActions onCancel={() => setEditing(null)} busy={busy} />
          </form>
        )}
      </Modal>
    </div>
  );
}
