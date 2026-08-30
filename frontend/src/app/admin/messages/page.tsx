"use client";

import { useState } from "react";
import { MessageSquare, MailOpen } from "lucide-react";
import { ConfirmDialog, EmptyState, ErrorBanner, Field, FormActions, Modal, PageHeader, TextInput } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";
import { toPersianDigits } from "@/lib/format";

interface ContactMessage {
  id: string; name: string; email: string | null; phone: string | null;
  subject: string | null; message: string;
  reply: string | null; is_read: boolean;
  created_at: string; replied_at: string | null;
}

export default function AdminMessagesPage() {
  const [tab, setTab] = useState<"all" | "unread" | "replied">("all");
  const [editing, setEditing] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState<ContactMessage | null>(null);
  const [form, setForm] = useState({ reply: "" });

  const { data: messages, loading, error, reload } = useAdminResource<ContactMessage[]>("/admin/messages");
  const { mutate, busy } = useAdminMutation();

  const filtered = (messages ?? []).filter((m) => {
    if (tab === "unread" && m.is_read) return false;
    if (tab === "replied" && !m.replied_at) return false;
    return true;
  });

  const openReply = (m: ContactMessage) => { setForm({ reply: m.reply ?? "" }); setEditing(m); };

  const submit = async () => {
    if (!editing) return;
    const ok = await mutate(`/admin/messages/${editing.id}`, {
      method: "PATCH", body: JSON.stringify({ reply: form.reply, mark_read: true }), successMessage: "پاسخ ذخیره شد.",
    });
    if (ok) { setEditing(null); void reload(); }
  };

  const markRead = async (m: ContactMessage) => {
    await mutate(`/admin/messages/${m.id}/read`, { method: "PATCH" });
    void reload();
  };

  const remove = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/messages/${deleting.id}`, { method: "DELETE", successMessage: "پیام حذف شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  return (
    <div>
      <PageHeader title="پیام‌های تماس" description="پیام‌های دریافتی از فرم تماس" />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {(["all", "unread", "replied"] as const).map((t) => {
          const labels = { all: "همه", unread: "خوانده‌نشده", replied: "پاسخ‌داده‌شده" };
          const count = t === "all" ? (messages?.length ?? 0) : (messages ?? []).filter((m) => t === "unread" ? !m.is_read : !!m.replied_at).length;
          return (
            <button key={t} type="button" onClick={() => setTab(t)} className={`glaze-edge min-h-[36px] rounded-lg px-4 text-sm font-medium transition-all ${tab === t ? "bg-lajvard text-white shadow-shelf dark:bg-lajvard-soft dark:text-char" : "bg-char/5 text-ink-soft hover:bg-char/10 dark:bg-white/10"}`}>
              {labels[t]} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && !loading ? (
        <EmptyState icon={<MessageSquare className="h-12 w-12" />} title="پیامی موجود نیست" />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div key={m.id} className={`glaze-edge rounded-wobble p-5 shadow-shelf transition-all duration-300 hover:shadow-lifted ${m.is_read ? "bg-surface" : "bg-lajvard/5 dark:bg-lajvard-soft/5"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!m.is_read && <span className="h-2.5 w-2.5 rounded-full bg-lajvard dark:bg-lajvard-soft" />}
                    <p className="font-bold">{m.name}</p>
                    {m.subject && <span className="text-ink-soft">— {m.subject}</span>}
                  </div>
                  <div className="mt-1 flex gap-3 text-xs text-ink-soft">
                    {m.email && <span className="num-latin">{m.email}</span>}
                    {m.phone && <span className="num-latin">{m.phone}</span>}
                    <span>{toPersianDigits(new Date(m.created_at).toLocaleDateString("fa-IR"))}</span>
                  </div>
                  <p className="mt-2 text-sm">{m.message}</p>
                </div>
                <div className="flex gap-2">
                  {!m.is_read && (
                    <button type="button" onClick={() => void markRead(m)} className="min-h-[36px] rounded-lg px-3 py-1.5 text-xs text-lajvard transition-colors hover:bg-lajvard/10 dark:text-lajvard-soft">
                      <MailOpen className="ml-1 inline h-3.5 w-3.5" /> خوانده شد
                    </button>
                  )}
                  <button type="button" onClick={() => openReply(m)} className="glaze-edge min-h-[36px] rounded-lg border border-char/20 px-3 py-1.5 text-sm transition-all hover:shadow-shelf dark:border-white/20">
                    {m.reply ? "مشاهده پاسخ" : "پاسخ"}
                  </button>
                  <button type="button" onClick={() => setDeleting(m)} className="min-h-[36px] rounded-lg px-3 py-1.5 text-sm text-clay transition-colors hover:bg-clay/10">حذف</button>
                </div>
              </div>
              {m.reply && (
                <div className="mt-3 rounded-xl bg-char/5 p-3 text-sm dark:bg-white/5">
                  <p className="text-xs font-bold text-firouzeh">پاسخ شما:</p>
                  <p className="mt-1">{m.reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="پاسخ به پیام" wide>
        {editing && (
          <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
            <div className="glaze-edge rounded-xl bg-char/5 p-4 text-sm dark:bg-white/5">
              <p><strong>{editing.name}</strong> {editing.email && <span className="num-latin text-ink-soft">({editing.email})</span>}</p>
              <p className="mt-1">{editing.message}</p>
            </div>
            <Field label="پاسخ شما" required>
              <TextInput value={form.reply} onChange={(e) => setForm({ ...form, reply: e.target.value })} required />
            </Field>
            <FormActions onCancel={() => setEditing(null)} busy={busy} />
          </form>
        )}
      </Modal>

      <ConfirmDialog open={deleting !== null} message="این پیام حذف شود؟" onConfirm={() => void remove()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}
