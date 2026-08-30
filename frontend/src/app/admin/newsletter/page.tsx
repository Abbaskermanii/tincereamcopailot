"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";
import { ConfirmDialog, DataTable, EmptyState, PageHeader, Toolbar } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";
import { toPersianDigits } from "@/lib/format";

interface Subscription {
  id: string; email: string; is_active: boolean; created_at: string;
}

export default function AdminNewsletterPage() {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<Subscription | null>(null);
  const { data: subs, loading, reload } = useAdminResource<Subscription[]>("/admin/newsletter");
  const { mutate, busy } = useAdminMutation();

  const filtered = (subs ?? []).filter((s) => !search || s.email.includes(search));

  const remove = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/newsletter/${deleting.id}`, { method: "DELETE", successMessage: "عضویت حذف شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  return (
    <div>
      <PageHeader title="خبرنامه" description={`${filtered.length} عضو`} />

      <Toolbar search={search} onSearch={setSearch} />

      {filtered.length === 0 && !loading ? (
        <EmptyState icon={<Megaphone className="h-12 w-12" />} title="هنوز عضوی ثبت‌نام نکرده" />
      ) : (
        <DataTable
          loading={loading}
          rows={filtered}
          empty="عضوی یافت نشد."
          columns={[
            { key: "email", label: "ایمیل", render: (r) => <span className="num-latin font-medium">{r.email}</span> },
            { key: "is_active", label: "وضعیت", render: (r) => <span className={r.is_active ? "text-firouzeh" : "text-clay"}>{r.is_active ? "فعال" : "غیرفعال"}</span> },
            { key: "created_at", label: "تاریخ", render: (r) => <span className="num-latin text-ink-soft">{toPersianDigits(new Date(r.created_at).toLocaleDateString("fa-IR"))}</span> },
          ]}
          actions={(r) => (
            <button type="button" onClick={() => setDeleting(r)} className="min-h-[36px] rounded-lg px-3 py-1.5 text-sm text-clay hover:bg-clay/10">حذف</button>
          )}
        />
      )}

      <ConfirmDialog open={deleting !== null} message={`عضویت «${deleting?.email}» حذف شود؟`} onConfirm={() => void remove()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}
