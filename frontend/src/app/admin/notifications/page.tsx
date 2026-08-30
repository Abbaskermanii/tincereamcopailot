"use client";

import { useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { EmptyState, ErrorBanner, Field, FormActions, Modal, PageHeader, TextInput, TextArea } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";
import { toPersianDigits } from "@/lib/format";

interface Notification {
  id: string; user_id: string; title: string; body: string;
  is_read: boolean; created_at: string;
}

export default function AdminNotificationsPage() {
  const [broadcasting, setBroadcasting] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });
  const { data: notifications, loading, error, reload } = useAdminResource<Notification[]>("/admin/notifications");
  const { mutate, busy } = useAdminMutation();

  const submitBroadcast = async () => {
    const ok = await mutate("/admin/notifications/broadcast", {
      method: "POST", body: JSON.stringify(form), successMessage: "اعلان به همهٔ کاربران ارسال شد.",
    });
    if (ok) { setBroadcasting(false); setForm({ title: "", body: "" }); void reload(); }
  };

  return (
    <div>
      <PageHeader
        title="اعلان‌ها"
        description="ارسال و مدیریت اعلان‌ها"
        action={
          <button type="button" onClick={() => setBroadcasting(true)} className="glaze-edge min-h-[44px] rounded-xl bg-lajvard px-5 text-sm text-white transition-all hover:bg-lajvard-deep hover:shadow-lifted dark:bg-lajvard-soft dark:text-char">
            <Send className="ml-1 inline h-4 w-4" /> اعلان جدید
          </button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      {(notifications?.length ?? 0) === 0 && !loading ? (
        <EmptyState icon={<Megaphone className="h-12 w-12" />} title="اعلانی ارسال نشده" />
      ) : (
        <div className="space-y-3">
          {(notifications ?? []).map((n) => (
            <div key={n.id} className="glaze-edge flex items-start gap-4 rounded-wobble bg-surface p-5 shadow-shelf transition-all duration-300 hover:shadow-lifted dark:bg-black/25">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lajvard/10 text-lajvard dark:bg-lajvard-soft/15 dark:text-lajvard-soft">
                <Megaphone className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{n.title}</p>
                {n.body && <p className="mt-1 text-sm text-ink-soft">{n.body}</p>}
              </div>
              <span className="shrink-0 num-latin text-xs text-ink-soft">{toPersianDigits(new Date(n.created_at).toLocaleDateString("fa-IR"))}</span>
            </div>
          ))}
        </div>
      )}

      <Modal open={broadcasting} onClose={() => setBroadcasting(false)} title="ارسال اعلان به همه">
        <form onSubmit={(e) => { e.preventDefault(); void submitBroadcast(); }} className="space-y-4">
          <Field label="عنوان اعلان" required>
            <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="متن اعلان">
            <TextArea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} />
          </Field>
          <p className="rounded-xl bg-lajvard/10 p-3 text-xs dark:bg-lajvard-soft/10">این اعلان برای تمام کاربران فعال ارسال می‌شود.</p>
          <FormActions onCancel={() => setBroadcasting(false)} busy={busy} saveLabel="ارسال" />
        </form>
      </Modal>
    </div>
  );
}
