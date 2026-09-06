"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { ConfirmDialog, EmptyState, ErrorBanner, Field, FormActions, Modal, PageHeader, TextInput, Toolbar } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";
import { toPersianDigits } from "@/lib/format";

interface Question {
  id: string; product_id: string; product_name: string | null;
  author_name: string; question: string; answer: string | null;
  is_published: boolean; created_at: string;
}

export default function AdminQuestionsPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "unanswered" | "answered">("all");
  const [editing, setEditing] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState<Question | null>(null);
  const [form, setForm] = useState({ answer: "", is_published: true });

  const { data: questions, loading, error, reload } = useAdminResource<Question[]>("/admin/questions");
  const { mutate, busy } = useAdminMutation();

  const filtered = (questions ?? []).filter((q) => {
    if (tab === "unanswered" && q.answer) return false;
    if (tab === "answered" && !q.answer) return false;
    if (search && !q.author_name.includes(search) && !(q.product_name ?? "").includes(search)) return false;
    return true;
  });

  const openAnswer = (q: Question) => { setForm({ answer: q.answer ?? "", is_published: q.is_published }); setEditing(q); };

  const submit = async () => {
    if (!editing) return;
    const ok = await mutate(`/admin/questions/${editing.id}`, {
      method: "PATCH", body: JSON.stringify(form), successMessage: "پاسخ ذخیره شد.",
    });
    if (ok) { setEditing(null); void reload(); }
  };

  const remove = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/questions/${deleting.id}`, { method: "DELETE", successMessage: "پرسش حذف شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  return (
    <div>
      <PageHeader title="پرسش‌های محصولات" description="پاسخ به سؤالات مشتریان" />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {(["all", "unanswered", "answered"] as const).map((t) => {
          const labels = { all: "همه", unanswered: "بی‌پاسخ", answered: "پاسخ‌داده‌شده" };
          const count = t === "all" ? (questions?.length ?? 0) : (questions ?? []).filter((q) => t === "unanswered" ? !q.answer : !!q.answer).length;
          return (
            <button key={t} type="button" onClick={() => setTab(t)} className={`glaze-edge min-h-[36px] rounded-lg px-4 text-sm font-medium transition-all ${tab === t ? "bg-lajvard text-white shadow-shelf dark:bg-lajvard-soft dark:text-char" : "bg-char/5 text-ink-soft hover:bg-char/10 dark:bg-white/10"}`}>
              {labels[t]} ({count})
            </button>
          );
        })}
        <div className="mr-auto"><Toolbar search={search} onSearch={setSearch} /></div>
      </div>

      {filtered.length === 0 && !loading ? (
        <EmptyState icon={<MessageSquare className="h-12 w-12" />} title="پرسشی موجود نیست" />
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <div key={q.id} className="glaze-edge rounded-wobble-card bg-surface p-5 shadow-shelf transition-all duration-300 hover:shadow-lifted dark:bg-black/25">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-lajvard dark:text-lajvard-soft">{q.product_name}</p>
                  <p className="mt-1 text-sm"><strong>{q.author_name}:</strong> {q.question}</p>
                  <p className="mt-1 text-xs text-ink-soft">{toPersianDigits(new Date(q.created_at).toLocaleDateString("fa-IR"))}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openAnswer(q)} className="glaze-edge min-h-[36px] rounded-lg border border-char/20 px-3 py-1.5 text-sm transition-all hover:shadow-shelf dark:border-white/20">
                    {q.answer ? "ویرایش پاسخ" : "پاسخ"}
                  </button>
                  <button type="button" onClick={() => setDeleting(q)} className="min-h-[36px] rounded-lg px-3 py-1.5 text-sm text-clay transition-colors hover:bg-clay/10">حذف</button>
                </div>
              </div>
              {q.answer && (
                <div className="mt-3 rounded-xl bg-char/5 p-3 text-sm dark:bg-white/5">
                  <p className="text-xs font-bold text-firouzeh">پاسخ:</p>
                  <p className="mt-1">{q.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="پاسخ به پرسش" wide>
        {editing && (
          <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
            <div className="glaze-edge rounded-xl bg-char/5 p-4 text-sm dark:bg-white/5">
              <p className="font-medium">{editing.product_name} — {editing.author_name}</p>
              <p className="mt-1">{editing.question}</p>
            </div>
            <Field label="پاسخ شما" required>
              <TextInput value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} required />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="h-4 w-4 rounded" />
              نمایش داده شود
            </label>
            <FormActions onCancel={() => setEditing(null)} busy={busy} />
          </form>
        )}
      </Modal>

      <ConfirmDialog open={deleting !== null} message="این پرسش حذف شود؟" onConfirm={() => void remove()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}
