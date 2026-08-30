"use client";

import { useState } from "react";
import { HelpCircle, Plus } from "lucide-react";
import { ConfirmDialog, DataTable, EmptyState, Field, FormActions, Modal, PageHeader, TextInput, TextArea, Toggle, Toolbar } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";

interface FAQ {
  id: string; question: string; answer: string;
  category: string; sort_order: number; is_active: boolean;
}

export default function AdminFAQPage() {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [deleting, setDeleting] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "عمومی", sort_order: 0, is_active: true });

  const { data: items, loading, reload } = useAdminResource<FAQ[]>("/admin/faq");
  const { mutate, busy } = useAdminMutation();

  const filtered = (items ?? []).filter((f) => !search || f.question.includes(search) || f.answer.includes(search));

  const openCreate = () => { setForm({ question: "", answer: "", category: "عمومی", sort_order: 0, is_active: true }); setCreating(true); };
  const openEdit = (f: FAQ) => { setForm({ question: f.question, answer: f.answer, category: f.category, sort_order: f.sort_order, is_active: f.is_active }); setEditing(f); };

  const submit = async () => {
    const ok = editing
      ? await mutate(`/admin/faq/${editing.id}`, { method: "PATCH", body: JSON.stringify(form), successMessage: "سؤال ذخیره شد." })
      : await mutate("/admin/faq", { method: "POST", body: JSON.stringify(form), successMessage: "سؤال ایجاد شد." });
    if (ok) { setCreating(false); setEditing(null); void reload(); }
  };

  const softDelete = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/faq/${deleting.id}`, { method: "DELETE", successMessage: "سؤال حذف شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  return (
    <div>
      <PageHeader
        title="سوالات رایج (FAQ)"
        description={`${filtered.length} سؤال`}
        action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white hover:bg-lajvard-deep dark:bg-lajvard-soft dark:text-char"><Plus className="ml-1 inline h-4 w-4" /> سؤال جدید</button>}
      />

      <Toolbar search={search} onSearch={setSearch} />

      {filtered.length === 0 && !loading ? (
        <EmptyState icon={<HelpCircle className="h-12 w-12" />} title="هنوز سؤالی ندارید" description="سؤالات رایج به مشتریان کمک می‌کنند بدون تماس، پاسخ سؤالاتشان را بیابند." action={<button type="button" onClick={openCreate} className="min-h-[44px] rounded-xl bg-lajvard px-4 text-sm text-white dark:bg-lajvard-soft dark:text-char">+ افزودن سؤال</button>} />
      ) : (
        <DataTable
          loading={loading}
          rows={filtered}
          empty="سؤالی یافت نشد."
          columns={[
            { key: "question", label: "سؤال", render: (r) => <span className="font-medium line-clamp-1">{r.question}</span> },
            { key: "answer", label: "پاسخ", render: (r) => <span className="line-clamp-2 text-ink-soft">{r.answer}</span> },
            { key: "category", label: "دسته", render: (r) => <span className="rounded-full bg-char/10 px-2 py-0.5 text-xs dark:bg-white/10">{r.category}</span> },
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

      <Modal open={creating || editing !== null} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "ویرایش سؤال" : "سؤال جدید"} wide>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
          <Field label="سؤال" required>
            <TextInput value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
          </Field>
          <Field label="پاسخ" required>
            <TextArea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={5} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="دسته‌بندی">
              <TextInput value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="عمومی" />
            </Field>
            <Field label="ترتیب نمایش">
              <TextInput type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </Field>
          </div>
          <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="فعال باشد" />
          <FormActions onCancel={() => { setCreating(false); setEditing(null); }} busy={busy} />
        </form>
      </Modal>

      <ConfirmDialog open={deleting !== null} message={`سؤال «${deleting?.question}» حذف شود؟`} onConfirm={() => void softDelete()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}
