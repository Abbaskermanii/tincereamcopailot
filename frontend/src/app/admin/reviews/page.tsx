"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { ConfirmDialog, EmptyState, ErrorBanner, Field, FormActions, Modal, PageHeader, TextInput, Toolbar } from "@/components/admin/kit";
import { useAdminMutation, useAdminResource } from "@/lib/admin-hooks";
import { toPersianDigits } from "@/lib/format";

interface Review {
  id: string; product_id: string; product_name: string | null;
  author_name: string; rating: number; title: string | null; body: string;
  is_approved: boolean; is_buyer: boolean;
  helpful_count: number; admin_reply: string | null;
  created_at: string;
}

export default function AdminReviewsPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "pending" | "approved">("all");
  const [editing, setEditing] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState<Review | null>(null);
  const [form, setForm] = useState({ is_approved: true, admin_reply: "" });

  const { data: reviews, loading, error, reload } = useAdminResource<Review[]>("/admin/reviews");
  const { mutate, busy } = useAdminMutation();

  const filtered = (reviews ?? []).filter((r) => {
    if (tab === "pending" && r.is_approved) return false;
    if (tab === "approved" && !r.is_approved) return false;
    if (search && !r.author_name.includes(search) && !(r.product_name ?? "").includes(search)) return false;
    return true;
  });

  const openReply = (r: Review) => { setForm({ is_approved: r.is_approved, admin_reply: r.admin_reply ?? "" }); setEditing(r); };

  const submit = async () => {
    if (!editing) return;
    const ok = await mutate(`/admin/reviews/${editing.id}`, {
      method: "PATCH",
      body: JSON.stringify(form),
      successMessage: "نظر ذخیره شد.",
    });
    if (ok) { setEditing(null); void reload(); }
  };

  const remove = async () => {
    if (!deleting) return;
    const ok = await mutate(`/admin/reviews/${deleting.id}`, { method: "DELETE", successMessage: "نظر حذف شد." });
    if (ok) { setDeleting(null); void reload(); }
  };

  const renderStars = (rating: number) => (
    <span className="num-latin text-amber-500">{"★".repeat(Math.min(rating, 5))}{"☆".repeat(Math.max(0, 5 - rating))}</span>
  );

  return (
    <div>
      <PageHeader title="نظرات" description="مدیریت و مoderation نظرات مشتریان" />

      {error && <ErrorBanner message={error} onRetry={reload} />}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {(["all", "pending", "approved"] as const).map((t) => {
          const labels = { all: "همه", pending: "در انتظار", approved: "تاییدشده" };
          const count = t === "all" ? (reviews?.length ?? 0) : (reviews ?? []).filter((r) => t === "pending" ? !r.is_approved : r.is_approved).length;
          return (
            <button key={t} type="button" onClick={() => setTab(t)} className={`glaze-edge min-h-[36px] rounded-lg px-4 text-sm font-medium transition-all ${tab === t ? "bg-lajvard text-white shadow-shelf dark:bg-lajvard-soft dark:text-char" : "bg-char/5 text-ink-soft hover:bg-char/10 dark:bg-white/10"}`}>
              {labels[t]} ({count})
            </button>
          );
        })}
        <div className="mr-auto">
          <Toolbar search={search} onSearch={setSearch} />
        </div>
      </div>

      {filtered.length === 0 && !loading ? (
        <EmptyState icon={<Star className="h-12 w-12" />} title="نظری موجود نیست" />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="glaze-edge rounded-wobble-card bg-surface p-5 shadow-shelf transition-all duration-300 hover:shadow-lifted dark:bg-black/25">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {renderStars(r.rating)}
                    <span className="font-bold">{r.author_name}</span>
                    {r.is_buyer && <span className="rounded-full bg-firouzeh/20 px-2 py-0.5 text-[10px] font-bold text-firouzeh">خریدار</span>}
                  </div>
                  {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                  <p className="mt-1 text-sm text-ink-soft">{r.body}</p>
                  <p className="mt-2 text-xs text-ink-soft">{r.product_name} — {toPersianDigits(new Date(r.created_at).toLocaleDateString("fa-IR"))}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openReply(r)} className="glaze-edge min-h-[36px] rounded-lg border border-char/20 px-3 py-1.5 text-sm transition-all hover:shadow-shelf dark:border-white/20">
                    {r.admin_reply ? "مشاهده پاسخ" : "پاسخ"}
                  </button>
                  <button type="button" onClick={() => setDeleting(r)} className="min-h-[36px] rounded-lg px-3 py-1.5 text-sm text-clay transition-colors hover:bg-clay/10">حذف</button>
                </div>
              </div>
              {r.admin_reply && (
                <div className="mt-3 rounded-xl bg-char/5 p-3 text-sm dark:bg-white/5">
                  <p className="text-xs font-bold text-lajvard dark:text-lajvard-soft">پاسخ مدیر:</p>
                  <p className="mt-1">{r.admin_reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="مدیریت نظر" wide>
        {editing && (
          <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
            <div className="glaze-edge rounded-xl bg-char/5 p-4 text-sm dark:bg-white/5">
              <p className="font-medium">{editing.author_name} — {renderStars(editing.rating)}</p>
              {editing.title && <p className="mt-1 font-bold">{editing.title}</p>}
              <p className="mt-1 text-ink-soft">{editing.body}</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_approved} onChange={(e) => setForm({ ...form, is_approved: e.target.checked })} className="h-4 w-4 rounded" />
                تایید شود
              </label>
            </div>
            <Field label="پاسخ مدیر">
              <TextInput value={form.admin_reply} onChange={(e) => setForm({ ...form, admin_reply: e.target.value })} placeholder="پاسخ شما به این نظر…" />
            </Field>
            <FormActions onCancel={() => setEditing(null)} busy={busy} />
          </form>
        )}
      </Modal>

      <ConfirmDialog open={deleting !== null} message="این نظر حذف شود؟" onConfirm={() => void remove()} onCancel={() => setDeleting(null)} busy={busy} />
    </div>
  );
}
